import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildPackages } from "@/lib/shipping/package-builder"
import { calculateShippingQuotes } from "@/lib/shipping/manager"

const quoteRequestSchema = z.object({
  recipient: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().min(1, "Город обязателен"),
    postalCode: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Корзина не должна быть пустой"),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parseResult = quoteRequestSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Некорректные входные данные", details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const { recipient, items } = parseResult.data
    const supabase = createAdminClient()

    const productIds = items.map((i) => i.productId)
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, price, weight_grams, length_mm, width_mm, height_mm, requires_separate_package")
      .in("id", productIds)

    if (dbError) {
      console.error("Database fetch error for shipping quote:", dbError)
    }

    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]))

    const packableItems = items.map((item) => {
      const p = productMap.get(item.productId)
      return {
        productId: item.productId,
        name: p?.name || "Товар",
        quantity: item.quantity,
        weightGrams: p?.weight_grams,
        lengthMm: p?.length_mm,
        widthMm: p?.width_mm,
        heightMm: p?.height_mm,
        requiresSeparatePackage: p?.requires_separate_package,
      }
    })

    const packages = buildPackages(packableItems)

    const itemsValueRub = items.reduce((sum, item) => {
      const p = productMap.get(item.productId)
      return sum + (p?.price || 0) * item.quantity
    }, 0)

    const quotes = await calculateShippingQuotes({
      recipient,
      packages,
      itemsValueRub,
    })

    return NextResponse.json({ quotes })
  } catch (err: any) {
    console.error("Shipping quote API error:", err)
    return NextResponse.json(
      { error: "Ошибка расчёта доставки. Попробуйте еще раз." },
      { status: 500 }
    )
  }
}
