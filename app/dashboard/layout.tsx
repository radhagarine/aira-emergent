'use client'

import { FC, ReactNode, useState, useEffect } from 'react'
import { Sidebar } from '@/app/dashboard/components/side-bar'
import { TopNav } from '@/app/dashboard/components/top-nav'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ServiceProvider, EnhancedServiceProvider } from '@/components/providers/service-provider'
import AuthCheck from '@/app/dashboard/components/auch-check'

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)

      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen)

  return (
    <SupabaseProvider>
      <AuthProvider>
        {/* Add both ServiceProvider and EnhancedServiceProvider */}
        <ServiceProvider>
          <EnhancedServiceProvider>
            <AuthCheck>
              <div className="min-h-screen bg-background transition-colors duration-200">
                {/* Mobile overlay for sidebar */}
                {isMobile && sidebarOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}

                <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} isMobile={isMobile} />

                {/* Main content wrapper - responsive margins */}
                <div className={`flex-1 flex flex-col transition-all duration-300 ${
                  isMobile
                    ? 'ml-0' // No margin on mobile
                    : sidebarOpen ? 'ml-64' : 'ml-16' // Desktop margins
                }`}>
                  {/* Replace the simple header with TopNav */}
                  <TopNav onMenuClick={handleSidebarToggle} />

                  {/* Main content with responsive padding */}
                  <main className="p-4 sm:p-6 lg:p-8 bg-background text-foreground">
                    <div className="mx-auto max-w-7xl">
                      {children}
                    </div>
                  </main>
                </div>
              </div>
            </AuthCheck>
          </EnhancedServiceProvider>
        </ServiceProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
}

export default DashboardLayout;