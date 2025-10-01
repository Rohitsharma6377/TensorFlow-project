import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic role-based routing stub. Enhance this to read JWT/cookies and fetch user role.
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname
  const host = req.headers.get('host') || ''

  // 1) Bypass static assets and APIs completely
  const bypassPrefixes = ['/_next', '/api', '/favicon', '/images', '/public', '/assets']
  if (bypassPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2) Custom domain -> rewrite to /shop/[slug]
  // Only attempt when host is not localhost/dev app domain
  const appHosts = [
    'localhost:3000',
    process.env.NEXT_PUBLIC_APP_DOMAIN || '',
  ].filter(Boolean)

  const isAppHost = appHosts.some((h) => h && host.toLowerCase().endsWith(h.toLowerCase()))
  if (!isAppHost && host) {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''
      const res = await fetch(`${apiBase}/api/v1/domains/resolve?host=${encodeURIComponent(host)}`)
      if (res.ok) {
        const data = await res.json()
        const slug = data?.slug
        if (slug) {
          const rewriteUrl = req.nextUrl.clone()
          // Preserve path under custom domain; map "/" to /shop/[slug]
          const suffix = pathname === '/' ? '' : pathname
          rewriteUrl.pathname = `/shop/${slug}${suffix}`
          return NextResponse.rewrite(rewriteUrl)
        }
      }
    } catch {
      // fail open
    }
  }

  // 3) Role-based routing for protected app areas
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
    return null
  }

  const required = requires(pathname)
  if (!required) return NextResponse.next()

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
  // Run on everything except Next assets and static files; we also bypass inside code
  matcher: ['/((?!_next|favicon.ico|images|public|api).*)', '/seller/:path*', '/admin/:path*', '/superadmin/:path*', '/user/:path*', '/cart', '/checkout', '/orders/:path*', '/wishlist'],
}
