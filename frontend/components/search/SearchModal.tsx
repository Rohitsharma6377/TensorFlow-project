"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type PostDTO, type ShopListItemDTO } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Product = {
  _id: string;
  title: string;
  price?: number;
  mainImage?: string;
  images?: string[];
  shopId?: string;
};

export default function SearchModal({ open, onClose, query }: { open: boolean; onClose: () => void; query: string; }) {
  const [q, setQ] = useState(query || "");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [shops, setShops] = useState<ShopListItemDTO[]>([]);

  // sync incoming query
  useEffect(() => { setQ(query || ""); }, [query]);

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      const term = q.trim();
      if (!term) {
        setProducts([]); setPosts([]); setShops([]);
        return;
      }
      setLoading(true);
      try {
        const [prodRes, postRes, shopsRes] = await Promise.all([
          api<any>(`/api/v1/search/products?q=${encodeURIComponent(term)}&limit=12`, { method: 'GET', skipAuth: true }),
          api<any>(`/api/v1/search/posts?q=${encodeURIComponent(term)}&limit=12`, { method: 'GET', skipAuth: true }),
          api<any>(`/api/v1/shops?limit=50`, { method: 'GET', skipAuth: true }),
        ]);
        setProducts(prodRes.products || []);
        setPosts(postRes.posts || []);
        const filtShops = (shopsRes.shops || []).filter((s: ShopListItemDTO) =>
          (s.name || '').toLowerCase().includes(term.toLowerCase())
        ).slice(0, 12);
        setShops(filtShops);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('search error', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-20 w-[min(100%,900px)] mx-auto rounded-xl shadow-2xl bg-white dark:bg-gray-900 border border-emerald-200/60 overflow-hidden">
        <div className="p-3 border-b">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, posts, shops..."
            className="w-full bg-transparent outline-none text-base px-2 py-1"
          />
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Products */}
          <section>
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <Link key={`prod-${p._id}`} href={`/products/${p._id}`} onClick={onClose} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                    {typeof p.price === 'number' && (
                      <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>
                    )}
                  </div>
                </Link>
              ))}
              {products.length === 0 && !loading && <div className="text-xs text-slate-500">No products</div>}
            </div>
          </section>

          {/* Posts */}
          <section>
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">Posts</h3>
            <div className="grid grid-cols-3 gap-3">
              {posts.map((p) => {
                const media = Array.isArray(p.media) && p.media.length ? p.media[0] : undefined;
                const shopSlug = typeof p.shop === 'object' ? (p.shop as any).slug : undefined;
                const productId = typeof p.product === 'object' ? (p.product as any)._id : undefined;
                const href = productId ? `/products/${productId}` : shopSlug ? `/shops/${shopSlug}` : '/feed';
                return (
                  <Link key={`post-${(p as any)._id}`} href={href} onClick={onClose} className="block rounded-md overflow-hidden border bg-white dark:bg-gray-800">
                    <div className="aspect-square bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media || '/post-placeholder.png'} alt={p.caption || 'Post'} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1 text-[11px] line-clamp-1">{p.caption || 'Post'}</div>
                  </Link>
                );
              })}
              {posts.length === 0 && !loading && <div className="text-xs text-slate-500">No posts</div>}
            </div>
          </section>

          {/* Shops */}
          <section className="md:col-span-2">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">Shops</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {shops.map((s) => {
                const logo = typeof s.logo === 'object' ? (s.logo as any).url : (s.logo as string | undefined);
                return (
                  <Link key={`shop-${s._id}`} href={`/shops/${s.slug}`} onClick={onClose} className="border rounded-lg p-2 flex items-center gap-2 bg-white dark:bg-gray-800">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo || '/shop-placeholder.png'} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">@{s.slug}</div>
                    </div>
                  </Link>
                );
              })}
              {shops.length === 0 && !loading && <div className="text-xs text-slate-500">No shops</div>}
            </div>
          </section>
        </div>

        {loading && <div className="px-4 pb-3 text-xs text-slate-500">Searching...</div>}
      </div>
    </div>
  );
}
