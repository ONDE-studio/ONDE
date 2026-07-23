import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"

export class TelegramManualProvider implements ShippingProvider {
  id = "telegram_manual"
  name = "Выбор службы доставки"

  isConfigured(): boolean {
    return true // Always available as fallback
  }

  async getQuotes(_input: ShippingQuoteInput): Promise<ShippingQuote[]> {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    return [
      {
        providerId: "cdek_manual",
        serviceCode: "CDEK_PICKUP",
        providerName: "СДЭК",
        serviceName: "Доставка до ПВЗ или курьером СДЭК (расчет при согласовании)",
        deliveryType: "pickup",
        price: 0,
        currency: "RUB",
        minDays: 2,
        maxDays: 5,
        quoteId: `cdek_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "yandex_manual",
        serviceCode: "YANDEX_MARKET",
        providerName: "Яндекс Маркет / Яндекс Доставка",
        serviceName: "Доставка курьером или до ПВЗ Яндекс",
        deliveryType: "courier",
        price: 0,
        currency: "RUB",
        minDays: 1,
        maxDays: 3,
        quoteId: `yandex_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "ozon_manual",
        serviceCode: "OZON_AVITO",
        providerName: "Ozon / Авито Доставка",
        serviceName: "Отправка через удобный пункт выдачи Ozon или Авито",
        deliveryType: "pickup",
        price: 0,
        currency: "RUB",
        minDays: 2,
        maxDays: 6,
        quoteId: `ozon_manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
      {
        providerId: "telegram_manual",
        serviceCode: "MANUAL_TELEGRAM",
        providerName: "Персональное согласование",
        serviceName: "Расчёт куратором в Telegram под ваш адрес",
        deliveryType: "courier",
        price: 0,
        currency: "RUB",
        minDays: 1,
        maxDays: 7,
        quoteId: `manual_${Date.now()}`,
        calculatedAt: now,
        expiresAt,
      },
    ]
  }
}
