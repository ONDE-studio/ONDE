"use client"

import { Lightbulb, Layers, Truck } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Reveal } from "./reveal"

export function ProcessSection() {
  const { t } = useI18n()
  const steps = [
    { icon: Lightbulb, title: "process.s1t", desc: "process.s1d" },
    { icon: Layers, title: "process.s2t", desc: "process.s2d" },
    { icon: Truck, title: "process.s3t", desc: "process.s3d" },
  ]
  return (
    <section id="process" className="scroll-mt-24 border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="font-serif text-3xl text-foreground sm:text-4xl">{t("process.title")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <div className="inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background">
                  <s.icon className="size-5" />
                </div>
                <p className="mt-5 text-xs font-medium tabular-nums text-muted-foreground">
                  0{i + 1}
                </p>
                <h3 className="mt-1 font-serif text-xl text-foreground">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.desc)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
