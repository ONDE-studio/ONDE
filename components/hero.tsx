"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { TELEGRAM_USERNAME } from "@/lib/mock-data"

export function Hero() {
  const { locale } = useI18n()
  const { heroSettings } = useStore()

  // Pull text from store (admin-editable), fall back to locale key
  const badge = locale === "ru" ? heroSettings.badge.ru : heroSettings.badge.en
  const title = locale === "ru" ? heroSettings.title.ru : heroSettings.title.en
  const subtitle = locale === "ru" ? heroSettings.subtitle.ru : heroSettings.subtitle.en

  return (
    <section className="relative overflow-hidden">
      {/* subtle backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.93_0.004_95),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-24">
        <div className="flex flex-col items-start">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-foreground" />
            {badge}
          </span>

          <h1
            className="animate-fade-up mt-6 text-balance font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {title}
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            {subtitle}
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Button asChild size="lg" className="h-11 px-5 text-sm">
              <Link href="#catalog">
                {locale === "ru" ? "Смотреть каталог" : "Explore catalog"}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
              <a
                href={`https://t.me/${TELEGRAM_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="size-4" />
                {locale === "ru" ? "Написать в Telegram" : "Message on Telegram"}
              </a>
            </Button>
          </div>
        </div>

        <div className="animate-scale-in relative" style={{ animationDelay: "200ms" }}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
            <Image
              src="/products/sculpture.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card/90 px-4 py-3 backdrop-blur-md sm:block">
            <p className="font-serif text-lg leading-none text-foreground">100%</p>
            <p className="mt-1 text-xs text-muted-foreground">handmade</p>
          </div>
        </div>
      </div>
    </section>
  )
}
