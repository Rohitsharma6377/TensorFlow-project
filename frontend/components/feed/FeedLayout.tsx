"use client";

import React from 'react';
import LeftSidebar from './LeftSidebar';
import MainFeed from './MainFeed';
import StoriesSection from './StoriesSection';

export function FeedLayout() {
  return (
    <div className="min-h-screen lg:h-screen emerald-sky-bg relative lg:overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-sky-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Fixed Left Sidebar (top-to-bottom, fixed width) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[360px] z-20 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <LeftSidebar />
        </div>
      </aside>

      {/* Main wrapper offset by the fixed sidebar width on large screens */}
      <div className="relative">
        {/* Main Content Area (independent scroll on large screens) */}
        <main className="w-full lg:h-screen lg:overflow-y-auto">
          {/* Stories Section - Sticky and flush under header */}
          <div className="sticky top-0 z-30">
            <div className="glass emerald-shadow px-0 rounded-none">
              <StoriesSection />
            </div>
          </div>
          {/* Main Feed - Full width of the right column with right padding only */}
          <div className="py-6 pr-4 sm:pr-6 lg:pr-8 pl-0">
            {/* Feed Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold emerald-sky-gradient mb-3">
                Discover Amazing Products
              </h1>
              <p className="text-emerald-700 dark:text-emerald-300 text-lg font-medium">
                Explore the latest trends from your favorite creators and brands
              </p>
              <div className="mt-4 flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"></div>
              </div>
            </div>
            
            <MainFeed />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass emerald-shadow border-t border-emerald-200/50 z-40">
        <div className="flex items-center justify-around h-full px-4">
          <button className="p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all duration-200 hover-lift">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          <button className="p-3 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-full transition-all duration-200 hover-lift">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200 hover-lift">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>
          <button className="p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all duration-200 hover-lift">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedLayout;
