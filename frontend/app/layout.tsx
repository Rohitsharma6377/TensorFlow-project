import './globals.css'
import React from 'react'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import Providers from './providers'
import ConditionalLeftSidebar from '@/components/layout/ConditionalLeftSidebar'
import MainContainer from '@/components/layout/MainContainer'
import BottomBar from '@/components/layout/BottomBar'
import Toaster from '@/components/ui/Toaster'
import InitAuth from './init-auth'
import Script from 'next/script'

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
        {/* Leaflet for map picker */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* 3D model viewer for GLB/GLTF previews */}
        <Script
          id="model-viewer"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          strategy="afterInteractive"
          type="module"
        />
        <Script
          id="leaflet-js"
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          strategy="afterInteractive"
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} emerald-sky-bg text-slate-900 dark:text-slate-100 min-h-screen antialiased overflow-x-hidden`}>
        <Providers>
          <InitAuth />
          <div className="flex flex-col min-h-screen">
            <Navbar />

            {/* Universal Left Sidebar (hidden on auth routes) */}
            <ConditionalLeftSidebar />

            {/* Main content with conditional sidebar padding */}
            <MainContainer>
              {/* Ensure space for BottomBar on mobile */}
              <div className="pb-16 lg:pb-0 min-h-[60vh]">
                {children}
              </div>
            </MainContainer>

            {/* Mobile Bottom Navigation */}
            <BottomBar />
          </div>
        </Providers>
        {/* Global toast notifications */}
        <Toaster />
      </body>
    </html>
  );
}
