"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"

export default function LoginPage() {
  const { t } = useI18n()
  const { login, register } = useStore()
  const router = useRouter()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function redirectByRole(email: string) {
    if (email.trim().toLowerCase() === "admin@onde.studio") router.push("/admin")
    else router.push("/account")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === "login") {
      const res = await login(email, password)
      if (!res.ok) {
        setError(res.error === "wrong_password" ? t("auth.errWrong") : t("auth.errNotFound"))
        return
      }
      redirectByRole(email)
    } else {
      const res = await register(name, email, password)
      if (!res.ok) {
        setError(res.error === "server_error" ? "Ошибка сервера" : t("auth.errExists"))
        return
      }
      router.push("/account")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("checkout.toHome")}
        </Link>
        <LanguageToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center">
            <Link href="/">
              <Logo showTagline className="items-center text-center" />
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="font-serif text-2xl text-foreground">
              {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
            </h1>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {mode === "register" ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{t("auth.name")}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                  />
                </label>
              ) : null}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">{t("auth.email")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">{t("auth.password")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground"
                />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" size="lg" className="mt-1 h-11">
                {mode === "login" ? t("auth.signin") : t("auth.signup")}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register")
                      setError(null)
                    }}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t("auth.toRegister")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setError(null)
                    }}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t("auth.toLogin")}
                  </button>
                </>
              )}
            </div>
          </div>

          {mode === "login" ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{t("auth.demoHint")}</p>
              <p className="mt-1.5">admin@onde.studio · admin123</p>
              <p>client@example.com · client123</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
