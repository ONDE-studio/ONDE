import "server-only"
import { getEnv } from "@/lib/env"
import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getCdekToken(): Promise<string | null> {
  const env = getEnv()
  if (!env.CDEK_CLIENT_ID || !env.CDEK_CLIENT_SECRET) return null

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  try {
    const res = await fetch(`${env.CDEK_API_BASE_URL}/oauth/token?grant_type=client_credentials&client_id=${env.CDEK_CLIENT_ID}&client_secret=${env.CDEK_CLIENT_SECRET}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.access_token) {
      cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      }
      return data.access_token
    }
  } catch (err) {
    console.error("CDEK auth error:", err)
  }
  return null
}

export class CdekProvider implements ShippingProvider {
  id = "cdek"
  name = "СДЭК"

  isConfigured(): boolean {
    const env = getEnv()
    return Boolean(env.CDEK_ENABLED && env.CDEK_CLIENT_ID && env.CDEK_CLIENT_SECRET)
  }

  async getQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    if (!this.isConfigured()) return []

    const token = await getCdekToken()
    if (!token) return []

    const env = getEnv()

    const reqBody = {
      from_location: {
        city: env.STORE_ORIGIN_CITY,
        postal_code: env.STORE_ORIGIN_POSTAL_CODE,
      },
      to_location: {
        city: input.recipient.city,
        postal_code: input.recipient.postalCode,
        address: input.recipient.address,
      },
      packages: input.packages.map((pkg) => ({
        weight: pkg.weightGrams,
        length: Math.round(pkg.lengthMm / 10),
        width: Math.round(pkg.widthMm / 10),
        height: Math.round(pkg.heightMm / 10),
      })),
    }

    try {
      const res = await fetch(`${env.CDEK_API_BASE_URL}/calculator/tarifflist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
        cache: "no-store",
      })

      if (!res.ok) return []
      const data = await res.json()

      if (!data.tariff_codes || !Array.isArray(data.tariff_codes)) return []

      const quotes: ShippingQuote[] = []
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      for (const t of data.tariff_codes) {
        // Tariff 136 = Door to Door / Door to Warehouse, etc.
        const isPickup = t.tariff_name.toLowerCase().includes("склад") || t.tariff_code === 136 || t.tariff_code === 482
        quotes.push({
          providerId: this.id,
          serviceCode: String(t.tariff_code),
          providerName: this.name,
          serviceName: `${t.tariff_name} (${t.period_min}-${t.period_max} дн.)`,
          deliveryType: isPickup ? "pickup" : "courier",
          price: t.delivery_sum,
          currency: "RUB",
          minDays: t.period_min || 2,
          maxDays: t.period_max || 5,
          quoteId: `cdek_${t.tariff_code}_${Date.now()}`,
          calculatedAt: now,
          expiresAt,
        })
      }

      return quotes
    } catch (err) {
      console.error("CDEK quote error:", err)
      return []
    }
  }
}
