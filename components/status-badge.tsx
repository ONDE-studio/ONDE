"use client"

import type { OrderStatus } from "@/lib/types"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const styles: Record<OrderStatus, string> = {
  new: "bg-foreground text-background",
  in_progress: "bg-secondary text-secondary-foreground border border-border",
  done: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        styles[status],
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
