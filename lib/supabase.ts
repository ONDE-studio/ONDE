import { createBrowserClient } from '@supabase/ssr'

// Singleton — один клиент на всё время жизни вкладки.
// createBrowserClient сам хранит сессию в localStorage + cookies,
// поэтому повторный вызов должен возвращать ОДИН и тот же экземпляр.
let client: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return client
}

export const supabase = getSupabaseClient()
