import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendTelegramOrderNotification } from "@/lib/telegram"
import crypto from "crypto"

// Constant-time comparison to prevent timing attacks on the cron secret
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to prevent timing leak on length difference
    crypto.timingSafeEqual(Buffer.from(a.padEnd(64)), Buffer.from(b.padEnd(64)))
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // 1. Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[process-notifications] CRON_SECRET not configured")
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  const authHeader = req.headers.get("authorization")
  const suppliedSecret = authHeader?.replace("Bearer ", "") || ""

  if (!safeCompare(suppliedSecret, cronSecret)) {
    // Don't reveal whether secret is wrong or missing
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const workerId = `worker-${crypto.randomBytes(4).toString("hex")}`
  const supabase = createAdminClient()

  try {
    // 2. Claim pending events with FOR UPDATE SKIP LOCKED via RPC
    const { data: events, error: claimError } = await supabase.rpc("claim_outbox_events", {
      p_worker_id: workerId,
      p_batch_size: 10,
    })

    if (claimError) {
      console.error("[process-notifications] claim error:", claimError.message)
      return NextResponse.json({ error: "Failed to claim events" }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending events" })
    }

    const results = { sent: 0, failed: 0, dead_letter: 0 }

    // 3. Process each event
    for (const event of events) {
      const MAX_ATTEMPTS = event.max_attempts || 5
      const attemptNumber = (event.attempts || 0) + 1

      try {
        // Send notification based on event type
        if (event.event_type === "order_created") {
          await sendTelegramOrderNotification(event.payload)
        }

        // Mark as sent
        await supabase
          .from("notification_outbox")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            attempts: attemptNumber,
            locked_at: null,
            locked_by: null,
            last_error: null,
          })
          .eq("id", event.id)

        results.sent++
      } catch (err: any) {
        const sanitizedError = err?.message?.slice(0, 200) || "Unknown error"
        // Don't log Telegram tokens or raw payloads
        console.error(`[process-notifications] event ${event.id} failed:`, sanitizedError)

        if (attemptNumber >= MAX_ATTEMPTS) {
          // Move to dead letter
          await supabase
            .from("notification_outbox")
            .update({
              status: "dead_letter",
              attempts: attemptNumber,
              locked_at: null,
              locked_by: null,
              last_error: sanitizedError,
            })
            .eq("id", event.id)
          results.dead_letter++
        } else {
          // Exponential backoff: 1min, 5min, 25min, 2h, ...
          const backoffSeconds = Math.min(60 * Math.pow(5, attemptNumber - 1), 7200)
          const nextAttempt = new Date(Date.now() + backoffSeconds * 1000).toISOString()

          await supabase
            .from("notification_outbox")
            .update({
              status: "failed",
              attempts: attemptNumber,
              next_attempt_at: nextAttempt,
              locked_at: null,
              locked_by: null,
              last_error: sanitizedError,
            })
            .eq("id", event.id)
          results.failed++
        }
      }
    }

    return NextResponse.json({
      processed: events.length,
      ...results,
    })
  } catch (err: any) {
    console.error("[process-notifications] unexpected error:", err?.message?.slice(0, 200))
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Reject GET requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
