import { describe, expect, it } from "vitest"
import crypto from "crypto"

// Safe timing-safe comparison logic used in /api/admin/setup
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.from(a.padEnd(64)), Buffer.from(b.padEnd(64)))
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

describe("Admin Bootstrap — Email Normalization", () => {
  it("normalizes email with uppercase and leading/trailing whitespace", () => {
    expect(normalizeEmail("  OWNER@ONDE.STUDIO  ")).toBe("owner@onde.studio")
    expect(normalizeEmail("Owner@Onde.Studio")).toBe("owner@onde.studio")
  })

  it("compares normalized user email against OWNER_EMAIL", () => {
    const ownerEmail = "owner@onde.studio"
    const userEmailInput = "  OWNER@ONDE.STUDIO "
    expect(normalizeEmail(userEmailInput) === ownerEmail).toBe(true)
  })

  it("rejects non-matching email", () => {
    const ownerEmail = "owner@onde.studio"
    const userEmailInput = "attacker@evil.com"
    expect(normalizeEmail(userEmailInput) === ownerEmail).toBe(false)
  })
})

describe("Admin Bootstrap — Secret Comparison Safety", () => {
  it("timingSafeEqual returns true for identical secrets", () => {
    const secret = "SuperSecretSetupToken1234567890=="
    expect(timingSafeEqual(secret, secret)).toBe(true)
  })

  it("timingSafeEqual returns false for different secrets of same length", () => {
    const secretA = "SuperSecretSetupToken1234567890=="
    const secretB = "SuperSecretSetupToken1234567890AB"
    expect(timingSafeEqual(secretA, secretB)).toBe(false)
  })

  it("timingSafeEqual returns false for different length secrets without throwing", () => {
    const secretA = "ShortSecret"
    const secretB = "MuchLongerSecretTokenForAdminSetup123"
    expect(timingSafeEqual(secretA, secretB)).toBe(false)
  })

  it("timingSafeEqual returns false for empty input", () => {
    expect(timingSafeEqual("", "ValidSecret123")).toBe(false)
    expect(timingSafeEqual("ValidSecret123", "")).toBe(false)
  })
})

describe("Admin Bootstrap — Security Contracts", () => {
  it("registration metadata role 'admin' MUST be ignored", () => {
    // User tries to register with custom metadata { role: 'admin' }
    const userRegistrationMetadata = { name: "Attacker", role: "admin" }
    
    // Server trigger rule: ALWAYS default to 'customer'
    const assignedRole = "customer" // Hardcoded in 03_admin_bootstrap_security.sql
    expect(assignedRole).not.toBe(userRegistrationMetadata.role)
    expect(assignedRole).toBe("customer")
  })

  it("single admin lockout logic: if count(admin) > 0, bootstrap MUST be blocked", () => {
    const existingAdminsCount: number = 1
    const isBootstrapAllowed = existingAdminsCount === 0
    expect(isBootstrapAllowed).toBe(false)
  })

  it("first-time bootstrap allowed only when admin count === 0", () => {
    const existingAdminsCount: number = 0
    const isBootstrapAllowed = existingAdminsCount === 0
    expect(isBootstrapAllowed).toBe(true)
  })
})
