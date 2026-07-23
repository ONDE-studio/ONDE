import { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onde-studio.ru"

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  try {
    const supabase = createAdminClient()
    const { data: products } = await supabase
      .from("products")
      .select("id, slug, updated_at")
      .eq("active", true)

    if (products) {
      products.forEach((p) => {
        routes.push({
          url: `${baseUrl}/products/${p.slug || p.id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        })
      })
    }
  } catch (err) {
    console.error("Sitemap product fetch error:", err)
  }

  return routes
}
