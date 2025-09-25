// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Use environment variable for site URL, fallback to request origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

    console.log('Auth callback - Request URL:', request.url)
    console.log('Auth callback - Request Origin:', requestUrl.origin)
    console.log('Auth callback - Site URL:', siteUrl)

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
    // Use site URL for error redirect too
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    return NextResponse.redirect(new URL('/', siteUrl))
  }
}