/**
 * lib/rate-limit.ts
 * Server-only persistent rate limiting via Supabase PostgreSQL RPC.
 * Uses atomic upsert — safe for serverless (no shared in-memory state).
 */
import { createAdminClient } from "@/lib/supabase/admin"
export { createBucketKey, getClientIdentifier } from "@/lib/rate-limit-key"

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
  retryAfter: number
  error?: string
}

/**
 * Check and increment rate limit for a request.
 * Returns whether the request is allowed and when to retry if not.
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  options: {
    windowSeconds?: number
    maxRequests?: number
  } = {}
): Promise<RateLimitResult> {
  const { windowSeconds = 60, maxRequests = 10 } = options

  try {
    const { createBucketKey } = await import("@/lib/rate-limit-key")
    const bucketKey = createBucketKey(identifier, endpoint)
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket_key: bucketKey,
      p_endpoint: endpoint,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    })

    if (error) {
      // On DB error, fail open (allow request) but log
      console.error("[rate-limit] DB error, failing open:", error.message)
      return { allowed: true, count: 0, limit: maxRequests, retryAfter: 0, error: error.message }
    }

    return {
      allowed: data.allowed,
      count: data.count,
      limit: data.limit,
      retryAfter: data.retry_after || 0,
    }
  } catch (err: any) {
    console.error("[rate-limit] Unexpected error:", err?.message)
    return { allowed: true, count: 0, limit: maxRequests, retryAfter: 0, error: err?.message }
  }
}
