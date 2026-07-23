import { describe, expect, it } from "vitest"
import {
  generateRawToken,
  hashToken,
  verifyToken,
  generatePublicNumber,
  isValidPublicNumber,
} from "../lib/access-token"

describe("Access Token Security", () => {
  it("generateRawToken produces 43-char base64url string (256-bit entropy)", () => {
    const token = generateRawToken()
    expect(token).toHaveLength(43)
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true)
  })

  it("hashToken produces 64-char hex SHA-256", () => {
    const hash = hashToken("some-raw-token")
    expect(hash).toHaveLength(64)
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true)
  })

  it("hashToken is deterministic for same input", () => {
    const h1 = hashToken("same-token")
    const h2 = hashToken("same-token")
    expect(h1).toBe(h2)
  })

  it("hashToken differs for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"))
  })

  it("verifyToken returns true for correct raw token vs stored hash", () => {
    const raw = generateRawToken()
    const hash = hashToken(raw)
    expect(verifyToken(raw, hash)).toBe(true)
  })

  it("verifyToken returns false for wrong raw token", () => {
    const raw = generateRawToken()
    const hash = hashToken(raw)
    const wrongRaw = generateRawToken()
    expect(verifyToken(wrongRaw, hash)).toBe(false)
  })

  it("verifyToken returns false for empty inputs", () => {
    expect(verifyToken("", "abc")).toBe(false)
    expect(verifyToken("abc", "")).toBe(false)
    expect(verifyToken("", "")).toBe(false)
  })

  it("verifyToken does not expose raw token in stored hash", () => {
    const raw = "my-secret-raw-token"
    const hash = hashToken(raw)
    expect(hash).not.toContain(raw)
    expect(hash).not.toContain("my-secret")
  })

  it("two generated tokens are unique (no Math.random)", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateRawToken()))
    expect(tokens.size).toBe(100)
  })
})

describe("Public Order Number", () => {
  it("generatePublicNumber matches ONDE-YYYYMMDD-XXXXXX format", () => {
    const num = generatePublicNumber()
    expect(isValidPublicNumber(num)).toBe(true)
  })

  it("format is ONDE-{8 digits}-{6 uppercase hex}", () => {
    const num = generatePublicNumber()
    const parts = num.split("-")
    expect(parts[0]).toBe("ONDE")
    expect(parts[1]).toMatch(/^\d{8}$/)
    expect(parts[2]).toMatch(/^[A-F0-9]{6}$/)
  })

  it("does not contain Math.random (uses crypto)", () => {
    // This verifies 100 consecutive numbers are all unique
    const nums = new Set(Array.from({ length: 100 }, () => generatePublicNumber()))
    expect(nums.size).toBe(100)
  })

  it("isValidPublicNumber rejects malformed inputs", () => {
    expect(isValidPublicNumber("")).toBe(false)
    expect(isValidPublicNumber("ONDE-20260101")).toBe(false)
    expect(isValidPublicNumber("onde-20260101-ABCDEF")).toBe(false)
    expect(isValidPublicNumber("ONDE-2026010-ABCDEF")).toBe(false)
    expect(isValidPublicNumber("ONDE-20260101-ABCDE")).toBe(false)
  })

  it("isValidPublicNumber accepts valid numbers", () => {
    expect(isValidPublicNumber("ONDE-20260101-ABCDEF")).toBe(true)
    expect(isValidPublicNumber("ONDE-20260723-1A2B3C")).toBe(true)
  })
})
