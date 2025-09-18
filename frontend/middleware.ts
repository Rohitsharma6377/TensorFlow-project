import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic role-based routing stub. Enhance this to read JWT/cookies and fetch user role.
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  const role = req.cookies.get('role')?.value as
    | 'customer'
    | 'seller'
    | 'admin'
    | 'superadmin'
    | undefined

  // Determine required roles per section
  const requires = (p: string): Array<'customer' | 'seller' | 'admin' | 'superadmin'> | null => {
    if (p.startsWith('/seller')) return ['seller', 'admin', 'superadmin']
    if (p.startsWith('/admin')) return ['admin', 'superadmin']
    if (p.startsWith('/superadmin')) return ['superadmin']
    if (p.startsWith('/user')) return ['customer', 'seller', 'admin', 'superadmin']
    if (p.startsWith('/orders')) return ['customer', 'seller', 'admin', 'superadmin']
    if (p.startsWith('/wishlist')) return ['customer', 'seller', 'admin', 'superadmin']
    if (p.startsWith('/checkout')) return ['customer', 'seller', 'admin', 'superadmin']
    if (p.startsWith('/cart')) return ['customer', 'seller', 'admin', 'superadmin']
    if (p.startsWith('/shop')) return ['seller', 'admin', 'superadmin']
    return null
  }

  const required = requires(pathname)
  if (!required) {
    return NextResponse.next()
  }

  // If no role cookie, treat as unauthenticated and redirect to login with next param
  if (!role) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If role not allowed, redirect to unauthorized
  if (!required.includes(role as any)) {
    const unauthorizedUrl = req.nextUrl.clone()
    unauthorizedUrl.pathname = '/unauthorized'
    return NextResponse.redirect(unauthorizedUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/shop/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
    // customer area
    '/user/:path*',
    // legacy direct routes if still used anywhere
    '/cart',
    '/checkout',
    '/orders/:path*',
    '/wishlist',
  ],
}
