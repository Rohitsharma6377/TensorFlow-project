import type { SidebarShop } from '@/store/slice/shopsSlice'

export const mockShops: SidebarShop[] = [
  {
    _id: 's_gadgethub',
    name: 'Gadget Hub',
    slug: 'gadget-hub',
    avatar: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=128&q=80',
    banner: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80',
    followers: 4200,
    isFollowing: true,
  } as any,
  {
    _id: 's_shopaholic',
    name: 'Shopaholic',
    slug: 'shopaholic',
    avatar: 'https://images.unsplash.com/photo-1503342394123-480259ab9d99?w=128&q=80',
    banner: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    followers: 3100,
    isFollowing: false,
  } as any,
  {
    _id: 's_urbanthreads',
    name: 'Urban Threads',
    slug: 'urban-threads',
    avatar: 'https://images.unsplash.com/photo-1520975922203-b6b8c1df5c05?w=128&q=80',
    banner: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80',
    followers: 520,
    isFollowing: false,
  } as any,
]
