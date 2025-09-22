// app-provider.tsx
// Add a check to prevent duplicate context creation

import React, { ReactNode, useContext } from 'react';
import { SupabaseProvider } from './supabase-provider';
import { ServiceProvider } from './service-provider';
import { AuthProvider } from './auth-provider';

// Add a context to track provider presence
const AppProviderContext = React.createContext(false);

// Custom hook to check if provider exists
export const useAppProviderExists = () => {
  return useContext(AppProviderContext);
};

interface AppProviderProps {
  children: ReactNode;
  withAuth?: boolean;
}

export const AppProvider: React.FC<AppProviderProps> = ({ 
  children,
  withAuth = true
}) => {
  // Try to detect if we're already inside another AppProvider
  const providerExists = useAppProviderExists();
  
  // If we're already inside an AppProvider, just render children
  if (providerExists) {
    return <>{children}</>;
  }
  
  // Otherwise, set up the full provider tree
  if (withAuth) {
    return (
      <AppProviderContext.Provider value={true}>
        <SupabaseProvider>
          <AuthProvider>
            <ServiceProvider>
              {children}
            </ServiceProvider>
          </AuthProvider>
        </SupabaseProvider>
      </AppProviderContext.Provider>
    );
  } else {
    return (
      <AppProviderContext.Provider value={true}>
        <SupabaseProvider>
          <ServiceProvider>
            {children}
          </ServiceProvider>
        </SupabaseProvider>
      </AppProviderContext.Provider>
    );
  }
}