// Central Supabase client singleton
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/database.types'

let supabaseInstance: SupabaseClient<Database> | null = null

export const getSupabaseInstance = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>()
  }
  return supabaseInstance
}
