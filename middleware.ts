import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'medapp_admin_session'

// Protège toutes les routes /admin — redirige vers /login si pas connecté
export default function middleware(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)
  const authSecret = process.env.AUTH_SECRET
  const isAuthenticated = session?.value === authSecret

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}