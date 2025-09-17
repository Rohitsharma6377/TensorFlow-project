"use client";

import { useState } from 'react';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  PaperAirplaneIcon, 
  BookmarkIcon, 
  EllipsisHorizontalIcon, 
  FaceSmileIcon 
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid, 
  BookmarkIcon as BookmarkIconSolid 
} from '@heroicons/react/24/solid';
import { faker } from '@faker-js/faker';
import Image from 'next/image';

type Post = {
  id: string;
  username: string;
  userImage: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  isSaved: boolean;
};

type Story = {
  id: string;
  username: string;
  image: string;
  hasUnseenStory: boolean;
};

// Generate mock data
const generateMockPosts = (count: number): Post[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    userImage: faker.image.avatar(),
    image: `https://picsum.photos/600/600?random=${Math.floor(Math.random() * 1000)}`,
    caption: faker.lorem.sentence(),
    likes: faker.number.int({ min: 10, max: 1000 }),
    comments: faker.number.int({ min: 0, max: 100 }),
    timestamp: faker.date.recent().toISOString(),
    isLiked: false,
    isSaved: false,
  }));
};

const generateMockStories = (count: number): Story[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    image: `https://i.pravatar.cc/150?img=${i + 1}`,
    hasUnseenStory: Math.random() > 0.5,
  }));
};

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>(() => generateMockPosts(5));
  const [stories] = useState<Story[]>(() => generateMockStories(10));
  const [commentText, setCommentText] = useState('');
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const toggleSave = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isSaved: !post.isSaved
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    
    // In a real app, you would send this to your backend
    console.log(`Adding comment to post ${postId}: ${commentText}`);
    setCommentText('');
    setActiveCommentBox(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Stories */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-4 p-4 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center space-y-1">
              <div className={`p-0.5 rounded-full ${story.hasUnseenStory ? 'bg-gradient-to-tr from-yellow-400 to-pink-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <div className="p-0.5 bg-white dark:bg-gray-900 rounded-full">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 p-0.5 overflow-hidden">
                      <Image
                        src={story.image}
                        alt={story.username}
                        width={64}
                        height={64}
                        className="rounded-full object-cover h-full w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs truncate w-16 text-center">{story.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
                  <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 p-0.5">
                    <Image
                      src={post.userImage}
                      alt={post.username}
                      width={32}
                      height={32}
                      className="rounded-full object-cover h-full w-full"
                    />
                  </div>
                </div>
                <span className="font-semibold text-sm">{post.username}</span>
              </div>
              <button>
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800">
              <Image
                src={post.image}
                alt={post.caption}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Post Actions */}
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <button onClick={() => toggleLike(post.id)}>
                    {post.isLiked ? (
                      <HeartIconSolid className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                  </button>
                  <button onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)}>
                    <ChatBubbleOvalLeftIcon className="h-6 w-6" />
                  </button>
                  <button>
                    <PaperAirplaneIcon className="h-6 w-6 -rotate-45" />
                  </button>
                </div>
                <button onClick={() => toggleSave(post.id)}>
                  {post.isSaved ? (
                    <BookmarkIconSolid className="h-6 w-6" />
                  ) : (
                    <BookmarkIcon className="h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Likes */}
              <p className="font-semibold text-sm">{post.likes.toLocaleString()} likes</p>

              {/* Caption */}
              <p className="text-sm">
                <span className="font-semibold mr-2">{post.username}</span>
                {post.caption}
              </p>

              {/* Comments */}
              {post.comments > 0 && (
                <button className="text-gray-500 text-sm">
                  View all {post.comments} comments
                </button>
              )}

              {/* Timestamp */}
              <p className="text-gray-400 text-xs uppercase">
                {formatTimestamp(post.timestamp)}
              </p>

              {/* Add Comment */}
              {activeCommentBox === post.id && (
                <div className="flex items-center border-t border-gray-200 dark:border-gray-800 pt-3 mt-2">
                  <FaceSmileIcon className="h-6 w-6 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button
                    className={`text-blue-500 font-semibold text-sm ${!commentText.trim() ? 'opacity-50' : ''}`}
                    disabled={!commentText.trim()}
                    onClick={() => handleAddComment(post.id)}
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
