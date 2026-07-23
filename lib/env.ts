import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  NEXT_PUBLIC_TELEGRAM_USERNAME: z.string().default("onde_studio"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),

  OWNER_EMAIL: z.string().email().optional(),
  ADMIN_SETUP_SECRET: z.string().optional(),

  STORE_ORIGIN_COUNTRY: z.string().default("RU"),
  STORE_ORIGIN_REGION: z.string().default("Свердловская область"),
  STORE_ORIGIN_CITY: z.string().default("Екатеринбург"),
  STORE_ORIGIN_POSTAL_CODE: z.string().default("620000"),
  STORE_ORIGIN_ADDRESS: z.string().default("ул. Малышева, д. 1"),
  STORE_ORIGIN_LATITUDE: z.string().optional(),
  STORE_ORIGIN_LONGITUDE: z.string().optional(),
  STORE_CONTACT_PHONE: z.string().optional(),
  STORE_CONTACT_EMAIL: z.string().optional(),
  STORE_TIMEZONE: z.string().default("Asia/Yekaterinburg"),
  STORE_CURRENCY: z.string().default("RUB"),

  CDEK_ENABLED: z.string().default("false").transform((v) => v === "true"),
  CDEK_CLIENT_ID: z.string().optional(),
  CDEK_CLIENT_SECRET: z.string().optional(),
  CDEK_API_BASE_URL: z.string().default("https://api.cdek.ru/v2"),
  CDEK_SENDER_OFFICE_CODE: z.string().optional(),

  RUSSIAN_POST_ENABLED: z.string().default("false").transform((v) => v === "true"),
  RUSSIAN_POST_API_TOKEN: z.string().optional(),
  RUSSIAN_POST_USER_AUTH_KEY: z.string().optional(),
  RUSSIAN_POST_API_BASE_URL: z.string().default("https://otpravka-api.pochta.ru"),

  YANDEX_DELIVERY_ENABLED: z.string().default("false").transform((v) => v === "true"),
  YANDEX_DELIVERY_API_TOKEN: z.string().optional(),
  YANDEX_DELIVERY_PLATFORM_STATION_ID: z.string().optional(),
  YANDEX_DELIVERY_API_BASE_URL: z.string().default("https://b2b.taxi.yandex.net"),
})

export const getEnv = () => {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.warn("⚠️ Environment variables validation warning:", result.error.format())
  }
  return result.data ?? process.env
}
