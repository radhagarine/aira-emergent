'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/database.types'

// Import the central Supabase singleton
import { getSupabaseInstance } from '@/lib/supabase/client'

declare global {
  interface Window {
    debugSupabase: any;
  }
}

// Define context type for Supabase client
interface SupabaseContextType {
  supabase: SupabaseClient<Database>;
}

// Create Supabase context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseInstance()

  // Debug logging only - no auth state management here
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugSupabase = supabase;
      console.log('[Debug] Supabase client exposed as window.debugSupabase');
    }
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  )
}

// Hook to access Supabase client directly
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};