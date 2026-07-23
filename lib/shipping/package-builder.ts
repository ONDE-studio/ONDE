export interface PackableItem {
  productId: string
  name: string
  quantity: number
  weightGrams?: number | null
  lengthMm?: number | null
  widthMm?: number | null
  heightMm?: number | null
  requiresSeparatePackage?: boolean | null
}

export interface CalculatedPackage {
  weightGrams: number
  lengthMm: number
  widthMm: number
  heightMm: number
}

const DEFAULT_ITEM_WEIGHT_GRAMS = 350
const DEFAULT_ITEM_LENGTH_MM = 150
const DEFAULT_ITEM_WIDTH_MM = 150
const DEFAULT_ITEM_HEIGHT_MM = 180
const BOX_PADDING_GRAMS = 100 // Packaging box + paper weight

export function buildPackages(items: PackableItem[]): CalculatedPackage[] {
  const packages: CalculatedPackage[] = []

  for (const item of items) {
    const qty = item.quantity || 1
    const weight = item.weightGrams && item.weightGrams > 0 ? item.weightGrams : DEFAULT_ITEM_WEIGHT_GRAMS
    const l = item.lengthMm && item.lengthMm > 0 ? item.lengthMm : DEFAULT_ITEM_LENGTH_MM
    const w = item.widthMm && item.widthMm > 0 ? item.widthMm : DEFAULT_ITEM_WIDTH_MM
    const h = item.heightMm && item.heightMm > 0 ? item.heightMm : DEFAULT_ITEM_HEIGHT_MM

    if (item.requiresSeparatePackage) {
      for (let i = 0; i < qty; i++) {
        packages.push({
          weightGrams: weight + BOX_PADDING_GRAMS,
          lengthMm: l + 20,
          widthMm: w + 20,
          heightMm: h + 20,
        })
      }
    } else {
      // Group items into a combined box
      for (let i = 0; i < qty; i++) {
        if (packages.length === 0) {
          packages.push({
            weightGrams: weight + BOX_PADDING_GRAMS,
            lengthMm: l + 20,
            widthMm: w + 20,
            heightMm: h + 20,
          })
        } else {
          // Stack item heightwise into existing package
          const lastPkg = packages[packages.length - 1]
          lastPkg.weightGrams += weight
          lastPkg.lengthMm = Math.max(lastPkg.lengthMm, l + 20)
          lastPkg.widthMm = Math.max(lastPkg.widthMm, w + 20)
          lastPkg.heightMm += h
        }
      }
    }
  }

  return packages.length > 0
    ? packages
    : [
        {
          weightGrams: 500,
          lengthMm: 200,
          widthMm: 200,
          heightMm: 200,
        },
      ]
}
