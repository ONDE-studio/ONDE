"use client"

import Link from "next/link"
import { Send } from "lucide-react"
import { Logo } from "./logo"
import { useI18n } from "@/lib/i18n"
import { TELEGRAM_USERNAME } from "@/lib/mock-data"

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo showTagline />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("nav.catalog")}
            </span>
            <Link href="/#catalog" className="text-sm text-foreground hover:underline">
              {t("nav.catalog")}
            </Link>
            <Link href="/#process" className="text-sm text-foreground hover:underline">
              {t("nav.process")}
            </Link>
            <Link href="/#about" className="text-sm text-foreground hover:underline">
              {t("nav.about")}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("nav.contact")}
            </span>
            <a
              href={`https://t.me/${TELEGRAM_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground hover:underline"
            >
              <Send className="size-4" />@{TELEGRAM_USERNAME}
            </a>
            <Link href="/account" className="text-sm text-foreground hover:underline">
              {t("nav.account")}
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} ONDE. {t("footer.rights")}</span>
          <span>Premium 3D Printing Studio</span>
        </div>
      </div>
    </footer>
  )
}
