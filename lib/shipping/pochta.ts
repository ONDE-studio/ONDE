import "server-only"
import { getEnv } from "@/lib/env"
import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

export class RussianPostProvider implements ShippingProvider {
  id = "russian_post"
  name = "Почта России"

  isConfigured(): boolean {
    const env = getEnv()
    return Boolean(env.RUSSIAN_POST_ENABLED && env.RUSSIAN_POST_API_TOKEN)
  }

  async getQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    if (!this.isConfigured()) return []

    const env = getEnv()
    const totalWeight = input.packages.reduce((acc, p) => acc + p.weightGrams, 0)
    const postalCode = input.recipient.postalCode || "101000"

    try {
      const url = `https://tariff.pochta.ru/tariff/v1/calculate/tariff?json&object=23030&from=${env.STORE_ORIGIN_POSTAL_CODE}&to=${postalCode}&weight=${totalWeight}`
      const res = await fetch(url, { cache: "no-store" })

      if (!res.ok) return []
      const data = await res.json()

      if (!data.paymoney) return []

      const priceRub = Math.round(data.paymoney / 100)
      const minDays = data.delivery?.min || 3
      const maxDays = data.delivery?.max || 7

      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      return [
        {
          providerId: this.id,
          serviceCode: "PARCEL_REGULAR",
          providerName: this.name,
          serviceName: `Посылка обыкновенная (${minDays}-${maxDays} дн.)`,
          deliveryType: "post",
          price: priceRub,
          currency: "RUB",
          minDays,
          maxDays,
          quoteId: `pochta_23030_${Date.now()}`,
          calculatedAt: now,
          expiresAt,
        },
      ]
    } catch (err) {
      console.error("Russian Post calculation error:", err)
      return []
    }
  }
}
