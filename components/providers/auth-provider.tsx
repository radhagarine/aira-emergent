// src/components/providers/auth-provider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './supabase-provider';
import { Session, User } from '@supabase/supabase-js';

// Define the auth context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Define the props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that handles authentication state
 * and provides auth methods through context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get Supabase client from existing provider
  const { supabase } = useSupabase();
  
  // State for auth data
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set up auth state listener to log token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state change event:', event);
      console.log('[Auth] New session available:', !!session);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token was refreshed');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  // Effect to initialize auth state and set up listeners
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      // Use environment variable for site URL, fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Create the value for the context
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth from the AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};