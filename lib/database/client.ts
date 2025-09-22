import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/database.types'

let supabaseInstance: SupabaseClient<Database> | null = null

export const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      // You can add additional options here if needed
    })
  }
  return supabaseInstance
}