"use client";

import React, { useEffect } from 'react';
import { ChevronRightIcon, StarIcon, TagIcon, FireIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSidebarShops, toggleFollowShop, setFollowing } from '@/store/slice/shopsSlice';

interface ShopStats { followers: number }

interface Offer {
  id: string;
  title: string;
  discount: string;
  image: string;
  shop: string;
  validUntil: string;
}

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
}

export function LeftSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const { items: featuredShops, status } = useAppSelector((s) => s.shops);

  useEffect(() => {
    if (status === 'idle' && featuredShops.length === 0) {
      dispatch(fetchSidebarShops());
    }
  }, [dispatch, status, featuredShops.length]);

  const onToggleFollow = (shopId: string, follow: boolean) => {
    // Optimistic update
    dispatch(setFollowing({ shopId, isFollowing: follow }));
    dispatch(toggleFollowShop({ id: shopId, follow }));
  };

  const hotOffers: Offer[] = [
    {
      id: '1',
      title: 'Winter Sale',
      discount: '50% OFF',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
      shop: 'Fashion Hub',
      validUntil: '2025-01-31'
    },
    {
      id: '2',
      title: 'Electronics Deal',
      discount: '30% OFF',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      shop: 'Tech Store',
      validUntil: '2025-01-25'
    }
  ];

  const banners: Banner[] = [
    {
      id: '1',
      title: 'New Year Sale',
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=150&fit=crop',
      link: '/sales/new-year'
    },
    {
      id: '2',
      title: 'Free Shipping',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=150&fit=crop',
      link: '/shipping'
    }
  ];

  // Only show shops the user is not following yet
  const unfollowed = Array.isArray(featuredShops) ? featuredShops.filter((s: any) => !s.isFollowing) : [];

  return (
    <div className="w-full h-full bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 border-r border-emerald-200 dark:border-gray-700 overflow-y-auto shadow-lg">
      <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-16 sm:pb-4 space-y-5 sm:space-y-6">{/* mobile-safe padding */}
        
        {/* Featured Shops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-white flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-emerald-500" />
              Featured Shops
            </h3>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {status === 'loading' && <div className="text-xs text-gray-500">Loading shops...</div>}
            {status !== 'loading' && unfollowed.length === 0 && (
              <div className="text-xs text-gray-500">No shops found.</div>
            )}
            {/* Horizontal scroll on mobile, stacked on md+ */}
            <div className="flex gap-2 overflow-x-auto md:overflow-visible md:flex-col no-scrollbar py-1">
            {unfollowed.map((shop) => {
              const logo = typeof (shop as any).logo === 'object' ? ((shop as any).logo as any)?.url : ((shop as any).logo as string | undefined);
              const isFollowing = !!(shop as any).isFollowing;
              return (
                <div
                  key={shop._id}
                  className="flex-shrink-0 md:flex-shrink md:w-auto w-[85%] xs:w-[70%] sm:w-auto flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-emerald-200"
                >
                  <Link href={`/shop/${shop.slug}`} className="flex items-center gap-3" onClick={onNavigate}
                  >
                    <div className="relative">
                      <img
                        src={logo || '/shop-placeholder.png'}
                        alt={shop.name}
                        loading="lazy"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {shop.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 dark:text-white truncate">
                        {shop.name}
                      </p>
                      {typeof (shop as any).followers === 'number' && (
                        <p className="text-xs text-sky-600 dark:text-gray-400">
                          {(shop as any).followers.toLocaleString()} followers
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => onToggleFollow(shop._id, !isFollowing)}
                    className={`text-xs px-2 py-1 rounded-full border ${isFollowing ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-sky-300 text-sky-700 hover:bg-sky-50'}`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Banner Slider */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-sky-800 dark:text-white flex items-center gap-2">
            <FireIcon className="h-4 w-4 text-sky-500" />
            Hot Deals
          </h3>
          
          <div className="space-y-2 sm:space-y-3">
            {banners.map((banner) => (
              <Link key={banner.id} href={banner.link} onClick={onNavigate} className="block">
                <div className="relative rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-sky-300 transition-all">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    loading="lazy"
                    className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/70 to-sky-500/70 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{banner.title}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hot Offers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-white flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-emerald-500" />
              Limited Offers
            </h3>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {hotOffers.map((offer) => (
              <div key={offer.id} className="bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-900/20 dark:to-sky-900/20 rounded-lg p-2 sm:p-3 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    loading="lazy"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {offer.discount}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-white mt-1 line-clamp-1">
                      {offer.title}
                    </p>
                    <p className="text-xs text-sky-600 dark:text-gray-400">
                      by {offer.shop}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-white">
            Categories
          </h3>
          
          <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 gap-2">
            {[
              { name: 'Fashion', icon: '👗', color: 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-300' },
              { name: 'Electronics', icon: '📱', color: 'bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700 border border-sky-300' },
              { name: 'Home', icon: '🏠', color: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 border border-blue-300' },
              { name: 'Beauty', icon: '💄', color: 'bg-gradient-to-br from-emerald-100 to-sky-200 text-emerald-700 border border-emerald-300' },
              { name: 'Sports', icon: '⚽', color: 'bg-gradient-to-br from-sky-100 to-blue-200 text-sky-700 border border-sky-300' },
              { name: 'Books', icon: '📚', color: 'bg-gradient-to-br from-blue-100 to-emerald-200 text-blue-700 border border-blue-300' }
            ].map((category) => (
              <Link
                key={category.name}
                href={`/explore?category=${encodeURIComponent(category.name)}`}
                className={`${category.color} rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:scale-105 transition-transform`}
                onClick={onNavigate}
              >
                <div className="text-base sm:text-lg mb-1">{category.icon}</div>
                <div className="text-[11px] sm:text-xs font-medium">{category.name}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-white">
            Trending
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {['#WinterSale', '#NewYear2025', '#Fashion', '#TechDeals', '#HomeDecor'].map((tag) => (
              <Link
                key={tag}
                href={`/explore?q=${encodeURIComponent(tag.replace('#',''))}`}
                className="bg-gradient-to-r from-emerald-100 to-sky-100 dark:bg-gray-800 text-emerald-700 dark:text-gray-300 text-[11px] sm:text-xs px-2 py-1 rounded-full cursor-pointer hover:from-emerald-200 hover:to-sky-200 dark:hover:bg-gray-700 transition-all border border-emerald-200"
                onClick={onNavigate}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default LeftSidebar;
