import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildPackages } from "@/lib/shipping/package-builder"
import { calculateShippingQuotes } from "@/lib/shipping/manager"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const quoteRequestSchema = z.object({
  recipient: z.object({
    country: z.string().max(10).optional(),
    region: z.string().max(100).optional(),
    city: z.string().min(1).max(100),
    postalCode: z.string().max(20).optional(),
    address: z.string().max(300).optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
})

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // Rate limiting: 30 shipping quotes per minute per client
  const clientId = getClientIdentifier(req)
  const rateLimitResult = await checkRateLimit(clientId, "shipping:quote", {
    windowSeconds: 60,
    maxRequests: 30,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter || 60),
        },
      }
    )
  }

  try {
    let json: unknown
    try {
      json = await req.json()
    } catch {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

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
      .select("id, name, price, weight_grams, length_mm, width_mm, height_mm, requires_separate_package, active")
      .in("id", productIds)

    if (dbError) {
      console.error("[shipping/quote] DB fetch error:", dbError.message)
    }

    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]))

    const packableItems = items.map((item) => {
      const p = productMap.get(item.productId)
      return {
        productId: item.productId,
        name: p?.name || "Товар",
        quantity: item.quantity,
        weightGrams: p?.weight_grams ?? undefined,
        lengthMm: p?.length_mm ?? undefined,
        widthMm: p?.width_mm ?? undefined,
        heightMm: p?.height_mm ?? undefined,
        requiresSeparatePackage: p?.requires_separate_package ?? false,
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
    console.error("[shipping/quote] error:", err?.message?.slice(0, 200))
    return NextResponse.json(
      { error: "Ошибка расчёта доставки. Попробуйте ещё раз." },
      { status: 500 }
    )
  }
}
