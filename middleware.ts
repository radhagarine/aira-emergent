// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Use environment variable for site URL, fallback to request URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    console.log('Middleware - Current path:', req.nextUrl.pathname)
    console.log('Middleware - Request origin:', req.nextUrl.origin)
    console.log('Middleware - Site URL:', siteUrl)
    console.log('Middleware - Session exists:', !!session)

     // Check if cookies exist
    const allCookies = req.cookies.getAll()
    //console.log('Cookies present:', allCookies.map(c => c.name))

    if (error) {
      console.error('Middleware session error:', error)
      return NextResponse.redirect(new URL('/', siteUrl))
    }

    // If trying to access a protected route but no session exists
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      console.log('No session, redirecting from dashboard to home')
      return NextResponse.redirect(new URL('/', siteUrl))
    }

    // If signed in and trying to access auth pages
    /* if (session && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', siteUrl))
    } */

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/', siteUrl))
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*']
}