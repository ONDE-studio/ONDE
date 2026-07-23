import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, Package, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createAdminClient } from "@/lib/supabase/admin"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { ProductGallery } from "@/components/product-gallery"

interface Props {
  params: Promise<{ slug: string }>
}

async function getProductBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("active", true)
    .single()

  return product
}

async function getRelatedProducts(category: string, currentId: string) {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("category", category)
    .neq("id", currentId)
    .limit(3)

  return products || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: "Товар не найден | ONDE Studio",
    }
  }

  const title = product.seo_title || `${product.name} | Дизайнерский декор ONDE`
  const description =
    product.seo_description ||
    product.short_description ||
    `Купить ${product.name} от студии 3D-печати ONDE. Премиальный декор и аксессуары.`

  const imageUrl = product.images?.[0] || product.image || "/og-image.jpg"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, alt: product.name }],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const related = await getRelatedProducts(product.category || "вазы", product.id)
  const images: string[] = product.images && product.images.length > 0 ? product.images : [product.image || "/placeholder.svg"]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.full_description || product.short_description || product.description,
    image: images,
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: product.price,
      availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "ONDE Studio",
      },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" />
          Назад в каталог
        </Link>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={images} productName={product.name} />

          {/* Details */}
          <div className="flex flex-col">
            <div className="border-b border-border pb-6">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.category || "Коллекционный декор"}
              </span>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl mt-1">
                {product.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-foreground">
                  {new Intl.NumberFormat("ru-RU").format(product.price)} ₽
                </span>
                {product.originalPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {new Intl.NumberFormat("ru-RU").format(product.originalPrice)} ₽
                  </span>
                )}
              </div>
            </div>

            <div className="py-6 space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.full_description || product.short_description || product.description || "Эксклюзивное изделие, изготовленное методом FDM 3D-печати на высокоточном оборудовании."}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Материал</span>
                  <span className="font-medium text-foreground">{product.material || "PLA-пластик"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Размеры (Д×Ш×В)</span>
                  <span className="font-medium text-foreground">
                    {product.length_mm || 150} × {product.width_mm || 150} × {product.height_mm || 180} мм
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Вес</span>
                  <span className="font-medium text-foreground">{product.weight_grams || 350} г</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Срок изготовления</span>
                  <span className="font-medium text-foreground">
                    {product.production_days_min || 1}-{product.production_days_max || 3} рабочих дня
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-4 pt-6 border-t border-border">
              <AddToCartButton product={product} />

              <a
                href={`https://t.me/onde_studio?text=${encodeURIComponent(`Здравствуйте! Интересует индивидуальный заказ товара "${product.name}".`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <Sparkles className="size-4 text-primary" />
                Заказать кастомный цвет или размер в Telegram
              </a>

              <div className="grid grid-cols-3 gap-2 pt-4 text-center text-[11px] text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="size-4 text-foreground/70" />
                  <span>Доставка СДЭК / Почта</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock className="size-4 text-foreground/70" />
                  <span>Print on Demand</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="size-4 text-foreground/70" />
                  <span>Гарантия качества</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="font-serif text-2xl font-medium tracking-tight mb-6">Вам также может понравиться</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug || item.id}`}
                  className="group rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item.images?.[0] || item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-serif text-base font-medium mt-3 text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {new Intl.NumberFormat("ru-RU").format(item.price)} ₽
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
