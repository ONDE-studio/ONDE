import { cn } from "@/lib/utils"

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        className="size-7 shrink-0 text-foreground"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer clover */}
        <path d="M 50 20 C 65 5, 95 35, 80 50 C 95 65, 65 95, 50 80 C 35 95, 5 65, 20 50 C 5 35, 35 5, 50 20 Z" />
        {/* Inner layer */}
        <path d="M 50 35 C 57.5 27.5, 72.5 42.5, 65 50 C 72.5 57.5, 57.5 72.5, 50 65 C 42.5 72.5, 27.5 57.5, 35 50 C 27.5 42.5, 42.5 27.5, 50 35 Z" strokeWidth="8" />
        {/* Core */}
        <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" />
      </svg>
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
