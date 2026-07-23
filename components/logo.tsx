import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative size-8 shrink-0">
        <Image
          src="/logo.png"
          alt="ONDE Studio"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-2xl font-semibold tracking-[0.32em] text-foreground">
          ONDE
        </span>
        {showTagline ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.42em] text-muted-foreground">
            Premium 3D Printing
          </span>
        ) : null}
      </span>
    </div>
  )
}
