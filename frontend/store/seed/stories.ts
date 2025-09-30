import type { StoryDTO } from '@/lib/api'

export const mockStories: StoryDTO[] = [
  {
    _id: 'st1',
    shop: 's_urbanthreads' as any,
    media: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    product: 'p2' as any,
    cta: 'Shop Now',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 12,
    likes: 3,
    expiresAt: undefined,
  } as any,
  {
    _id: 'st2',
    shop: 's_gadgethub' as any,
    media: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80',
    product: 'p3' as any,
    cta: 'Buy Now',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 33,
    likes: 10,
    expiresAt: undefined,
  } as any,
]
