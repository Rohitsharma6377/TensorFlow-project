import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p>
            © {new Date().getFullYear()} Social Commerce. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/feed" className="hover:text-slate-900">Feed</Link>
            <Link href="/shops" className="hover:text-slate-900">Shops</Link>
            <Link href="/profile" className="hover:text-slate-900">Profile</Link>
            <Link href="/admin/dashboard" className="hover:text-slate-900">Admin</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
