export interface ShippingQuoteInput {
  recipient: {
    country?: string
    region?: string
    city: string
    postalCode?: string
    address?: string
    latitude?: number
    longitude?: number
  }
  packages: Array<{
    weightGrams: number
    lengthMm: number
    widthMm: number
    heightMm: number
  }>
  itemsValueRub: number
}

export interface ShippingQuote {
  providerId: string
  serviceCode: string
  providerName: string
  serviceName: string
  deliveryType: "pickup" | "courier" | "post"
  /** null = price requires agreement in Telegram (no fake prices) */
  price: number | null
  /** When true, price is not known and will be agreed in Telegram */
  requiresDeliveryAgreement?: boolean
  /** Human-readable note shown when requiresDeliveryAgreement = true */
  agreementNote?: string
  currency: string
  /** null = duration unknown, agreed in Telegram */
  minDays: number | null
  maxDays: number | null
  estimatedDate?: string
  pickupPointId?: string
  pickupPointName?: string
  pickupPointAddress?: string
  quoteId: string
  calculatedAt: string
  expiresAt: string
  providerPayloadHash?: string
}

export interface ShippingProvider {
  id: string
  name: string
  isConfigured(): boolean
  getQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]>
}
