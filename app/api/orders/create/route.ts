import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendTelegramOrderNotification } from "@/lib/telegram"
import crypto from "crypto"

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Имя слишком короткое"),
  contact: z.string().min(3, "Укажите контакт (телефон или Telegram)"),
  address: z.string().min(5, "Укажите полный адрес доставки"),
  comment: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        selectedVariant: z.string().optional(),
      })
    )
    .min(1, "Корзина не должна быть пустой"),
  deliveryProviderId: z.string().optional(),
  deliveryProviderName: z.string().optional(),
  deliveryServiceCode: z.string().optional(),
  deliveryServiceName: z.string().optional(),
  deliveryPrice: z.number().nonnegative().optional().default(0),
  deliveryMinDays: z.number().optional(),
  deliveryMaxDays: z.number().optional(),
  userId: z.string().optional(),
  idempotencyKey: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parseResult = createOrderSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ошибка валидации данных заказа", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const payload = parseResult.data
    const idempotencyKey = payload.idempotencyKey || req.headers.get("x-idempotency-key") || null
    const supabase = createAdminClient()

    // 1. Idempotency Check: if key provided and exists, return existing order
    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, public_number, access_token")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          orderId: existingOrder.id,
          publicNumber: existingOrder.public_number,
          accessToken: existingOrder.access_token,
          idempotent: true,
        })
      }
    }

    // 2. Recalculate price from DB (never trust client values)
    const productIds = payload.items.map((i) => i.productId)
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, slug, price, images, weight_grams, length_mm, width_mm, height_mm, active")
      .in("id", productIds)

    if (dbError || !dbProducts) {
      return NextResponse.json(
        { error: "Не удалось получить актуальные данные о товарах из базы" },
        { status: 400 }
      )
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotal = 0
    const itemsSnapshot = payload.items.map((item) => {
      const p = productMap.get(item.productId)
      if (!p || p.active === false) {
        throw new Error(`Товар "${item.productId}" недоступен или снят с продажи`)
      }
      const unitPrice = p.price || 0
      const itemTotal = unitPrice * item.quantity
      subtotal += itemTotal

      return {
        productId: p.id,
        name: p.name,
        slug: p.slug || p.id,
        unitPrice,
        quantity: item.quantity,
        total: itemTotal,
        image: p.images?.[0] || "",
        selectedVariant: item.selectedVariant || null,
        weightGrams: p.weight_grams,
        lengthMm: p.length_mm,
        widthMm: p.width_mm,
        heightMm: p.height_mm,
      }
    })

    const finalTotal = subtotal + (payload.deliveryPrice || 0)

    // 3. Cryptographically secure public_number generation with collision retry loop
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    let publicNumber = ""
    let newOrder = null
    let insertError = null
    const accessToken = crypto.randomBytes(32).toString("hex")

    for (let attempt = 0; attempt < 5; attempt++) {
      const hexSuffix = crypto.randomBytes(2).toString("hex").toUpperCase()
      publicNumber = `ONDE-${dateStr}-${hexSuffix}`

      const orderRecord = {
        public_number: publicNumber,
        idempotency_key: idempotencyKey,
        user_id: payload.userId || null,
        customer_name: payload.customerName,
        contact: payload.contact,
        recipient_address: payload.address,
        comment: payload.comment || null,
        status: "new",
        currency: "RUB",
        items_snapshot: itemsSnapshot,
        subtotal,
        delivery_provider_id: payload.deliveryProviderId || "telegram_manual",
        delivery_provider_name: payload.deliveryProviderName || "Индивидуальный расчёт",
        delivery_service_code: payload.deliveryServiceCode || null,
        delivery_service_name: payload.deliveryServiceName || null,
        delivery_price: payload.deliveryPrice || 0,
        delivery_min_days: payload.deliveryMinDays || null,
        delivery_max_days: payload.deliveryMaxDays || null,
        estimated_total: finalTotal,
        access_token: accessToken,
        created_at: new Date().toISOString(),
      }

      const res = await supabase
        .from("orders")
        .insert([orderRecord])
        .select("id, public_number, access_token")
        .single()

      if (!res.error) {
        newOrder = res.data
        break
      }
      insertError = res.error
    }

    if (!newOrder) {
      console.error("Order insertion failed after retries:", insertError)
      return NextResponse.json(
        { error: "Не удалось сохранить заявку на сервер" },
        { status: 500 }
      )
    }

    // 4. Save notification outbox record & send Telegram notification
    const notificationPayload = {
      publicNumber: newOrder.public_number,
      customerName: payload.customerName,
      contact: payload.contact,
      address: payload.address,
      subtotal,
      deliveryName: payload.deliveryProviderName || "Индивидуальный расчёт",
      deliveryPrice: payload.deliveryPrice || 0,
      total: finalTotal,
      items: itemsSnapshot.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
      comment: payload.comment,
    }

    await supabase.from("notification_outbox").insert([
      {
        order_id: newOrder.id,
        event_type: "order_created",
        payload: notificationPayload,
        status: "pending",
      },
    ])

    // Immediate attempt to send Telegram bot message
    await sendTelegramOrderNotification(notificationPayload)

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      publicNumber: newOrder.public_number,
      accessToken: newOrder.access_token,
    })
  } catch (err: any) {
    console.error("Order creation API error:", err)
    return NextResponse.json(
      { error: err.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
