"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Shop = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: { url: string };
  banner?: { url: string };
  categories?: string[];
  metadata?: Record<string, any> & { themeColor?: string };
  contact?: { email?: string; phone?: string; website?: string; social?: { instagram?: string; facebook?: string; twitter?: string } };
  owner?: { username?: string; email?: string; profile?: { fullName?: string; avatarUrl?: string } };
};

type Product = {
  _id: string;
  shopId: string;
  title: string;
  price: number;
  mrp?: number;
  mainImage?: string;
  images?: string[];
};

export default function ShopPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const shopData = await api<any>(`/api/v1/shops/${params.slug}`, { method: 'GET', skipAuth: true });
        setShop(shopData.shop);
        setOwnerId(shopData.shop?.owner?._id || null);

        const id = shopData.shop._id;
        const [statsData, revData] = await Promise.all([
          api<any>(`/api/v1/shops/${id}/stats`, { method: 'GET', skipAuth: true }).catch(() => null),
          api<any>(`/api/v1/shops/${id}/reviews`, { method: 'GET', skipAuth: true }).catch(() => null),
        ]);
        if (statsData) {
          setFollowers(statsData.followers || 0);
          setRating(statsData.rating || { average: 0, count: 0 });
        }
        if (revData) {
          setReviews(revData.reviews || []);
        }
        // Only try following list if we have a token in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          try {
            const f = await api<any>(`/api/v1/social/following`, { method: 'GET' });
            const followed: string[] = f.shops || [];
            setIsFollowing(followed.includes(id));
          } catch {
            setIsFollowing(false);
          }
        } else {
          setIsFollowing(false);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const themeColor = shop?.metadata?.themeColor || "#10b981";

  // Fetch products (simple list)
  async function loadProducts(shopId: string) {
    try {
      const data = await api<any>(`/api/v1/products?shopId=${shopId}&limit=100`, { method: 'GET', skipAuth: true });
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    }
  }

  useEffect(() => {
    if (shop?._id) {
      loadProducts(shop._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?._id]);

  async function followToggle() {
    if (!shop) return;
    const id = shop._id;
    const method = isFollowing ? "DELETE" : "POST";
    try {
      await api<any>(`/api/v1/social/follow/${id}`, { method });
      setIsFollowing(!isFollowing);
      // refresh followers
      const s = await api<any>(`/api/v1/shops/${id}/stats`, { method: 'GET', skipAuth: true });
      setFollowers(s.followers || 0);
      setRating(s.rating || { average: 0, count: 0 });
    } catch {}
  }

  // Reviews are read-only here

  if (loading) return <div className="p-6">Loading...</div>;
  if (!shop) return <div className="p-6">Shop not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      {shop.banner?.url && (
        <div className="rounded-xl overflow-hidden border">
          <img src={shop.banner.url} alt="banner" className="w-full h-48 sm:h-56 object-cover" />
        </div>
      )}

      {/* Header card */}
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[96px_1fr_auto] gap-4 items-start">
          {shop.logo?.url ? (
            <img src={shop.logo.url} alt="logo" className="h-18 w-18 sm:h-24 sm:w-24 rounded-md border object-cover" />
          ) : (
            <div className="h-18 w-18 sm:h-24 sm:w-24 rounded-md border bg-slate-100" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight" style={{ color: themeColor }}>{shop.name}</h1>
            {shop.description && <p className="text-slate-600 mt-1 text-sm sm:text-base">{shop.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs sm:text-sm text-slate-600">
              <span>Followers: {followers}</span>
              <span>Rating: {rating.average.toFixed(1)} ({rating.count})</span>
              {!!(shop.categories && shop.categories.length) && (
                <span>Categories: {shop.categories.join(", ")}</span>
              )}
            </div>
            {/* Contact & Owner */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="space-y-1">
                {shop.contact?.email && <div>Email: <a className="text-emerald-700 hover:underline" href={`mailto:${shop.contact.email}`}>{shop.contact.email}</a></div>}
                {shop.contact?.phone && <div>Phone: <a className="text-emerald-700" href={`tel:${shop.contact.phone}`}>{shop.contact.phone}</a></div>}
                {shop.contact?.website && <div>Website: <a className="text-emerald-700 hover:underline" href={shop.contact.website} target="_blank" rel="noreferrer">{shop.contact.website}</a></div>}
              </div>
              <div className="space-y-1">
                <div>Owner: {shop.owner?.profile?.fullName || shop.owner?.username || '—'}</div>
                {shop.owner?.email && <div>Owner Email: <a className="text-emerald-700 hover:underline" href={`mailto:${shop.owner.email}`}>{shop.owner.email}</a></div>}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
            <Button onClick={followToggle}>{isFollowing ? "Unfollow" : "Follow"}</Button>
            <Link href={`/chat?shop=${shop._id}${ownerId ? `&seller=${ownerId}` : ''}`}>
              <Button variant="outline">Chat</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 px-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border rounded-full p-2 shadow-md">
          <Button className="flex-1" onClick={followToggle}>{isFollowing ? "Unfollow" : "Follow"}</Button>
          <Link className="flex-1" href={`/chat?shop=${shop._id}${ownerId ? `&seller=${ownerId}` : ''}`}>
            <Button variant="outline" className="w-full">Chat</Button>
          </Link>
        </div>
      </div>

      

      {/* Top Products */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Top Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((p) => (
            <Link key={p._id} href={`/products/${p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="aspect-square bg-slate-100">
                <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>
              </div>
            </Link>
          ))}
          {products.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
        </div>
      </section>

      {/* Reviews (read-only) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="space-y-2">
          {reviews.length === 0 && <p className="text-slate-500 text-sm">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r._id} className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.user?.username || 'User'}</div>
                <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              {r.comment && <div className="text-sm text-slate-600 mt-1">{r.comment}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* All Products */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Products</h2>
          <Link href={`/shops/${shop.slug}/products`} className="text-emerald-700 hover:underline text-sm">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link key={p._id} href={`/products/${p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="aspect-square bg-slate-100">
                <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>
              </div>
            </Link>
          ))}
          {products.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
        </div>
      </section>
    </div>
  );
}
