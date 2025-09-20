"use client";

import React, { useState } from 'react';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  EllipsisHorizontalIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Post {
  id: string;
  type: 'image' | 'video' | 'reel';
  user: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  shop?: {
    id: string;
    name: string;
  };
  content: {
    media: string[];
    caption: string;
    tags: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  products?: {
    id: string;
    name: string;
    price: number;
    image: string;
  }[];
  timestamp: string;
}

export function MainFeed() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      type: 'image',
      user: {
        id: '1',
        username: 'fashion_hub_official',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=center',
        isVerified: true
      },
      shop: {
        id: '1',
        name: 'Fashion Hub'
      },
      content: {
        media: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=600&fit=crop'
        ],
        caption: 'New winter collection is here! ❄️ Stay warm and stylish with our latest designs. Limited time offer - 50% off on all winter wear! #WinterFashion #Sale #NewCollection',
        tags: ['#WinterFashion', '#Sale', '#NewCollection']
      },
      engagement: {
        likes: 1250,
        comments: 89,
        shares: 45,
        isLiked: false,
        isSaved: false
      },
      products: [
        {
          id: '1',
          name: 'Winter Coat',
          price: 2999,
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop'
        },
        {
          id: '2',
          name: 'Wool Sweater',
          price: 1499,
          image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop'
        }
      ],
      timestamp: '2h'
    },
    {
      id: '2',
      type: 'reel',
      user: {
        id: '2',
        username: 'tech_reviewer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
        isVerified: true
      },
      shop: {
        id: '2',
        name: 'Tech Store'
      },
      content: {
        media: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=800&fit=crop'],
        caption: '🔥 Unboxing the latest smartphone! Amazing camera quality and performance. Get 30% off this week only! Link in bio 📱 #TechReview #Smartphone #Unboxing',
        tags: ['#TechReview', '#Smartphone', '#Unboxing']
      },
      engagement: {
        likes: 2100,
        comments: 156,
        shares: 78,
        isLiked: true,
        isSaved: true
      },
      products: [
        {
          id: '3',
          name: 'Latest Smartphone',
          price: 45999,
          image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
        }
      ],
      timestamp: '4h'
    },
    {
      id: '3',
      type: 'image',
      user: {
        id: '3',
        username: 'home_decor_ideas',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=center',
        isVerified: false
      },
      shop: {
        id: '3',
        name: 'Home Decor'
      },
      content: {
        media: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop'
        ],
        caption: 'Transform your living space with these beautiful decor pieces! ✨ Modern, elegant, and affordable. Free shipping on orders above ₹2000 🚚 #HomeDecor #InteriorDesign #ModernHome',
        tags: ['#HomeDecor', '#InteriorDesign', '#ModernHome']
      },
      engagement: {
        likes: 890,
        comments: 67,
        shares: 23,
        isLiked: false,
        isSaved: false
      },
      products: [
        {
          id: '4',
          name: 'Modern Lamp',
          price: 1299,
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop'
        },
        {
          id: '5',
          name: 'Decorative Vase',
          price: 899,
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop'
        }
      ],
      timestamp: '6h'
    }
  ]);

  const [currentMediaIndex, setCurrentMediaIndex] = useState<{[key: string]: number}>({});

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              isLiked: !post.engagement.isLiked,
              likes: post.engagement.isLiked 
                ? post.engagement.likes - 1 
                : post.engagement.likes + 1
            }
          }
        : post
    ));
  };

  const handleSave = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              isSaved: !post.engagement.isSaved
            }
          }
        : post
    ));
  };

  const nextMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % mediaLength
    }));
  };

  const prevMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + mediaLength) % mediaLength
    }));
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => {
          const currentIndex = currentMediaIndex[post.id] || 0;
          
          return (
            <div key={post.id} className="relative bg-white/90 backdrop-blur-md dark:bg-gray-900/90 rounded-2xl border border-emerald-200/50 dark:border-gray-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-sky-50/20 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Post Header */}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 p-0.5">
                      <img 
                        src={post.user.avatar} 
                        alt={post.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {post.user.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center border border-white shadow-md">
                        <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-emerald-900 dark:text-white text-sm truncate">
                        {post.user.username}
                      </span>
                      {post.shop && (
                        <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded-full truncate">
                          {post.shop.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-sky-600 dark:text-gray-400">
                      {post.timestamp}
                    </span>
                  </div>
                </div>
                <button className="p-1 hover:bg-emerald-50 dark:hover:bg-gray-800 rounded-full transition-all duration-200">
                  <EllipsisHorizontalIcon className="h-4 w-4 text-emerald-600 dark:text-gray-500" />
                </button>
              </div>

              {/* Post Media - Fixed 300x300 */}
              <div className="relative mx-auto mb-2 w-full max-w-[300px]">
                <div className="w-full h-[300px] bg-gradient-to-br from-emerald-50 to-sky-50 dark:bg-gray-800 relative overflow-hidden rounded-lg border border-emerald-100 dark:border-gray-700 shadow-inner">
                  <img
                    src={post.content.media[currentIndex]}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                  
                  {post.type === 'reel' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        className="w-8 h-8 bg-emerald-500/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-emerald-600/70 transition-colors"
                      >
                        <PlayIcon className="h-8 w-8 text-white ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Media Navigation */}
                  {post.content.media.length > 1 && (
                    <>
                      <button
                        onClick={() => prevMedia(post.id, post.content.media.length)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => nextMedia(post.id, post.content.media.length)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                      >
                        ›
                      </button>
                      
                      {/* Media Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {post.content.media.map((_, index) => (
                          <div 
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Post Actions */}
              <div className="relative p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="hover:scale-110 transition-all duration-200 group/like"
                    >
                      {post.engagement.isLiked ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500 group-hover/like:scale-125 transition-transform" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-emerald-600 dark:text-gray-300 group-hover/like:text-red-500 transition-colors" />
                      )}
                    </button>
                    <button className="hover:scale-110 transition-all duration-200 group/comment">
                      <ChatBubbleOvalLeftIcon className="h-5 w-5 text-sky-600 dark:text-gray-300 group-hover/comment:text-sky-700 transition-colors" />
                    </button>
                    <button className="hover:scale-110 transition-all duration-200 group/share">
                      <ShareIcon className="h-5 w-5 text-blue-600 dark:text-gray-300 group-hover/share:text-blue-700 transition-colors" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleSave(post.id)}
                    className="hover:scale-110 transition-all duration-200 group/save"
                  >
                    <BookmarkIcon 
                      className={`h-5 w-5 transition-colors ${
                        post.engagement.isSaved 
                          ? 'text-emerald-500 fill-current' 
                          : 'text-emerald-600 dark:text-gray-300 group-hover/save:text-emerald-700'
                      }`} 
                    />
                  </button>
                </div>

                {/* Engagement Stats */}
                <div className="mb-2">
                  <p className="font-bold text-emerald-900 dark:text-white text-sm">
                    {post.engagement.likes.toLocaleString()} likes
                  </p>
                </div>

                {/* Caption */}
                <div className="mb-2">
                  <p className="text-emerald-900 dark:text-white text-xs leading-relaxed line-clamp-2">
                    <span className="font-semibold text-emerald-800">{post.user.username}</span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{post.content.caption}</span>
                  </p>
                </div>

                {/* Products - Small square cards */}
                {post.products && post.products.length > 0 && (
                  <div className="border-t border-emerald-200 dark:border-gray-700 pt-3">
                    <div className="flex items-stretch gap-2">
                      {post.products.slice(0, 3).map((product) => (
                        <div
                          key={product.id}
                          className="w-16 h-20 rounded-md border border-emerald-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                        >
                          <div className="w-full h-16">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-1 py-0.5">
                            <p className="text-[10px] font-semibold text-emerald-900 dark:text-white truncate" title={product.name}>
                              {product.name}
                            </p>
                          </div>
                        </div>
                      ))}

                      {post.products.length > 3 && (
                        <div className="w-16 h-20 rounded-md border border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer hover:from-emerald-100 hover:to-sky-100 transition-all">
                          <div className="flex items-center gap-1">
                            <PlusIcon className="w-4 h-4" />
                            <span className="text-xs">{post.products.length - 3}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainFeed;
