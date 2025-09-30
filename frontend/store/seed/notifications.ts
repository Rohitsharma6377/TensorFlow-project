import type { NotificationItem } from '@/store/slice/notificationSlice';

function isoMinutesAgo(mins: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

export const mockNotifications: NotificationItem[] = [
  {
    _id: 'n1',
    type: 'post_like',
    actor: { name: 'Aarav Mehta', username: 'aaravm', avatar: 'https://i.pravatar.cc/100?img=12' },
    shop: { _id: 's_gadgethub', name: 'Gadget Hub', slug: 'gadget-hub', avatar: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=128&q=80', banner: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80' },
    post: { _id: 'p1', slug: 'smart-watch-v3', title: 'Smart Watch V3' },
    message: 'loved your new product post',
    createdAt: isoMinutesAgo(8),
  },
  {
    _id: 'n2',
    type: 'post_comment',
    actor: { name: 'Shopaholic Club', username: 'shopaholic' },
    shop: { _id: 's_shopaholic', name: 'Shopaholic', slug: 'shopaholic', avatar: 'https://images.unsplash.com/photo-1503342394123-480259ab9d99?w=128&q=80', banner: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80' },
    post: { _id: 'p2', slug: 'leather-tote', title: 'Premium Leather Tote' },
    message: 'Amazing quality! 🔥',
    createdAt: isoMinutesAgo(16),
  },
  {
    _id: 'n3',
    type: 'follow',
    actor: { name: 'Riya Singh', username: 'riyasingh', avatar: 'https://i.pravatar.cc/100?img=32' },
    shop: { _id: 's_urbanthreads', name: 'Urban Threads', slug: 'urban-threads', avatar: 'https://images.unsplash.com/photo-1520975922203-b6b8c1df5c05?w=128&q=80', banner: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80' },
    createdAt: isoMinutesAgo(45),
  },
  {
    _id: 'n4',
    type: 'story_new',
    shop: { _id: 's_urbanthreads', name: 'Urban Threads', slug: 'urban-threads', avatar: 'https://images.unsplash.com/photo-1520975922203-b6b8c1df5c05?w=128&q=80' },
    story: { _id: 'st1', cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80' },
    createdAt: isoMinutesAgo(110),
  },
  {
    _id: 'n5',
    type: 'post_new',
    shop: { _id: 's_gadgethub', name: 'Gadget Hub', slug: 'gadget-hub', avatar: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=128&q=80' },
    post: { _id: 'p3', slug: 'wireless-earbuds-pro', title: 'Wireless Earbuds Pro' },
    createdAt: isoMinutesAgo(300),
  },
];
