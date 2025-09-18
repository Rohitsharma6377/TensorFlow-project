import './globals.css'
import 'antd/dist/reset.css'
import React from 'react'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import Providers from './providers'
import InitAuth from './init-auth'
import SessionDebug from '@/components/SessionDebug'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Social Commerce',
  description: 'A social commerce platform with Instagram-like UI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <Providers>
          <InitAuth />
          <div className="flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <SessionDebug />
        </Providers>
      </body>
    </html>
  );
}
