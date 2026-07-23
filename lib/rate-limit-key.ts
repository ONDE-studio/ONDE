/**
 * lib/rate-limit-key.ts
 * Pure crypto functions for rate limit key generation — no external dependencies.
 * Extracted so they can be unit tested without Supabase/Next.js environment.
 */
import crypto from "crypto"

const RATE_LIMIT_SECRET =
  process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-dev-secret"

/**
 * Create a privacy-safe, HMAC-based bucket key.
 * Raw IP is never stored — only an HMAC-SHA256 hash.
 */
export function createBucketKey(identifier: string, endpoint: string): string {
  return crypto
    .createHmac("sha256", RATE_LIMIT_SECRET)
    .update(`${endpoint}:${identifier}`)
    .digest("hex")
    .slice(0, 32)
}

/**
 * Extract a client identifier from request headers.
 * Uses Vercel's trusted headers or falls back to "unknown".
 */
export function getClientIdentifier(req: Request): string {
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  return ip
}
