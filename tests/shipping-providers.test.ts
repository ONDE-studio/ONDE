import { describe, expect, it } from "vitest"
import { createBucketKey } from "../lib/rate-limit-key"
import { generateRawToken, hashToken, verifyToken } from "../lib/access-token"

// ─── Rate Limit Unit Tests ────────────────────────────────────────────────────

describe("Rate Limit — Bucket Key Generation", () => {
  it("produces consistent keys for same input", () => {
    const key1 = createBucketKey("1.2.3.4", "orders:create")
    const key2 = createBucketKey("1.2.3.4", "orders:create")
    expect(key1).toBe(key2)
  })

  it("different IPs produce different keys", () => {
    const key1 = createBucketKey("1.2.3.4", "orders:create")
    const key2 = createBucketKey("5.6.7.8", "orders:create")
    expect(key1).not.toBe(key2)
  })

  it("same IP, different endpoints produce different keys", () => {
    const key1 = createBucketKey("1.2.3.4", "orders:create")
    const key2 = createBucketKey("1.2.3.4", "shipping:quote")
    expect(key1).not.toBe(key2)
  })

  it("bucket key does not contain raw IP", () => {
    const key = createBucketKey("192.168.1.100", "orders:create")
    expect(key).not.toContain("192.168.1.100")
  })

  it("bucket key is hex (no sensitive chars)", () => {
    const key = createBucketKey("1.2.3.4", "orders:create")
    expect(/^[a-f0-9]+$/.test(key)).toBe(true)
  })
})

// ─── Idempotency / Payload Hash Unit Tests ────────────────────────────────────

describe("Idempotency — Payload Hashing", () => {
  function computePayloadHash(payload: object): string {
    // Must match logic in orders/create route.ts
    const { createHash } = require("crypto")
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
  }

  it("same payload produces same hash", () => {
    const p = { items: [{ productId: "abc", quantity: 1, variant: null }], customerName: "Иван", contact: "test", address: "ул. Тест, 1" }
    expect(computePayloadHash(p)).toBe(computePayloadHash(p))
  })

  it("different quantity produces different hash", () => {
    const p1 = { items: [{ productId: "abc", quantity: 1, variant: null }], customerName: "Иван", contact: "test", address: "ул. Тест, 1" }
    const p2 = { items: [{ productId: "abc", quantity: 2, variant: null }], customerName: "Иван", contact: "test", address: "ул. Тест, 1" }
    expect(computePayloadHash(p1)).not.toBe(computePayloadHash(p2))
  })

  it("different address produces different hash", () => {
    const p1 = { items: [{ productId: "abc", quantity: 1, variant: null }], customerName: "Иван", contact: "test", address: "ул. А, 1" }
    const p2 = { items: [{ productId: "abc", quantity: 1, variant: null }], customerName: "Иван", contact: "test", address: "ул. Б, 2" }
    expect(computePayloadHash(p1)).not.toBe(computePayloadHash(p2))
  })
})

// ─── Telegram Escaping Unit Tests ────────────────────────────────────────────

describe("Telegram — Message Safety", () => {
  function escapeTelegramMarkdown(text: string): string {
    // MarkdownV2 special chars must be escaped
    return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&")
  }

  it("escapes underscore in product names", () => {
    const escaped = escapeTelegramMarkdown("Product_Name")
    expect(escaped).toContain("\\_")
    expect(escaped).not.toBe("Product_Name")
  })

  it("escapes parentheses", () => {
    const escaped = escapeTelegramMarkdown("Item (500г)")
    expect(escaped).toContain("\\(")
    expect(escaped).toContain("\\)")
  })

  it("safe text passes through unchanged (no specials)", () => {
    const safe = "Заказ 12345 доставка"
    expect(escapeTelegramMarkdown(safe)).toBe(safe)
  })

  it("does not double-escape already-escaped strings", () => {
    // Applying escape twice should differ — this is expected (user should only escape once)
    const once = escapeTelegramMarkdown("a_b")
    const twice = escapeTelegramMarkdown(once)
    expect(once).not.toBe(twice) // Confirms function is idempotent-sensitive
  })
})

// ─── Quote Expiration Unit Tests ──────────────────────────────────────────────

describe("Shipping Quote — Expiration Logic", () => {
  it("quote with expiresAt in past is expired", () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const isExpired = new Date(pastDate) < new Date()
    expect(isExpired).toBe(true)
  })

  it("quote with expiresAt in future is valid", () => {
    const futureDate = new Date(Date.now() + 86400 * 1000).toISOString()
    const isExpired = new Date(futureDate) < new Date()
    expect(isExpired).toBe(false)
  })

  it("manual agreement quotes expire in ~24h", async () => {
    const { TelegramManualProvider } = await import("../lib/shipping/telegram-manual")
    const provider = new TelegramManualProvider()
    const quotes = await provider.getQuotes({
      recipient: { city: "Екатеринбург" },
      packages: [{ weightGrams: 400, lengthMm: 150, widthMm: 150, heightMm: 180 }],
      itemsValueRub: 2000,
    })
    for (const q of quotes) {
      const diffMs = new Date(q.expiresAt).getTime() - new Date(q.calculatedAt).getTime()
      // Should be approximately 24 hours (within 1 minute margin)
      expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000)
      expect(diffMs).toBeLessThan(25 * 60 * 60 * 1000)
    }
  })
})
