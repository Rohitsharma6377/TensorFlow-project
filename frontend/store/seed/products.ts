import type { ProductDTO } from '@/lib/api'

export const mockProducts: ProductDTO[] = [
  {
    _id: 'p1',
    title: 'Smart Watch V3',
    slug: 'smart-watch-v3',
    description: 'Advanced health tracking, AMOLED display, 7-day battery life, and waterproof design.',
    price: 129.99,
    images: [
      'https://images.unsplash.com/photo-1518442072071-9f8e4a3f6a49?w=1200&q=80',
    ],
    stock: 43,
    shop: 's_gadgethub' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any,
  {
    _id: 'p2',
    title: 'Premium Leather Tote',
    slug: 'leather-tote',
    description: 'Handcrafted full‑grain leather tote bag with interior pockets and magnetic closure.',
    price: 89.5,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80',
    ],
    stock: 18,
    shop: 's_shopaholic' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any,
  {
    _id: 'p3',
    title: 'Wireless Earbuds Pro',
    slug: 'wireless-earbuds-pro',
    description: 'Active noise cancellation, 24-hour battery with case, and low‑latency gaming mode.',
    price: 59.0,
    images: [
      'https://images.unsplash.com/photo-1518441902113-c1d3b2f1f1a2?w=1200&q=80',
    ],
    stock: 120,
    shop: 's_gadgethub' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any,
]
