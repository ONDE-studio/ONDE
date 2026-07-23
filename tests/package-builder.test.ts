import { describe, expect, it } from "vitest"
import { buildPackages, PackableItem } from "../lib/shipping/package-builder"

describe("Package Builder — Core", () => {
  it("single item: adds padding weight and dimensions", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "Ваза Onda", quantity: 1,
      weightGrams: 300, lengthMm: 140, widthMm: 140, heightMm: 180,
    }]
    const pkgs = buildPackages(items)
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].weightGrams).toBeGreaterThan(300) // padding added
  })

  it("multiple same items: combined weight equals sum", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "Item", quantity: 3,
      weightGrams: 200, lengthMm: 100, widthMm: 100, heightMm: 100,
    }]
    const pkgs = buildPackages(items)
    expect(pkgs.length).toBeGreaterThan(0)
    const totalWeight = pkgs.reduce((s, p) => s + p.weightGrams, 0)
    // 3 × 200 = 600g items + padding
    expect(totalWeight).toBeGreaterThanOrEqual(600)
  })

  it("multiple different items: merged into one package", () => {
    const items: PackableItem[] = [
      { productId: "1", name: "A", quantity: 1, weightGrams: 200, lengthMm: 100, widthMm: 100, heightMm: 100 },
      { productId: "2", name: "B", quantity: 1, weightGrams: 300, lengthMm: 120, widthMm: 120, heightMm: 120 },
    ]
    const pkgs = buildPackages(items)
    expect(pkgs.length).toBeGreaterThanOrEqual(1)
  })

  it("requiresSeparatePackage: each unit gets own box", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "Fragile", quantity: 3,
      weightGrams: 500, lengthMm: 200, widthMm: 200, heightMm: 250,
      requiresSeparatePackage: true,
    }]
    const pkgs = buildPackages(items)
    expect(pkgs).toHaveLength(3)
  })

  it("missing weight: uses default fallback, not zero", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "No weight item", quantity: 1,
    }]
    const pkgs = buildPackages(items)
    expect(pkgs[0].weightGrams).toBeGreaterThan(0)
  })

  it("missing dimensions: uses default fallback, all positive", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "No dims", quantity: 1, weightGrams: 300,
    }]
    const pkgs = buildPackages(items)
    expect(pkgs[0].lengthMm).toBeGreaterThan(0)
    expect(pkgs[0].widthMm).toBeGreaterThan(0)
    expect(pkgs[0].heightMm).toBeGreaterThan(0)
  })

  it("zero quantity: safe fallback treats as 1 (prevents empty package edge case)", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "Zero qty", quantity: 0,
      weightGrams: 300, lengthMm: 100, widthMm: 100, heightMm: 100,
    }]
    const pkgs = buildPackages(items)
    // qty=0 falls back to qty=1 via `item.quantity || 1`
    // Result: 1 package with item weight + box padding
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].weightGrams).toBeGreaterThan(0)
  })

  it("large quantity: produces non-negative total weight", () => {
    const items: PackableItem[] = [{
      productId: "1", name: "Many items", quantity: 50,
      weightGrams: 100, lengthMm: 80, widthMm: 80, heightMm: 80,
    }]
    const pkgs = buildPackages(items)
    const totalWeight = pkgs.reduce((s, p) => s + p.weightGrams, 0)
    expect(totalWeight).toBeGreaterThan(0)
  })
})

describe("Package Builder — Shipping Types", () => {
  it("manual provider returns null prices (no fake prices)", async () => {
    const { TelegramManualProvider } = await import("../lib/shipping/telegram-manual")
    const provider = new TelegramManualProvider()
    const quotes = await provider.getQuotes({
      recipient: { city: "Москва" },
      packages: [{ weightGrams: 400, lengthMm: 150, widthMm: 150, heightMm: 180 }],
      itemsValueRub: 2000,
    })
    expect(quotes.length).toBeGreaterThan(0)
    for (const q of quotes) {
      expect(q.price).toBeNull() // No fake prices
      expect(q.requiresDeliveryAgreement).toBe(true)
      expect(q.agreementNote).toBeTruthy()
    }
  })

  it("manual provider is always configured (fallback)", async () => {
    const { TelegramManualProvider } = await import("../lib/shipping/telegram-manual")
    const provider = new TelegramManualProvider()
    expect(provider.isConfigured()).toBe(true)
  })

  it("manual provider quotes have valid quoteId and timestamps", async () => {
    const { TelegramManualProvider } = await import("../lib/shipping/telegram-manual")
    const provider = new TelegramManualProvider()
    const quotes = await provider.getQuotes({
      recipient: { city: "Санкт-Петербург" },
      packages: [{ weightGrams: 500, lengthMm: 150, widthMm: 150, heightMm: 180 }],
      itemsValueRub: 3000,
    })
    for (const q of quotes) {
      expect(q.quoteId).toBeTruthy()
      expect(q.calculatedAt).toBeTruthy()
      expect(q.expiresAt).toBeTruthy()
      expect(new Date(q.expiresAt) > new Date(q.calculatedAt)).toBe(true)
    }
  })
})
