'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/supabase-provider'
import { Loader2 } from 'lucide-react'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const initialCheckDone = useRef(false)

  useEffect(() => {
    // Wait a bit to ensure auth state is properly initialized
    const timer = setTimeout(() => {
      if (!initialCheckDone.current) {
        if (user === null) {
          router.push('/auth/login')
        }
        setIsLoading(false)
        initialCheckDone.current = true
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}