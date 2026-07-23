import "server-only"
import { getEnv } from "@/lib/env"
import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

export class YandexDeliveryProvider implements ShippingProvider {
  id = "yandex"
  name = "Яндекс Доставка"

  isConfigured(): boolean {
    const env = getEnv()
    return Boolean(env.YANDEX_DELIVERY_ENABLED && env.YANDEX_DELIVERY_API_TOKEN)
  }

  async getQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    if (!this.isConfigured()) return []

    const env = getEnv()

    try {
      const body = {
        items: input.packages.map((pkg, idx) => ({
          title: `Коробка ${idx + 1}`,
          weight: pkg.weightGrams / 1000,
          size: {
            length: pkg.lengthMm / 1000,
            width: pkg.widthMm / 1000,
            height: pkg.heightMm / 1000,
          },
        })),
        route_points: [
          { fullname: `${env.STORE_ORIGIN_CITY}, ${env.STORE_ORIGIN_ADDRESS}` },
          { fullname: `${input.recipient.city}, ${input.recipient.address || ""}` },
        ],
      }

      const res = await fetch(`${env.YANDEX_DELIVERY_API_BASE_URL}/b2b/taxi/check-price`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.YANDEX_DELIVERY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      })

      if (!res.ok) return []
      const data = await res.json()

      if (!data.price) return []

      const price = Math.round(Number(data.price))
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      return [
        {
          providerId: this.id,
          serviceCode: "EXPRESS",
          providerName: this.name,
          serviceName: "Курьер Экспресс",
          deliveryType: "courier",
          price,
          currency: "RUB",
          minDays: 1,
          maxDays: 1,
          quoteId: `yandex_express_${Date.now()}`,
          calculatedAt: now,
          expiresAt,
        },
      ]
    } catch (err) {
      console.error("Yandex Delivery quote error:", err)
      return []
    }
  }
}
