import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const setupSchema = z.object({
  secret: z.string().min(1, "Введите секрет первоначальной настройки"),
})

// Safe constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.from(a.padEnd(64)), Buffer.from(b.padEnd(64)))
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  // 1. Rate limiting (max 5 attempts per 15 minutes)
  const clientId = getClientIdentifier(req)
  const rateLimitResult = await checkRateLimit(clientId, "admin:setup", {
    windowSeconds: 900, // 15 min
    maxRequests: 5,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток настройки. Попробуйте через 15 минут." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitResult.retryAfter || 900) },
      }
    )
  }

  // 2. Server configuration validation
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase()
  const setupSecret = process.env.ADMIN_SETUP_SECRET

  if (!ownerEmail || !setupSecret) {
    console.error("[admin/setup] Config missing: OWNER_EMAIL or ADMIN_SETUP_SECRET is not set")
    return NextResponse.json(
      { error: "Первоначальная настройка не сконфигурирована на сервере. Обратитесь к администратору." },
      { status: 503 }
    )
  }

  // 3. User authentication verification (use auth.getUser for server verification)
  const serverSupabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await serverSupabase.auth.getUser()

  if (userError || !user || !user.email) {
    return NextResponse.json(
      { error: "Для первоначальной настройки необходимо войти в аккаунт" },
      { status: 401 }
    )
  }

  const userEmail = user.email.trim().toLowerCase()

  // 4. Verify OWNER_EMAIL match
  if (userEmail !== ownerEmail) {
    console.warn(`[admin/setup] Email mismatch: authenticated user '${userEmail}' !== OWNER_EMAIL '${ownerEmail}'`)
    return NextResponse.json(
      { error: "Текущий аккаунт не уполномочен выполнять первоначальную настройку" },
      { status: 403 }
    )
  }

  // 5. Verify no existing admin in DB (One-time bootstrap lockout)
  const adminSupabase = createAdminClient()
  const { data: existingAdmin, error: adminCheckError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)

  if (adminCheckError) {
    console.error("[admin/setup] DB check error:", adminCheckError.message)
    return NextResponse.json({ error: " Ошибка проверки статуса администратора" }, { status: 500 })
  }

  if (existingAdmin && existingAdmin.length > 0) {
    return NextResponse.json(
      { error: "Первоначальная настройка уже завершена. Администратор уже создан." },
      { status: 403 }
    )
  }

  // 6. Payload validation & timing-safe secret check
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
  }

  const parseResult = setupSchema.safeParse(json)
  if (!parseResult.success) {
    return NextResponse.json({ error: "Укажите секрет настройки" }, { status: 400 })
  }

  const suppliedSecret = parseResult.data.secret
  if (!timingSafeEqual(suppliedSecret, setupSecret)) {
    // Record failed attempt in audit log
    await adminSupabase.from("admin_audit_log").insert({
      actor_user_id: user.id,
      action: "admin_bootstrap_failed",
      metadata: { reason: "invalid_secret" },
    })

    return NextResponse.json({ error: "Неверный секрет первоначальной настройки" }, { status: 403 })
  }

  // 7. Grant admin role
  // a) Update profiles table
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id)

  if (profileError) {
    console.error("[admin/setup] profile update error:", profileError.message)
    return NextResponse.json({ error: "Не удалось обновить роль в профиле" }, { status: 500 })
  }

  // b) Update auth.users app_metadata
  const { error: authError } = await adminSupabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "admin",
    },
  })

  if (authError) {
    console.error("[admin/setup] auth app_metadata update error:", authError.message)
  }

  // c) Record audit log
  await adminSupabase.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "admin_bootstrap_succeeded",
    target_user_id: user.id,
    metadata: { email: userEmail },
  })

  return NextResponse.json({
    success: true,
    message: "Роль администратора успешно назначена! Пожалуйста, перезайдите в аккаунт для обновления прав.",
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
