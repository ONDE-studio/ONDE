/**
 * lib/access-token.ts
 * Server-only module for cryptographic guest order access tokens.
 * Raw token is NEVER stored in the database — only SHA-256 hash.
 */
import crypto from "crypto"

/**
 * Generate a cryptographically secure raw guest access token.
 * Returns base64url-encoded 32 bytes (43 chars, ~256 bits entropy).
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

/**
 * Compute SHA-256 hash of a raw token for storage.
 * The hash is stored in the database; the raw token is given to the user once.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex")
}

/**
 * Constant-time comparison to prevent timing attacks.
 * Compare a supplied raw token against a stored hash.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  if (!rawToken || !storedHash) return false
  const computedHash = hashToken(rawToken)
  // Both must be same length for timingSafeEqual
  if (computedHash.length !== storedHash.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(storedHash, "hex")
    )
  } catch {
    return false
  }
}

/**
 * Generate a cryptographically secure public order number.
 * Format: ONDE-YYYYMMDD-XXXXXX (6 hex chars = 16M combinations/day)
 */
export function generatePublicNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `ONDE-${dateStr}-${suffix}`
}

/**
 * Validate public number format.
 */
export function isValidPublicNumber(num: string): boolean {
  return /^ONDE-\d{8}-[A-F0-9]{6}$/.test(num)
}
