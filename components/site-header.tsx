"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LayoutDashboard, LogOut, Menu, ShoppingBag, User, X } from "lucide-react"
import { Logo } from "./logo"
import { LanguageToggle } from "./language-toggle"
import { useCartUI } from "./cart-ui"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const navLinks = [
  { key: "nav.catalog", href: "/#catalog" },
  { key: "nav.process", href: "/#process" },
  { key: "nav.about", href: "/#about" },
  { key: "nav.contact", href: "/#contact" },
]

export function SiteHeader() {
  const { t } = useI18n()
  const { cartCount, currentUser, logout } = useStore()
  const { setOpen } = useCartUI()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <Link href="/" aria-label="ONDE" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />

          {currentUser?.role === "admin" ? (
            <Button asChild variant="ghost" size="icon-lg" className="hidden sm:inline-flex">
              <Link href="/admin" aria-label={t("nav.admin")}>
                <LayoutDashboard className="size-5" />
              </Link>
            </Button>
          ) : null}

          {currentUser ? (
            <Button asChild variant="ghost" size="icon-lg" className="hidden sm:inline-flex">
              <Link href="/account" aria-label={t("nav.account")}>
                <User className="size-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("cart.title")}
            className="relative inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                {cartCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {t(l.key)}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          <div className="flex items-center justify-between px-3 py-1">
            <LanguageToggle />
            {currentUser ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout()
                  setMobileOpen(false)
                }}
              >
                <LogOut className="size-4" />
                {t("nav.logout")}
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
            )}
          </div>
          {currentUser ? (
            <Link
              href={currentUser.role === "admin" ? "/admin" : "/account"}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {currentUser.role === "admin" ? t("nav.admin") : t("nav.account")}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
