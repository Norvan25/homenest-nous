import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip auth check for development - comment out these lines in production
  // return res
  
  try {
    const supabase = createMiddlewareClient({ req, res })
    
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protect all routes except /login and api routes
    const isLoginPage = req.nextUrl.pathname.startsWith('/login')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    
    if (!session && !isLoginPage && !isApiRoute) {
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect logged in users away from login page
    if (session && isLoginPage) {
      const redirectUrl = new URL('/', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    // If there's an error with auth, allow the request through
    // This prevents app from breaking if Supabase is misconfigured
    console.error('Middleware auth error:', error)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
