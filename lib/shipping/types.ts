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
  price: number
  currency: string
  minDays: number
  maxDays: number
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
