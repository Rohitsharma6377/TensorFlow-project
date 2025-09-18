"use client";

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  shop: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  hasUnseenStory: boolean;
  lastUpdated: string;
  storiesCount: number;
}

export function StoriesSection() {
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  const [stories] = useState<Story[]>([
    {
      id: '1',
      shop: {
        id: '1',
        name: 'Fashion Hub',
        username: 'fashion_hub_official',
        avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop&crop=center',
        isVerified: true
      },
      hasUnseenStory: true,
      lastUpdated: '2h',
      storiesCount: 3
    },
    {
      id: '2',
      shop: {
        id: '2',
        name: 'Tech Store',
        username: 'tech_reviewer',
        avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=center',
        isVerified: true
      },
      hasUnseenStory: true,
      lastUpdated: '4h',
      storiesCount: 5
    },
    {
      id: '3',
      shop: {
        id: '3',
        name: 'Home Decor',
        username: 'home_decor_ideas',
        avatar: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop&crop=center',
        isVerified: false
      },
      hasUnseenStory: false,
      lastUpdated: '1d',
      storiesCount: 2
    },
    {
      id: '4',
      shop: {
        id: '4',
        name: 'Beauty Corner',
        username: 'beauty_corner',
        avatar: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&h=150&fit=crop&crop=center',
        isVerified: true
      },
      hasUnseenStory: true,
      lastUpdated: '6h',
      storiesCount: 4
    },
    {
      id: '5',
      shop: {
        id: '5',
        name: 'Sports Zone',
        username: 'sports_zone_official',
        avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=center',
        isVerified: false
      },
      hasUnseenStory: true,
      lastUpdated: '8h',
      storiesCount: 1
    },
    {
      id: '6',
      shop: {
        id: '6',
        name: 'Book Haven',
        username: 'book_haven',
        avatar: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=150&h=150&fit=crop&crop=center',
        isVerified: false
      },
      hasUnseenStory: false,
      lastUpdated: '12h',
      storiesCount: 3
    },
    {
      id: '7',
      shop: {
        id: '7',
        name: 'Gadget World',
        username: 'gadget_world',
        avatar: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=150&h=150&fit=crop&crop=center',
        isVerified: true
      },
      hasUnseenStory: true,
      lastUpdated: '1h',
      storiesCount: 6
    }
  ]);

  // Mock story data with actual content
  const storyData = stories.map(story => ({
    id: story.id,
    shop: story.shop,
    items: [
      {
        id: '1',
        type: 'image' as const,
        url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=400&h=700&fit=crop`,
        duration: 5,
        timestamp: story.lastUpdated,
        product: Math.random() > 0.5 ? {
          id: '1',
          name: 'Featured Product',
          price: Math.floor(Math.random() * 5000) + 500,
          image: story.shop.avatar
        } : undefined
      },
      {
        id: '2',
        type: 'image' as const,
        url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=400&h=700&fit=crop`,
        duration: 4,
        timestamp: story.lastUpdated,
      }
    ]
  }));

  const handleStoryClick = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setIsStoryViewerOpen(true);
  };

  const handleAddStory = () => {
    console.log('Add your story');
    // Here you would implement add story logic
  };

  return (
    <div className="w-full bg-gradient-to-r from-emerald-50/90 via-sky-50/90 to-blue-50/90 backdrop-blur-md dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90 border-b border-emerald-200/50 dark:border-gray-700 sticky top-16 z-40 shadow-xl">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-24 h-24 bg-sky-200/20 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative px-6 py-3">
        {/* Compact Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
            Stories
          </h2>
          <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
            View All
          </button>
        </div>
        
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-1">
          
          {/* Add Your Story - Compact */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-emerald-400 dark:border-gray-600 group-hover:border-emerald-500 dark:group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 shadow-md">
                <PlusIcon className="w-5 h-5 text-emerald-600 dark:text-gray-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-700 dark:text-gray-400 text-center w-14 truncate">
              Add Story
            </span>
          </div>

          {/* Shop Stories - Compact */}
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
              onClick={() => handleStoryClick(index)}
            >
              <div className="relative">
                {/* Compact Story Ring */}
                <div className={`p-0.5 rounded-full transition-all duration-300 group-hover:scale-105 ${
                  story.hasUnseenStory 
                    ? 'bg-gradient-to-tr from-emerald-500 via-sky-500 to-blue-600 shadow-md' 
                    : 'bg-gradient-to-tr from-emerald-200 via-sky-200 to-blue-200 dark:bg-gray-600'
                }`}>
                  <div className="p-0.5 bg-white dark:bg-gray-900 rounded-full">
                    <img
                      src={story.shop.avatar}
                      alt={story.shop.name}
                      className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Compact Verification Badge */}
                {story.shop.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Compact Stories Count Badge */}
                {story.storiesCount > 1 && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
                    <span className="text-xs text-white font-bold">{story.storiesCount}</span>
                  </div>
                )}
              </div>

              {/* Compact Shop Name */}
              <span className="text-xs font-medium text-emerald-900 dark:text-white text-center w-14 truncate">
                {story.shop.name}
              </span>
            </div>
          ))}

          {/* Compact View All Stories */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group ml-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center group-hover:from-emerald-200 group-hover:via-sky-200 group-hover:to-blue-200 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600 transition-all duration-300 border-2 border-emerald-200 group-hover:border-emerald-300 shadow-md group-hover:scale-105">
              <svg className="w-5 h-5 text-emerald-600 dark:text-gray-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className="text-xs font-medium text-emerald-700 dark:text-gray-400 text-center w-14 truncate">
              View All
            </span>
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      <StoryViewer
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        stories={storyData}
        initialStoryIndex={selectedStoryIndex}
        initialItemIndex={0}
      />
    </div>
  );
}

export default StoriesSection;
