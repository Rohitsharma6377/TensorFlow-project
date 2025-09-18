import './globals.css'
import 'antd/dist/reset.css'
import React from 'react'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import Providers from './providers'
import InitAuth from './init-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SocialShop - Discover Amazing Products',
  description: 'A beautiful social commerce platform where you can discover, share, and shop amazing products from your favorite creators and brands.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ecfdf5" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} emerald-sky-bg text-slate-900 dark:text-slate-100 min-h-screen antialiased`}>
        <Providers>
          <InitAuth />
          <div className="flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
