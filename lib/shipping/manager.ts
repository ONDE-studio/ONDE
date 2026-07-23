import "server-only"
import { CdekProvider } from "./cdek"
import { RussianPostProvider } from "./pochta"
import { TelegramManualProvider } from "./telegram-manual"
import { ShippingProvider, ShippingQuote, ShippingQuoteInput } from "./types"
import { YandexDeliveryProvider } from "./yandex"

const providers: ShippingProvider[] = [
  new CdekProvider(),
  new RussianPostProvider(),
  new YandexDeliveryProvider(),
  new TelegramManualProvider(),
]

export async function calculateShippingQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]> {
  const activeProviders = providers.filter((p) => p.isConfigured())

  const results = await Promise.allSettled(
    activeProviders.map((provider) => provider.getQuotes(input))
  )

  const quotes: ShippingQuote[] = []

  for (const res of results) {
    if (res.status === "fulfilled") {
      quotes.push(...res.value)
    }
  }

  // If no external provider gave valid quotes, ensure Telegram manual option is present
  if (!quotes.some((q) => q.providerId === "telegram_manual")) {
    const manualProvider = new TelegramManualProvider()
    const manualQuotes = await manualProvider.getQuotes(input)
    quotes.push(...manualQuotes)
  }

  return quotes
}
