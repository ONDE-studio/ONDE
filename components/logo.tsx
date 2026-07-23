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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background p-1 shadow-xs">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          className="size-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Face of Cube */}
          <polygon
            points="50,14 78,28 50,42 22,28"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon
            points="50,21 68,30 50,39 32,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Left Face of Cube */}
          <polygon
            points="22,28 50,42 50,68 22,54"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <line x1="22" y1="37" x2="50" y2="51" stroke="currentColor" strokeWidth="3" />
          <line x1="22" y1="45" x2="50" y2="59" stroke="currentColor" strokeWidth="3" />

          {/* Right Face of Cube */}
          <polygon
            points="50,42 78,28 78,54 50,68"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <line x1="57" y1="46" x2="71" y2="39" stroke="var(--color-background, #fff)" strokeWidth="3" strokeLinecap="round" />
          <line x1="57" y1="54" x2="71" y2="47" stroke="var(--color-background, #fff)" strokeWidth="3" strokeLinecap="round" />

          {/* Left Hand */}
          <path
            d="M 12,68 C 10,50 20,38 30,30 C 31,38 28,48 34,55 C 38,60 45,64 49,69 C 43,74 36,82 32,88 C 22,88 15,80 12,68 Z"
            fill="var(--color-background, #fff)"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 24,46 C 20,56 18,67 22,77" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

          {/* Right Hand */}
          <path
            d="M 88,68 C 90,50 80,38 70,30 C 69,38 72,48 66,55 C 62,60 55,64 51,69 C 57,74 64,82 68,88 C 78,88 85,80 88,68 Z"
            fill="var(--color-background, #fff)"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 76,46 C 80,56 82,67 78,77" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
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
