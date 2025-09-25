import './globals.css'
import React from 'react'
import { NextUIProvider } from "@nextui-org/react";
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import Providers from './providers'
import ConditionalLeftSidebar from '@/components/layout/ConditionalLeftSidebar'
import MainContainer from '@/components/layout/MainContainer'
import Toaster from '@/components/ui/Toaster'
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
        {/* 3D model viewer for GLB/GLTF previews */}
        <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        {/* Leaflet for map picker */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        ></script>
      </head>
      <body className={`${inter.className} emerald-sky-bg text-slate-900 dark:text-slate-100 min-h-screen antialiased overflow-x-hidden`}>
        <NextUIProvider>
          <Providers>
            <InitAuth />
            <div className="flex flex-col">
              <Navbar />

              {/* Universal Left Sidebar (hidden on auth routes) */}
              <ConditionalLeftSidebar />

              {/* Main content with conditional sidebar padding */}
              <MainContainer>
                {children}
              </MainContainer>
            </div>
          </Providers>
          {/* Global toast notifications */}
          <Toaster />
        </NextUIProvider>
      </body>
    </html>
  );
}
