"use client";

import React, { useEffect, useState } from 'react';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchFeed } from '@/store/slice/feedSlice';
import { PostsAPI, SocialAPI, type PostDTO } from '@/lib/api';
import { toast } from '@/lib/toast';
export function MainFeed() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.feed);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{ [key: string]: number }>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [followingShops, setFollowingShops] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(fetchFeed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lm: Record<string, boolean> = {};
    const fm = new Set<string>();
    items.forEach((p) => {
      lm[p._id] = !!p.isLiked;
      const shopObj = typeof p.shop === 'object' ? p.shop : undefined;
      if (shopObj?._id && shopObj.isFollowing) fm.add(shopObj._id);
    });
    setLikedMap(lm);
    setFollowingShops(fm);
  }, [items]);

  const handleLike = async (postId: string) => {
    try {
      setLikedMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
      await PostsAPI.like(postId);
      toast.success('Updated like');
    } catch (e) {
      setLikedMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
      toast.error('Failed to like');
    }
  };

  const handleSave = (postId: string) => {
    setSavedMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
    // TODO: implement backend bookmark/save when available
    toast.info(savedMap[postId] ? 'Removed from saved' : 'Saved for later');
  };

  const toggleFollow = async (shopId: string) => {
    const isFollowing = followingShops.has(shopId);
    const newSet = new Set(followingShops);
    try {
      if (isFollowing) {
        newSet.delete(shopId);
        setFollowingShops(newSet);
        await SocialAPI.unfollow(shopId);
        toast.info('Unfollowed shop');
      } else {
        newSet.add(shopId);
        setFollowingShops(newSet);
        await SocialAPI.follow(shopId);
        toast.success('Now following shop');
      }
    } catch (e) {
      // revert on error
      if (isFollowing) newSet.add(shopId); else newSet.delete(shopId);
      setFollowingShops(newSet);
      toast.error('Failed to update follow');
    }
  };

  const submitComment = async (postId: string) => {
    const text = (commentText[postId] || '').trim();
    if (!text) return;
    setCommentLoading((m) => ({ ...m, [postId]: true }));
    try {
      await PostsAPI.comment(postId, text);
      setCommentText((m) => ({ ...m, [postId]: '' }));
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to comment');
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
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
      {status !== 'loading' && items.length === 0 && (
        <div className="mx-auto my-10 max-w-xl text-center rounded-xl border border-emerald-200/50 bg-white/70 dark:bg-gray-900/70 p-6">
          <h3 className="text-xl font-semibold text-emerald-900 dark:text-white">No posts yet</h3>
          <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">Follow shops or create a post to see content here.</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/shops" className="text-emerald-700 hover:underline">Discover shops</Link>
            <span className="text-slate-400">•</span>
            <Link href="/seller/posts/new" className="text-emerald-700 hover:underline">Create post</Link>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((post: PostDTO) => {
          const pid = post._id;
          const currentIndex = currentMediaIndex[pid] || 0;
          const mediaArr = post.media && post.media.length ? post.media : [];
          const shopObj = typeof post.shop === 'object' ? post.shop : undefined;
          const shopId = shopObj?._id || '';
          const shopSlug = shopObj?.slug || '';
          const shopName = shopObj?.name || 'Shop';
          const shopLogo = typeof shopObj?.logo === 'object' ? (shopObj?.logo as any)?.url : (shopObj?.logo as string | undefined);
          const isLiked = likedMap[pid] || false;
          const isSaved = savedMap[pid] || false;
          const likesCount = post.likesCount || 0;
          const prodObj = typeof post.product === 'object' ? post.product as any : undefined;
          const prodThumb = prodObj?.mainImage || (Array.isArray(prodObj?.images) ? prodObj.images[0] : undefined);
          
          return (
            <div key={pid} className="relative bg-white/90 backdrop-blur-md dark:bg-gray-900/90 rounded-2xl border border-emerald-200/50 dark:border-gray-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-sky-50/20 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Post Header */}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {shopSlug ? (
                      <Link href={`/shops/${shopSlug}`} className="block">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 p-0.5 overflow-hidden">
                          <img
                            src={shopLogo || '/shop-placeholder.png'}
                            alt={shopName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 p-0.5 overflow-hidden">
                        <img
                          src={shopLogo || '/shop-placeholder.png'}
                          alt={shopName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center gap-2">
                      {shopSlug ? (
                        <Link href={`/shops/${shopSlug}`} className="font-semibold text-emerald-900 dark:text-white text-sm truncate hover:underline">
                          {shopName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-emerald-900 dark:text-white text-sm truncate">{shopName}</span>
                      )}
                      {shopObj?.isVerified && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
                      )}
                    </div>
                    <span className="text-xs text-sky-600 dark:text-gray-400">
                      {new Date(post.createdAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>
                {shopId && (
                  <button
                    onClick={() => toggleFollow(shopId)}
                    className="text-xs px-2 py-1 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {followingShops.has(shopId) ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Post Media - Fixed 300x300 */}
              <div className="relative mx-auto mb-2 w-full max-w-[300px]">
                <div className="w-full h-[300px] bg-gradient-to-br from-emerald-50 to-sky-50 dark:bg-gray-800 relative overflow-hidden rounded-lg border border-emerald-100 dark:border-gray-700 shadow-inner">
                  {mediaArr[0] && (
                    <img
                      src={mediaArr[currentIndex]}
                      alt="Post content"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Optional reel overlay if audio present in future */}
                  {false && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        className="w-8 h-8 bg-emerald-500/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-emerald-600/70 transition-colors"
                      >
                        <PlayIcon className="h-8 w-8 text-white ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Media Navigation */}
                  {mediaArr.length > 1 && (
                    <>
                      <button
                        onClick={() => prevMedia(pid, mediaArr.length)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => nextMedia(pid, mediaArr.length)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                      >
                        ›
                      </button>
                      
                      {/* Media Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {mediaArr.map((_, index) => (
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
                      onClick={() => handleLike(pid)}
                      className="hover:scale-110 transition-all duration-200 group/like"
                    >
                      {isLiked ? (
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
                    onClick={() => handleSave(pid)}
                    className="hover:scale-110 transition-all duration-200 group/save"
                  >
                    <BookmarkIcon 
                      className={`h-5 w-5 transition-colors ${
                        isSaved 
                          ? 'text-emerald-500 fill-current' 
                          : 'text-emerald-600 dark:text-gray-300 group-hover/save:text-emerald-700'
                      }`} 
                    />
                  </button>
                </div>

                {/* Engagement Stats */}
                <div className="mb-2">
                  <p className="font-bold text-emerald-900 dark:text-white text-sm">
                    {likesCount.toLocaleString()} likes
                  </p>
                </div>

                {/* Caption */}
                <div className="mb-2">
                  <p className="text-emerald-900 dark:text-white text-xs leading-relaxed line-clamp-2">
                    {shopName && (
                      <span className="font-semibold text-emerald-800">{shopName}</span>
                    )}{' '}
                    <span className="text-gray-700 dark:text-gray-300">{post.caption || ''}</span>
                  </p>
                </div>

                {/* Tagged Product Preview */}
                {prodObj?._id && (
                  <Link href={`/products/${prodObj._id}`} className="block mb-3">
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200/60 bg-white/80 dark:bg-gray-800/70 p-2 hover:shadow-md transition-shadow">
                      <div className="h-14 w-14 rounded-md overflow-hidden bg-slate-100 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prodThumb || '/product-placeholder.png'} alt={prodObj.title || 'Product'} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-emerald-900 dark:text-white truncate">{prodObj.title || 'Product'}</div>
                        {typeof prodObj.price === 'number' && (
                          <div className="text-sm font-semibold text-emerald-700">₹{Number(prodObj.price).toLocaleString()}</div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs px-2 py-1 rounded-full border border-emerald-300 text-emerald-700">View</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Comment input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={commentText[pid] || ''}
                    onChange={(e) => setCommentText((m) => ({ ...m, [pid]: e.target.value }))}
                    placeholder="Add a comment..."
                    className="flex-1 text-sm rounded-md border border-emerald-200 bg-white/70 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    disabled={commentLoading[pid] || !(commentText[pid] || '').trim()}
                    onClick={() => submitComment(pid)}
                    className="text-xs px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-60"
                  >
                    {commentLoading[pid] ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
  );

}
export default MainFeed;
