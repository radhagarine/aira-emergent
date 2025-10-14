'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Loader2 } from 'lucide-react'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const redirectedRef = useRef(false)

  // Mark as mounted on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated after loading is complete
  useEffect(() => {
    if (mounted && !authLoading && !user && !redirectedRef.current) {
      console.log('[AuthCheck] No user found, redirecting to login')
      redirectedRef.current = true
      // Use replace instead of push to avoid adding to history
      router.replace('/auth/login')
    }
  }, [mounted, authLoading, user, router])

  // Show loading state while checking auth
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}