"use client"

import Image from "next/image"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { Reveal } from "./reveal"
import { TELEGRAM_USERNAME } from "@/lib/mock-data"

export function AboutContact() {
  const { locale } = useI18n()

  const copy = {
    ru: {
      aboutTitle: "О студии ONDE",
      aboutBody:
        "ONDE — небольшая студия, где я проектирую и печатаю предметы, которыми хочется пользоваться каждый день. Никакого конвейера: каждая деталь проходит через мои руки — от цифровой модели до финишной обработки. Я работаю с матовыми материалами премиального класса и уделяю внимание тактильности, форме и свету.",
      contactTitle: "Поговорим о заказе",
      contactBody:
        "Хотите нестандартный размер, цвет или собственную идею? Напишите мне в Telegram — обсудим детали и сроки.",
    },
    en: {
      aboutTitle: "About ONDE",
      aboutBody:
        "ONDE is a small studio where I design and print objects meant to be used every day. No assembly line: every part passes through my hands — from the digital model to the final finish. I work with premium matte materials and care about texture, form and light.",
      contactTitle: "Let's talk about your order",
      contactBody:
        "Want a custom size, colour or your own idea? Message me on Telegram and we'll discuss details and timing.",
    },
  }[locale]

  return (
    <>
      <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src="/products/lamp.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">{copy.aboutTitle}</h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
              {copy.aboutBody}
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                { n: "6+", l: locale === "ru" ? "лет практики" : "years" },
                { n: "500+", l: locale === "ru" ? "изделий" : "pieces" },
                { n: "100%", l: locale === "ru" ? "вручную" : "by hand" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-serif text-2xl text-foreground">{s.n}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 px-4 pb-20 sm:px-6 lg:pb-28">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10 lg:py-20">
            <h2 className="mx-auto max-w-xl text-balance font-serif text-3xl sm:text-4xl">
              {copy.contactTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-primary-foreground/70">
              {copy.contactBody}
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8 h-11 px-6"
            >
              <a
                href={`https://t.me/${TELEGRAM_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="size-4" />
                @{TELEGRAM_USERNAME}
              </a>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  )
}
