"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(initialItemIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [message, setMessage] = useState('');

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
    setIsLiked(!isLiked);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message, 'to', currentStory.shop.username);
      setMessage('');
    }
  };

  if (!isOpen || !currentStory || !currentItem) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black" onClick={onClose} />
      
      {/* Story container */}
      <div className="relative w-full max-w-md h-full bg-black flex flex-col">
        
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
          {currentStory.items.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: index < currentItemIndex ? '100%' : 
                         index === currentItemIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={currentStory.shop.avatar} 
              alt={currentStory.shop.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold text-sm">
                  {currentStory.shop.username}
                </span>
                {currentStory.shop.isVerified && (
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-white text-xs opacity-75">
                {currentItem.timestamp}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white p-1">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation buttons */}
        <button 
          onClick={prevItem}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white p-2"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        
        <button 
          onClick={nextItem}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white p-2"
        >
          <ChevronRightIcon className="h-6 w-6" />
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
            <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-r from-emerald-500/80 to-sky-500/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-300/30">
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

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={handleLike} className="text-white">
              {isLiked ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6" />
              )}
            </button>
            <div className="flex-1 flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-300/30">
              <input
                type="text"
                placeholder={`Reply to ${currentStory.shop.username}...`}
                className="flex-1 bg-transparent text-white placeholder-white placeholder-opacity-75 border-none outline-none text-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="text-white ml-2">
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryViewer;
