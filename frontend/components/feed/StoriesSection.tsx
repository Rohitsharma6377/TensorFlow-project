"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import StoryViewer from './StoryViewer';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { StoriesAPI, SocialAPI, ShopsAPI } from '@/lib/api';

interface LocalStoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number;
  timestamp: string;
  product?: { id: string; name: string; price?: number; image?: string };
}

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
  items: LocalStoryItem[];
}

export function StoriesSection() {
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const router = useRouter();
  const myShop = useAppSelector((s: any) => s.shop?.shop);
  const myShopId = myShop?._id || myShop?.id;
  
  const [stories, setStories] = useState<Story[]>([]);

  // Only stories with at least one item are playable
  const playableStories = useMemo(() => stories.filter(s => (s.items?.length || 0) > 0), [stories]);

  // Build data for the viewer from live stories
  const storyData = useMemo(() => playableStories.map(story => ({
    id: story.id,
    shop: story.shop,
    items: story.items.map(it => ({
      id: it.id,
      type: it.type,
      url: it.url,
      duration: it.duration,
      timestamp: it.timestamp,
      product: it.product ? {
        id: it.product.id,
        name: it.product.name,
        price: it.product.price ?? 0,
        image: it.product.image || story.shop.avatar,
      } : undefined,
    }))
  })), [playableStories]);

  // Load followed shops + own shop stories
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // 1) My followed shops
        const following = await SocialAPI.following();
        const followedIds: string[] = Array.isArray(following?.shops) ? following.shops : [];
        // 2) Include my own shop id first
        const targetIds = Array.from(new Set([myShopId && String(myShopId), ...followedIds].filter(Boolean))) as string[];
        if (!targetIds.length) { setStories([]); return; }
        // 3) Get shop metadata
        const shopMeta = await ShopsAPI.bulk(targetIds);
        const metaMap = new Map(shopMeta.shops.map((s: any) => [String(s._id), s]));
        // 4) Fetch stories per shop
        const lists = await Promise.all(targetIds.map(id => StoriesAPI.listByShop(id).catch(() => ({ stories: [] as any[] }))));
        // 5) Build aggregated list
        const built: Story[] = targetIds.map((id, idx) => {
          const meta = metaMap.get(String(id));
          const raw = (lists[idx]?.stories || []) as any[];
          const items: LocalStoryItem[] = raw.slice(0, 10).map((st) => ({
            id: String(st._id),
            type: (st.media || '').match(/\.(png|jpe?g|gif|webp|svg)$/i) ? 'image' : 'video',
            url: st.media,
            duration: 5,
            timestamp: st.createdAt || new Date().toISOString(),
            product: st.product && typeof st.product === 'object' ? {
              id: String(st.product._id),
              name: st.product.title || 'Product',
              price: st.product.price,
              image: st.product.mainImage || (st.product.images?.[0])
            } : undefined
          }));
          // compute last updated
          const latest = items[0]?.timestamp || '';
          return {
            id: String(id),
            shop: {
              id: String(id),
              name: meta?.name || 'Shop',
              username: meta?.slug || meta?.name || 'shop',
              avatar: typeof meta?.logo === 'string' ? meta.logo : (meta?.logo?.url || 'https://via.placeholder.com/96'),
              isVerified: !!meta?.isVerified,
            },
            hasUnseenStory: items.length > 0,
            lastUpdated: latest || '',
            storiesCount: items.length,
            items,
          } as Story;
        });
        // 6) Sort by recency (latest first)
        built.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        if (!cancelled) setStories(built);
      } catch (_) {
        if (!cancelled) setStories([]);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [myShopId]);

  const handleStoryClick = (storyIndex: number) => {
    if (!playableStories[storyIndex] || playableStories[storyIndex].items.length === 0) return;
    setSelectedStoryIndex(storyIndex);
    setIsStoryViewerOpen(true);
  };

  const handleAddStory = () => {
    router.push('/seller/post');
  };

  // Remove old basic polling block in favor of full live aggregation above

  return (
    <div className="w-full">
      <div className="relative px-0 py-0">
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
                <button onClick={handleAddStory} aria-label="Add Story">
                  <PlusIcon className="w-5 h-5 text-emerald-600 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-700 dark:text-gray-400 text-center w-14 truncate">
              Add Story
            </span>
          </div>

          {/* Shop Stories - Compact (only those with items) */}
          {playableStories.map((story, index) => (
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

                {/* Small plus overlay to add more stories (visible for own shop) */}
                {myShopId && String(myShopId) === story.shop.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddStory(); }}
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md"
                    aria-label="Add Story"
                    title="Add Story"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                )}

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
