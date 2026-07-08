"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Eye, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"
import type { HeroSettings } from "@/lib/types"

export function AdminShowcase() {
  const { products, heroSettings, updateHeroSettings, updateProduct } = useStore()
  const { t, locale } = useI18n()

  const [badge, setBadge] = useState(heroSettings.badge)
  const [title, setTitle] = useState(heroSettings.title)
  const [subtitle, setSubtitle] = useState(heroSettings.subtitle)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const sorted = [...products].sort((a, b) => a.position - b.position)
  const featuredCount = products.filter((p) => p.featured).length
  const onSaleCount = products.filter((p) => p.isOnSale).length

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground/50"
  const labelClass = "mb-1.5 block text-sm font-medium"

  function handleSaveHero() {
    const settings: HeroSettings = { badge, title, subtitle }
    updateHeroSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleFeatured(id: string, current: boolean) {
    updateProduct(id, { featured: !current })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="flex gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-3">
          <span className="text-sm text-muted-foreground">{t("admin.featuredSection")}</span>
          <p className="mt-1 font-serif text-2xl font-medium">{featuredCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3">
          <span className="text-sm text-muted-foreground">{t("admin.onSaleCount")}</span>
          <p className="mt-1 font-serif text-2xl font-medium">{onSaleCount}</p>
        </div>
      </div>

      {/* Hero settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-medium">{t("admin.heroSection")}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4" />
            {t("admin.heroPreview")}
          </Button>
        </div>

        {showPreview && (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center animate-fade-in">
            <span className="inline-block rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium">
              {locale === "ru" ? badge.ru : badge.en}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-medium md:text-3xl">
              {locale === "ru" ? title.ru : title.en}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              {locale === "ru" ? subtitle.ru : subtitle.en}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Russian */}
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🇷🇺 Русский</p>
            <div>
              <label className={labelClass}>{t("admin.heroBadge")}</label>
              <input
                className={inputClass}
                value={badge.ru}
                onChange={(e) => setBadge({ ...badge, ru: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t("admin.heroTitle")}</label>
              <input
                className={inputClass}
                value={title.ru}
                onChange={(e) => setTitle({ ...title, ru: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t("admin.heroSubtitle")}</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={subtitle.ru}
                onChange={(e) => setSubtitle({ ...subtitle, ru: e.target.value })}
              />
            </div>
          </div>

          {/* English */}
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🇬🇧 English</p>
            <div>
              <label className={labelClass}>{t("admin.heroBadge")}</label>
              <input
                className={inputClass}
                value={badge.en}
                onChange={(e) => setBadge({ ...badge, en: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t("admin.heroTitle")}</label>
              <input
                className={inputClass}
                value={title.en}
                onChange={(e) => setTitle({ ...title, en: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t("admin.heroSubtitle")}</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={subtitle.en}
                onChange={(e) => setSubtitle({ ...subtitle, en: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSaveHero}>
            {t("admin.save")}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 animate-fade-in">
              <Check className="h-4 w-4" />
              {t("admin.heroSaved")}
            </span>
          )}
        </div>
      </div>

      {/* Featured products management */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-serif text-xl font-medium">{t("admin.featuredSection")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.featuredHint")}</p>

        <div className="mt-5 flex flex-col gap-2">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:border-foreground/20"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={p.image || "/placeholder.svg"} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              {p.isOnSale && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  -{p.discountPercent}%
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleFeatured(p.id, p.featured)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  p.featured
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
                aria-label={p.featured ? "Remove from featured" : "Add to featured"}
              >
                {p.featured ? (
                  <Star className="h-4 w-4 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
