import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendTelegramOrderNotification } from "@/lib/telegram"
import { generateRawToken, hashToken, generatePublicNumber } from "@/lib/access-token"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(120),
  contact: z.string().min(3).max(200),
  address: z.string().min(5).max(500),
  comment: z.string().max(1000).optional(),
  honeypot: z.string().max(0).optional(), // Must be empty
  items: z
    .array(
      z.object({
        productId: z.string().uuid("ID товара должен быть UUID"),
        quantity: z.number().int().min(1).max(99),
        selectedVariant: z.string().max(100).optional(),
      })
    )
    .min(1)
    .max(50),
  deliveryProviderId: z.string().max(100).optional(),
  deliveryProviderName: z.string().max(200).optional(),
  deliveryServiceCode: z.string().max(100).optional(),
  deliveryServiceName: z.string().max(200).optional(),
  deliveryPrice: z.number().nonnegative().nullable().optional(),
  deliveryMinDays: z.number().int().optional(),
  deliveryMaxDays: z.number().int().optional(),
  requiresDeliveryAgreement: z.boolean().optional(),
  userId: z.string().uuid().optional(),
  idempotencyKey: z.string().uuid("idempotencyKey должен быть UUID"),
  consentTerms: z.boolean().refine((v) => v === true, "Необходимо принять условия"),
})

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const clientId = getClientIdentifier(req)
  const rateLimitResult = await checkRateLimit(clientId, "orders:create", {
    windowSeconds: 60,
    maxRequests: 5,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter || 60),
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
  }

  const parseResult = createOrderSchema.safeParse(json)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ошибка валидации данных заказа", details: parseResult.error.format() },
      { status: 400 }
    )
  }

  const payload = parseResult.data

  // 2. Honeypot check
  if (payload.honeypot && payload.honeypot.length > 0) {
    // Bot detected — silently succeed without processing
    return NextResponse.json({ success: true, orderId: "bot-rejected", publicNumber: "ONDE-BOT" })
  }

  const supabase = createAdminClient()

  // 3. Idempotency check — compute payload hash for conflict detection
  const payloadForHash = {
    items: payload.items.map((i) => ({ productId: i.productId, quantity: i.quantity, variant: i.selectedVariant || null })).sort((a, b) => a.productId.localeCompare(b.productId)),
    customerName: payload.customerName.trim(),
    contact: payload.contact.trim(),
    address: payload.address.trim(),
  }
  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payloadForHash))
    .digest("hex")

  const { data: idempotencyResult, error: idemError } = await supabase.rpc("check_idempotency", {
    p_key: payload.idempotencyKey,
    p_payload_hash: payloadHash,
  })

  if (idemError) {
    console.error("[orders/create] idempotency check error:", idemError.message)
    return NextResponse.json({ error: "Ошибка сервера при проверке запроса" }, { status: 500 })
  }

  if (idempotencyResult?.status === "conflict") {
    return NextResponse.json(
      { error: "Запрос с этим ключом уже существует с другими данными. Создайте новый запрос." },
      { status: 409 }
    )
  }

  if (idempotencyResult?.status === "duplicate" && idempotencyResult?.order_id) {
    // Return existing order without creating a new one
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, public_number")
      .eq("id", idempotencyResult.order_id)
      .maybeSingle()

    const { data: existingToken } = await supabase
      .from("order_access_tokens")
      .select("id")
      .eq("order_id", idempotencyResult.order_id)
      .is("revoked_at", null)
      .maybeSingle()

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        publicNumber: existingOrder.public_number,
        // Don't return token on duplicate — user must use original link
        idempotent: true,
      })
    }
  }

  // 4. Load products from DB — never trust client prices
  const productIds = payload.items.map((i) => i.productId)
  const { data: dbProducts, error: dbError } = await supabase
    .from("products")
    .select("id, name, slug, price, images, weight_grams, length_mm, width_mm, height_mm, active, stock_quantity, made_to_order")
    .in("id", productIds)

  if (dbError || !dbProducts || dbProducts.length === 0) {
    return NextResponse.json(
      { error: "Не удалось загрузить данные о товарах" },
      { status: 400 }
    )
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]))

  // 5. Validate and build items snapshot
  let subtotal = 0
  const itemsSnapshot: Array<{
    productId: string
    name: string
    slug: string
    unitPrice: number
    quantity: number
    total: number
    image: string
    selectedVariant: string | null
    weightGrams: number | null
  }> = []

  for (const item of payload.items) {
    const p = productMap.get(item.productId)
    if (!p) {
      return NextResponse.json({ error: `Товар не найден: ${item.productId}` }, { status: 400 })
    }
    if (p.active === false) {
      return NextResponse.json({ error: `Товар снят с продажи: ${p.name}` }, { status: 400 })
    }
    // Check stock if not made-to-order
    if (!p.made_to_order && (p.stock_quantity || 0) < item.quantity) {
      return NextResponse.json(
        { error: `Недостаточно товара на складе: ${p.name}` },
        { status: 400 }
      )
    }

    const unitPrice = Number(p.price) || 0
    const total = unitPrice * item.quantity
    subtotal += total

    itemsSnapshot.push({
      productId: p.id,
      name: p.name,
      slug: p.slug || p.id,
      unitPrice,
      quantity: item.quantity,
      total,
      image: (p.images as string[] | null)?.[0] || "",
      selectedVariant: item.selectedVariant || null,
      weightGrams: p.weight_grams || null,
    })
  }

  // 6. Delivery price — null for manual agreement, validated non-negative if set
  const deliveryPrice = payload.deliveryPrice ?? null
  const estimatedTotal = deliveryPrice !== null ? subtotal + deliveryPrice : null

  // 7. Generate secure guest token
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)

  // 8. Generate public order number with retry
  let publicNumber: string | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generatePublicNumber()
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("public_number", candidate)
      .maybeSingle()
    if (!existing) {
      publicNumber = candidate
      break
    }
  }
  if (!publicNumber) {
    return NextResponse.json({ error: "Не удалось сгенерировать номер заказа" }, { status: 500 })
  }

  // 9. Create order atomically
  const orderId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert order
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      public_number: publicNumber,
      user_id: payload.userId || null,
      customer_name: payload.customerName.trim(),
      contact: payload.contact.trim(),
      recipient_address: payload.address.trim(),
      comment: payload.comment?.trim() || null,
      status: "new",
      currency: "RUB",
      items_snapshot: itemsSnapshot,
      subtotal,
      delivery_provider_id: payload.deliveryProviderId || "telegram_manual",
      delivery_provider_name: payload.deliveryProviderName || "Согласование в Telegram",
      delivery_service_code: payload.deliveryServiceCode || null,
      delivery_service_name: payload.deliveryServiceName || null,
      delivery_price: deliveryPrice,
      delivery_min_days: payload.deliveryMinDays || null,
      delivery_max_days: payload.deliveryMaxDays || null,
      estimated_total: estimatedTotal,
      consent_terms: payload.consentTerms,
      consent_at: now,
      created_at: now,
    })
    .select("id, public_number")
    .single()

  if (orderError || !newOrder) {
    console.error("[orders/create] order insert error:", orderError?.message)
    return NextResponse.json({ error: "Не удалось сохранить заявку" }, { status: 500 })
  }

  // Insert access token (hash only)
  const { error: tokenError } = await supabase.from("order_access_tokens").insert({
    order_id: newOrder.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  })

  if (tokenError) {
    console.error("[orders/create] token insert error:", tokenError.message)
    // Order was created — don't fail, but log
  }

  // Insert outbox event
  const notificationPayload = {
    publicNumber: newOrder.public_number,
    customerName: payload.customerName.trim(),
    contact: payload.contact.trim(),
    address: payload.address.trim(),
    subtotal,
    deliveryName: payload.deliveryProviderName || "Согласование в Telegram",
    deliveryPrice,
    estimatedTotal,
    requiresDeliveryAgreement: payload.requiresDeliveryAgreement ?? deliveryPrice === null,
    items: itemsSnapshot.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
    comment: payload.comment?.trim() || null,
  }

  await supabase.from("notification_outbox").insert({
    order_id: newOrder.id,
    aggregate_id: newOrder.id,
    event_type: "order_created",
    payload: notificationPayload,
    status: "pending",
    next_attempt_at: now,
  })

  // Update idempotency key with order_id
  await supabase
    .from("idempotency_keys")
    .update({ order_id: newOrder.id })
    .eq("key", payload.idempotencyKey)

  // 10. Immediate Telegram attempt (non-blocking for response)
  sendTelegramOrderNotification(notificationPayload).catch((err) => {
    console.error("[orders/create] Telegram immediate send failed (outbox will retry):", err?.message)
  })

  return NextResponse.json({
    success: true,
    orderId: newOrder.id,
    publicNumber: newOrder.public_number,
    accessToken: rawToken, // Raw token returned once — hash stored in DB
  })
}
