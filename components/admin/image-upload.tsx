"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function ImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (dataUrl: string) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") onChange(reader.result)
      }
      reader.readAsDataURL(file)
    },
    [onChange],
  )

  return (
    <div>
      {value ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-secondary">
          <Image src={value || "/placeholder.svg"} alt="" fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-transform hover:scale-105"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 text-center transition-colors hover:border-foreground/40",
            dragging && "border-foreground/60 bg-secondary",
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">{t("admin.upload")}</span>
          <span className="text-xs text-muted-foreground">{t("admin.orDrop")}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
