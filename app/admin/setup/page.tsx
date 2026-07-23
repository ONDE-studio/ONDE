"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export default function AdminSetupPage() {
  const router = useRouter()
  const { currentUser, logout } = useStore()
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка первоначальной настройки")
        return
      }

      setSuccess(data.message || "Администратор успешно создан!")
      setSecret("")
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте еще раз.")
    } finally {
      setLoading(false)
    }
  }

  async function handleReLogin() {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" />
          Вернуться на главную
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-medium text-foreground">Первоначальная настройка</h1>
              <p className="text-xs text-muted-foreground">Назначение первого администратора ONDE</p>
            </div>
          </div>

          {currentUser ? (
            <div className="rounded-xl bg-secondary/50 p-3.5 text-xs space-y-1">
              <p className="text-muted-foreground">Вы авторизованы как:</p>
              <p className="font-medium text-foreground">{currentUser.name} ({currentUser.email})</p>
              <p className="text-[11px] text-muted-foreground">
                Текущая роль: <span className="font-semibold text-foreground uppercase">{currentUser.role}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Требуется авторизация</p>
                <p className="mt-0.5">
                  Сначала зарегистрируйтесь или войдите с вашим <code className="bg-background px-1 py-0.5 rounded">OWNER_EMAIL</code>, а затем вернитесь на эту страницу.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                  <Link href="/login">Войти в аккаунт</Link>
                </Button>
              </div>
            </div>
          )}

          {success ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Настройка завершена!</p>
                  <p className="mt-1">{success}</p>
                </div>
              </div>

              <div className="border-t border-emerald-500/20 pt-3 flex flex-col gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Чтобы обновлённые права вступили в силу в сессии, перезайдите в аккаунт:
                </p>
                <Button onClick={handleReLogin} size="sm" className="w-full gap-2">
                  <LogOut className="size-4" />
                  Перезайти в аккаунт
                </Button>
              </div>
            </div>
          ) : currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  Секрет первоначальной настройки
                </span>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Вставьте ADMIN_SETUP_SECRET"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </label>

              {error ? (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" size="lg" disabled={loading || !secret.trim()} className="w-full h-11">
                {loading ? "Проверка и назначение..." : "Назначить администратором"}
              </Button>
            </form>
          ) : null}

          <div className="text-[11px] text-muted-foreground border-t border-border pt-4">
            <p>
              🔒 Страница одноразовая. После создания первого администратора повторная первичная настройка блокируется автоматически.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
