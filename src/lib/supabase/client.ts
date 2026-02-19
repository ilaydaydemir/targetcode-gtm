import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  // During build/SSG, env vars may not be available. Provide placeholder values
  // so the client can be instantiated without throwing. It won't make real requests
  // during static generation.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
