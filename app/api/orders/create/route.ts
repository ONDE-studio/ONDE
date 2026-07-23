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
    const supabase = createAdminClient()

    // 1. Recalculate price from DB
    const productIds = payload.items.map((i) => i.productId)
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, slug, price, images, weight_grams, length_mm, width_mm, height_mm")
      .in("id", productIds)

    if (dbError || !dbProducts) {
      return NextResponse.json(
        { error: "Не удалось получить актуальные данные о товарах" },
        { status: 400 }
      )
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotal = 0
    const itemsSnapshot = payload.items.map((item) => {
      const p = productMap.get(item.productId)
      if (!p) {
        throw new Error(`Товар с ID ${item.productId} не найден в каталоге`)
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

    // 2. Generate unique public readable number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const publicNumber = `ONDE-${dateStr}-${randomSuffix}`

    const finalTotal = subtotal + (payload.deliveryPrice || 0)

    // 3. Create guest signed view token
    const accessToken = crypto.randomBytes(24).toString("hex")

    const orderRecord = {
      public_number: publicNumber,
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

    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert([orderRecord])
      .select("id, public_number, access_token")
      .single()

    if (insertError) {
      console.error("Order insertion error:", insertError)
      return NextResponse.json(
        { error: "Не удалось сохранить заявку на сервер" },
        { status: 500 }
      )
    }

    // 4. Send Telegram notification
    await sendTelegramOrderNotification({
      publicNumber,
      customerName: payload.customerName,
      contact: payload.contact,
      address: payload.address,
      subtotal,
      deliveryName: payload.deliveryProviderName || "Индивидуальный расчёт",
      deliveryPrice: payload.deliveryPrice || 0,
      total: finalTotal,
      items: itemsSnapshot.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
      comment: payload.comment,
    })

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
