"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { AuthAPI } from '@/lib/api';
import { useAppDispatch } from '@/store';
import { toggleStoryLike, addStoryView } from '@/store/slice/storySlice';
import { ensureConversation, sendMessageThunk } from '@/store/slice/chatSlice';

interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number;
  timestamp: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: {
    id: string;
    shop: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      isVerified: boolean;
    };
    items: StoryItem[];
  }[];
  initialStoryIndex: number;
  initialItemIndex: number;
}

export function StoryViewer({ 
  isOpen, 
  onClose, 
  stories, 
  initialStoryIndex = 0, 
  initialItemIndex = 0 
}: StoryViewerProps) {
  const dispatch = useAppDispatch();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Record a view once per story per session when first item is visible
  const [viewedSet] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const story = stories[currentStoryIndex];
    if (!story) return;
    const id = String(story.id);
    if (currentItemIndex === 0 && !viewedSet.has(id)) {
      viewedSet.add(id);
      dispatch(addStoryView(id));
    }
  }, [currentStoryIndex, currentItemIndex, stories, dispatch, viewedSet]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const currentStory = stories[currentStoryIndex];
  const currentItem = currentStory?.items[currentItemIndex];

  useEffect(() => {
    if (!isOpen || !currentItem) return;

    const duration = currentItem.duration * 1000; // Convert to milliseconds
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextItem();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentStoryIndex, currentItemIndex]);

  const nextItem = () => {
    if (currentItemIndex < currentStory.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setProgress(0);
    } else {
      nextStory();
    }
  };

  const prevItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setProgress(0);
    } else {
      prevStory();
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentItemIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setCurrentItemIndex(0);
      setProgress(0);
    }
  };

  const handleLike = () => {
    setIsLiked((v) => !v); // optimistic
    if (currentItem?.id) {
      dispatch(toggleStoryLike(String(currentItem.id)));
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      // Ensure conversation using Redux thunks
      const me = await AuthAPI.getCurrentUser().catch(() => null);
      const participants: string[] = [];
      if (me?.user?.id) participants.push(me.user.id);
      if (currentStory?.shop?.id) participants.push(String(currentStory.shop.id));
      let conversationId: string | undefined;
      if (participants.length) {
        const conv = await dispatch(ensureConversation({ participants })).unwrap();
        conversationId = conv?._id;
      }
      // Attach product and story metadata if available (as JSON strings for backend [string] schema)
      const attachment: string[] = [];
      if (currentItem?.product) {
        attachment.push(JSON.stringify({
          type: 'product',
          productId: currentItem.product.id,
          title: currentItem.product.name,
          price: currentItem.product.price,
          image: currentItem.product.image,
        }));
      }
      attachment.push(JSON.stringify({ type: 'story', storyId: currentStory.id, itemId: currentItem.id }));
      if (conversationId) {
        await dispatch(sendMessageThunk({ conversationId, text: message, attachments: attachment })).unwrap();
        setToast('Reply sent');
        setTimeout(() => setToast(null), 1500);
      } else {
        // If no conversation was created, still show optimistic toast
        setToast('Reply sent');
        setTimeout(() => setToast(null), 1500);
      }
    } catch (e) {
      // swallow; UI remains optimistic
    } finally {
      setMessage('');
    }
  };

  if (!isOpen || !currentStory || !currentItem) return null;

  // Use portal to ensure the modal renders above all content regardless of parent stacking contexts
  const content = (
    <div role="dialog" aria-modal="true" aria-label="Story Viewer" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close Story Viewer" />
      
      {/* Story container - Instagram-like 9:16 phone aspect */}
      <div
        className="relative z-20 bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[80vh] aspect-[9/16] w-full max-w-[420px] sm:max-w-[480px] md:max-w-[540px] mx-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Edge close button on the box corner */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-4 -right-4 z-40 text-white/90 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition shadow-lg"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        
        {/* Header with gradient background */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-6 pb-8">
          {/* Progress bars */}
          <div className="px-4 mb-4 flex gap-1">
            {currentStory.items.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-100 ease-linear rounded-full"
                  style={{ 
                    width: index < currentItemIndex ? '100%' : 
                           index === currentItemIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header content */}
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={currentStory.shop.avatar} 
                  alt={currentStory.shop.name}
                  className="w-12 h-12 rounded-full object-cover border-3 border-gradient-to-r from-emerald-400 to-sky-400 shadow-lg"
                />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full -z-10"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-base tracking-wide">
                    {currentStory.shop.username}
                  </span>
                  {currentStory.shop.isVerified && (
                    <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm font-medium">
                    {currentStory.shop.name}
                  </span>
                  <span className="text-white/60 text-xs">
                    • {currentItem.timestamp}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/90 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all duration-200 touch-manipulation bg-black/30 backdrop-blur-sm"
              aria-label="Close"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
          </div>
        </div>

        {/* Navigation tap zones + buttons - Instagram style */}
        {/* Left half tap zone (kept below header) */}
        <div
          onClick={prevItem}
          className="absolute left-0 w-1/2 z-10 cursor-pointer"
          style={{top: 80, bottom: 0}}
        />
        {/* Right half tap zone */}
        <div
          onClick={nextItem}
          className="absolute right-0 w-1/2 z-10 cursor-pointer"
          style={{top: 80, bottom: 0}}
        />
        {/* Visible buttons for accessibility */}
        <button 
          onClick={prevItem}
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white p-3 hover:bg-black/30 rounded-full transition-all duration-200 touch-manipulation"
        >
          <ChevronLeftIcon className="h-8 w-8" />
        </button>
        <button 
          onClick={nextItem}
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white p-3 hover:bg-black/30 rounded-full transition-all duration-200 touch-manipulation"
        >
          <ChevronRightIcon className="h-8 w-8" />
        </button>

        {/* Story content */}
        <div className="flex-1 relative">
          {currentItem.type === 'image' ? (
            <img 
              src={currentItem.url} 
              alt="Story content"
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={currentItem.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
            />
          )}
          
          {/* Product overlay */}
          {currentItem.product && (
            <div className="absolute bottom-28 left-4 right-4 bg-gradient-to-r from-emerald-500/80 to-sky-500/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-300/30">
              <div className="flex items-center gap-3">
                <img 
                  src={currentItem.product.image} 
                  alt={currentItem.product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">
                    {currentItem.product.name}
                  </p>
                  <p className="text-emerald-200 font-bold text-sm">
                    ₹{currentItem.product.price.toLocaleString()}
                  </p>
                </div>
                <button className="bg-gradient-to-r from-emerald-400 to-sky-400 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-emerald-500 hover:to-sky-500 transition-all shadow-lg">
                  Shop Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions with gradient background */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-8">
          <div className="px-4 flex items-center gap-4">
            <button 
              onClick={handleLike} 
              className="text-white/90 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all duration-200 touch-manipulation"
            >
              {isLiked ? (
                <HeartSolidIcon className="h-7 w-7 text-red-500" />
              ) : (
                <HeartIcon className="h-7 w-7" />
              )}
            </button>
            <div className="flex-1 flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-md rounded-full px-4 py-3 border border-white/20 shadow-lg">
              <input
                type="text"
                placeholder={`Reply to ${currentStory.shop.username}...`}
                className="flex-1 bg-transparent appearance-none text-white placeholder-white/70 caret-white border-none outline-none text-base font-medium"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage} 
                className="text-white/90 hover:text-white ml-3 p-2 hover:bg-white/10 rounded-full transition-all duration-200 touch-manipulation"
              >
                <PaperAirplaneIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Local toast */}
        {toast && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md text-sm">
            {toast}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  const root = document.body;
  return createPortal(content, root);
}

export default StoryViewer;
