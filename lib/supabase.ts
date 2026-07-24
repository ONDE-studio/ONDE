import { createBrowserClient } from '@supabase/ssr'

// Singleton — один клиент на всё время жизни вкладки.
// createBrowserClient сам хранит сессию в localStorage + cookies,
// поэтому повторный вызов должен возвращать ОДИН и тот же экземпляр.
let client: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (client) return client

  // Use proxy in browser to bypass RKN blocking, use direct URL on server
  const isBrowser = typeof window !== "undefined"
  const supabaseUrl = isBrowser ? "/api/supabase" : process.env.NEXT_PUBLIC_SUPABASE_URL!

  client = createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return client
}

export const supabase = getSupabaseClient()
