import { cn } from "@/lib/utils"

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-serif text-2xl font-semibold tracking-[0.32em] text-foreground">
        ONDE
      </span>
      {showTagline ? (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.42em] text-muted-foreground">
          Premium 3D Printing
        </span>
      ) : null}
    </span>
  )
}
