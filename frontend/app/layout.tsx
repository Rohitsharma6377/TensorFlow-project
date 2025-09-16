import './globals.css'
import 'antd/dist/reset.css'
import React from 'react'
import { Navbar } from '@/components/navbar'
import Providers from './providers'
import InitAuth from './init-auth'

export const metadata = {
  title: 'Social Commerce',
  description: 'Social Commerce SaaS Frontend',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        <Providers>
          <InitAuth />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
