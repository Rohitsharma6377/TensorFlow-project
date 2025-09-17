import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic role-based routing stub. Enhance this to read JWT/cookies and fetch user role.
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Example guards (disabled by default). Implement real role checks later.
  // const token = req.cookies.get('token')?.value
  // const role = req.cookies.get('role')?.value as 'customer' | 'seller' | 'admin' | 'superadmin' | undefined

  // if (pathname.startsWith('/shop') && role !== 'seller') {
  //   url.pathname = '/sign-in'
  //   return NextResponse.redirect(url)
  // }

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
