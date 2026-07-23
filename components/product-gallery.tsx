"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: Props) {
  const [selectedImage, setSelectedImage] = useState(images[0] || "/placeholder.svg")

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <Image
          src={selectedImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-opacity duration-300"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                selectedImage === img ? "border-foreground ring-2 ring-foreground/20" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${productName} thumbnail ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
