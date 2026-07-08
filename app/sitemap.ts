import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Замените на ваш настоящий домен, когда купите его
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://onde-studio.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }
  ]
}
