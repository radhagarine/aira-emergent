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

// Auth context type
interface AuthContextType {
  user: User | null | undefined
  userEmail: string | null
  userName: string | null
  userAvatar: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

// Create Auth context
const AuthContext = createContext<AuthContextType>({
  user: undefined,
  userEmail: null,
  userName: null,
  userAvatar: null,
  signIn: async () => {},
  signOut: async () => {}
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseInstance()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          setUser(session.user)
          setUserEmail(session.user.email || null)
          setUserName(session.user.user_metadata?.full_name)
          setUserAvatar(session.user.user_metadata?.avatar_url)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error:', error)
        setUser(null)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setUserEmail(session.user.email || null)
        setUserName(session.user.user_metadata?.full_name)
        setUserAvatar(session.user.user_metadata?.avatar_url)
        router.refresh()
      } else {
        setUser(null)
        setUserEmail(null)
        setUserName(null)
        setUserAvatar(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async () => {
    try {
      // Get appropriate redirect URL for current environment
      const redirectUrl = getRedirectUrl();
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    
    // When not in browser, use the environment variable if available
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
    }
    
    // Fallback
    return 'https://aira.aivn.ai/auth/callback';
  };

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    // Expose Supabase client for debugging
    if (typeof window !== 'undefined') {
      window.debugSupabase = supabase;
      console.log('[Debug] Supabase client exposed as window.debugSupabase');
    }
  }, [supabase]);
  
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      <AuthContext.Provider value={{
        user,
        userEmail,
        userName,
        userAvatar,
        signIn,
        signOut
      }}>
        {children}
      </AuthContext.Provider>
    </SupabaseContext.Provider>
  )
}

// New hook to access Supabase client directly
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

// Custom hook to use auth
export const useAuth = () => useContext(AuthContext)

// Re-export getSupabaseInstance for backwards compatibility
export { getSupabaseInstance }