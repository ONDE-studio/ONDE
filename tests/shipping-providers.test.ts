import { describe, expect, it } from "vitest"
import { TelegramManualProvider } from "../lib/shipping/telegram-manual"

describe("Shipping Providers Integration & Contract Tests", () => {
  it("TelegramManualProvider returns manual quotes without errors", async () => {
    const provider = new TelegramManualProvider()
    expect(provider.isConfigured()).toBe(true)

    const quotes = await provider.getQuotes({
      recipient: { city: "Екатеринбург" },
      packages: [{ weightGrams: 500, lengthMm: 150, widthMm: 150, heightMm: 180 }],
      itemsValueRub: 1500,
    })

    expect(quotes.length).toBeGreaterThan(0)
    expect(quotes[0]).toHaveProperty("quoteId")
    expect(quotes[0]).toHaveProperty("calculatedAt")
    expect(quotes[0]).toHaveProperty("expiresAt")
  })
})
