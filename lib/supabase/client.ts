// Central Supabase client singleton
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/database.types'

let supabaseInstance: SupabaseClient<Database> | null = null

export const getSupabaseInstance = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}
