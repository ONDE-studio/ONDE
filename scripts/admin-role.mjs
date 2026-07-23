import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Simple .env.local loader if Node doesn't pass --env-file
function loadEnvLocal() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не найдены в окружении.")
  console.error("Убедитесь, что ключи прописаны в .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const [,, command, emailArg, flagArg] = process.argv

async function findUserByEmail(email) {
  const targetEmail = email.trim().toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find((u) => u.email?.toLowerCase() === targetEmail)
    if (user) return user

    if (data.users.length < perPage) break
    page++
  }

  return null
}

async function countAdmins() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")

  if (error) throw error
  return data ? data.length : 0
}

async function grantAdmin(email) {
  if (!email) {
    console.error("❌ Укажите email: npm run admin:grant -- user@example.com")
    process.exit(1)
  }

  const user = await findUserByEmail(email)
  if (!user) {
    console.error(`❌ Пользователь ${email} не найден в Supabase Auth. Пользователь должен сначала зарегистрироваться.`)
    process.exit(1)
  }

  // Update auth app_metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "admin",
    },
  })
  if (authError) throw authError

  // Update profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id)
  if (profileError) throw profileError

  // Log audit
  await supabase.from("admin_audit_log").insert({
    action: "admin_role_granted_cli",
    target_user_id: user.id,
    metadata: { email: user.email },
  })

  console.log(`✅ Права администратора успешно предоставлены пользователю: ${user.email}`)
}

async function revokeAdmin(email, force) {
  if (!email) {
    console.error("❌ Укажите email: npm run admin:revoke -- user@example.com")
    process.exit(1)
  }

  const user = await findUserByEmail(email)
  if (!user) {
    console.error(`❌ Пользователь ${email} не найден.`)
    process.exit(1)
  }

  // Check if last admin
  const totalAdmins = await countAdmins()
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userProfile?.role === "admin" && totalAdmins <= 1 && !force) {
    console.error(`⚠️ Пользователь ${email} — ЕДИНСТВЕННЫЙ администратор в системе.`)
    console.error("Отзыв прав заблокирует админ-панель. Чтобы подтвердить отзыв, используйте флаг --force:")
    console.error(`npm run admin:revoke -- ${email} --force`)
    process.exit(1)
  }

  // Revoke auth app_metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "customer",
    },
  })
  if (authError) throw authError

  // Revoke profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "customer" })
    .eq("id", user.id)
  if (profileError) throw profileError

  // Log audit
  await supabase.from("admin_audit_log").insert({
    action: "admin_role_revoked_cli",
    target_user_id: user.id,
    metadata: { email: user.email },
  })

  console.log(`✅ Права администратора отозваны у пользователя: ${user.email}`)
}

async function listAdmins() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false })

  if (error) throw error

  console.log("\n📋 Список пользователей и ролей:")
  console.log("─────────────────────────────────────────────────────────────")
  for (const p of profiles) {
    const roleBadge = p.role === "admin" ? "🔑 ADMIN" : "👤 CUSTOMER"
    console.log(`${roleBadge} | ${p.email.padEnd(30)} | ID: ${p.id}`)
  }
  console.log("─────────────────────────────────────────────────────────────\n")
}

async function main() {
  try {
    switch (command) {
      case "grant":
        await grantAdmin(emailArg)
        break
      case "revoke":
        await revokeAdmin(emailArg, flagArg === "--force")
        break
      case "list":
        await listAdmins()
        break
      default:
        console.log("Использование CLI скрипта администрирования ONDE:")
        console.log("  npm run admin:grant -- owner@example.com")
        console.log("  npm run admin:revoke -- user@example.com [--force]")
        console.log("  npm run admin:list")
        break
    }
  } catch (err) {
    console.error("❌ Ошибка выполнения скрипта:", err.message)
    process.exit(1)
  }
}

main()
