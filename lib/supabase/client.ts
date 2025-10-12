// Central Supabase client singleton
// This file is imported by both the provider and the repository factory
// to ensure there's only ONE Supabase client instance in the entire app

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
