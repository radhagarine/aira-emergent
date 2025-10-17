// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Use environment variable for site URL with production fallback
    const isProduction = process.env.NODE_ENV === 'production'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                    (isProduction ? 'https://aira.aivn.ai' : requestUrl.origin)

    console.log('Auth callback - Request URL:', request.url)
    console.log('Auth callback - Request Origin:', requestUrl.origin)
    console.log('Auth callback - NODE_ENV:', process.env.NODE_ENV)
    console.log('Auth callback - NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
    console.log('Auth callback - Is Production:', isProduction)
    console.log('Auth callback - Final Site URL:', siteUrl)

    if (code) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              try {
                cookieStore.set({ name, value, ...options });
              } catch (error) {
                // Cookie setting can fail in middleware/server components
              }
            },
            remove(name: string, options: any) {
              try {
                cookieStore.set({ name, value: '', ...options });
              } catch (error) {
                // Cookie removal can fail in middleware/server components
              }
            },
          },
        }
      )

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code)

      // Redirect to dashboard using the correct site URL
      const dashboardUrl = new URL('/dashboard', siteUrl)
      console.log('Auth callback - Redirecting to:', dashboardUrl.toString())
      return NextResponse.redirect(dashboardUrl)
    }

    // If there's no code, redirect to home
    const homeUrl = new URL('/', siteUrl)
    console.log('Auth callback - Redirecting to home:', homeUrl.toString())
    return NextResponse.redirect(homeUrl)
  } catch (error) {
    console.error('Auth callback error:', error)
    // Use site URL for error redirect too with production fallback
    const isProduction = process.env.NODE_ENV === 'production'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                    (isProduction ? 'https://aira.aivn.ai' : new URL(request.url).origin)
    return NextResponse.redirect(new URL('/', siteUrl))
  }
}