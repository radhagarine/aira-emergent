'use client'
import { createContext, useContext, useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/database.types'
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