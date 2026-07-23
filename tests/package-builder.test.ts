import { describe, expect, it } from "vitest"
import { buildPackages, PackableItem } from "../lib/shipping/package-builder"

describe("Package Builder Unit Tests", () => {
  it("calculates single standard package with padding", () => {
    const items: PackableItem[] = [
      {
        productId: "1",
        name: "Ваза Onda",
        quantity: 1,
        weightGrams: 300,
        lengthMm: 140,
        widthMm: 140,
        heightMm: 180,
      },
    ]

    const packages = buildPackages(items)
    expect(packages).toHaveLength(1)
    expect(packages[0].weightGrams).toBe(400) // 300 + 100 padding
    expect(packages[0].heightMm).toBe(200) // 180 + 20
  })

  it("handles missing dimensions with default fallback values", () => {
    const items: PackableItem[] = [
      {
        productId: "2",
        name: "Кастомная Ваза",
        quantity: 1,
      },
    ]

    const packages = buildPackages(items)
    expect(packages).toHaveLength(1)
    expect(packages[0].weightGrams).toBeGreaterThan(0)
    expect(packages[0].lengthMm).toBeGreaterThan(0)
  })

  it("packs items marked with requiresSeparatePackage into separate boxes", () => {
    const items: PackableItem[] = [
      {
        productId: "3",
        name: "Хрупкий Светильник",
        quantity: 2,
        weightGrams: 500,
        lengthMm: 200,
        widthMm: 200,
        heightMm: 250,
        requiresSeparatePackage: true,
      },
    ]

    const packages = buildPackages(items)
    expect(packages).toHaveLength(2) // 2 separate boxes for 2 items
  })
})
