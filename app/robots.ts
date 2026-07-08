import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Замените на ваш настоящий домен, когда купите его (например, https://onde-studio.ru)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://onde-studio.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account'], // Запрещаем индексировать админку и личный кабинет
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
