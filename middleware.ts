// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    /*
    console.log('Current path:', req.nextUrl.pathname)
    console.log('Session exists:', !!session)
    console.log('Session error:', error)
    */

     // Check if cookies exist
    const allCookies = req.cookies.getAll()
    //console.log('Cookies present:', allCookies.map(c => c.name))

    if (error) {
      //console.error('Middleware session error:', error)
      return NextResponse.redirect(new URL('/', req.url))
    }
  
    // If trying to access a protected route but no session exists
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      //console.log('No session, redirecting from dashboard to home')
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If signed in and trying to access auth pages
    /* if (session && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } */

    return res
  } catch (error) {
    //console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*']
}