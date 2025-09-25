"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PostDTO } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Product = {
  _id: string;
  title: string;
  price?: number;
  mainImage?: string;
  images?: string[];
};

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [shops, setShops] = useState<{ _id: string; name: string; slug: string; logo?: any }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [preview, setPreview] = useState<{ post: PostDTO; media?: string } | null>(null);

  // initial content: featured shops + latest products + recent posts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [shopRes, prodRes, postRes] = await Promise.all([
          fetch(`/api/v1/shops?featured=true&limit=12`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
          fetch(`/api/v1/search/products?limit=16`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
          // Use search/posts as a generic latest posts endpoint
          fetch(`/api/v1/search/posts?limit=24`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
        ]);
        if (cancelled) return;
        setShops(shopRes?.shops || []);
        setProducts((prodRes?.products as any) || []);
        setPosts(postRes?.posts || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // search on query
  useEffect(() => {
    const term = q.trim();
    setShowSuggest(!!term);
    const handle = setTimeout(async () => {
      if (!term) return;
      setLoading(true);
      try {
        const [prod, post, shop] = await Promise.all([
          fetch(`/api/v1/search/products?q=${encodeURIComponent(term)}&limit=24`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
          fetch(`/api/v1/search/posts?q=${encodeURIComponent(term)}&limit=24`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
          fetch(`/api/v1/shops?limit=50`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({})),
        ]);
        setProducts(prod?.products || []);
        setPosts(post?.posts || []);
        const shopList = (shop?.shops || []) as any[];
        const filtered = shopList.filter(s => (s.name||'').toLowerCase().includes(term.toLowerCase())).slice(0, 24);
        setShops(filtered);
        // suggestions derived from top product titles and shop names
        const prodNames = (prod?.products || []).map((p: Product) => p.title);
        const shopNames = filtered.map((s: any) => s.name);
        const uniq = Array.from(new Set([...prodNames, ...shopNames]))
          .filter(Boolean)
          .filter((s: string) => s.toLowerCase().includes(term.toLowerCase()))
          .slice(0, 8);
        setSuggestions(uniq);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  // ESC to close preview
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPickSuggestion = (s: string) => {
    setQ(s);
    setShowSuggest(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setShowSuggest(!!q.trim())}
            placeholder="Search products, shops and posts..."
            className="pl-3 pr-12"
          />
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border bg-white dark:bg-gray-900 shadow-lg max-h-64 overflow-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onPickSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-gray-800"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={() => setShowSuggest(false)} variant="outline">Search</Button>
      </div>

      {/* Products section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Link href="/products" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link key={p._id} href={`/products/${p._id}`} className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="aspect-square bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                {typeof p.price === 'number' && <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>}
              </div>
            </Link>
          ))}
          {products.length === 0 && !loading && <div className="text-sm text-slate-500">No products</div>}
        </div>
      </section>

      {/* Posts section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Posts</h2>
          <Link href="/feed" className="text-sm text-emerald-700 hover:underline">View feed</Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {posts.map((p) => {
            const media = Array.isArray(p.media) && p.media.length ? p.media[0] : undefined;
            const href = typeof p.product === 'object' ? `/products/${(p.product as any)._id}` : '/feed';
            return (
              <Link
                key={(p as any)._id}
                href={href}
                className="rounded-lg overflow-hidden border bg-white hover:shadow-md transition-shadow"
                onMouseEnter={() => setPreview({ post: p, media })}
                onMouseLeave={() => setPreview((cur) => (cur && (cur.post as any)._id === (p as any)._id ? null : cur))}
              >
                <div className="aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media || '/post-placeholder.png'} alt={p.caption || 'Post'} className="w-full h-full object-cover" />
                </div>
              </Link>
            );
          })}
          {posts.length === 0 && !loading && <div className="text-sm text-slate-500">No posts</div>}
        </div>
      </section>

      {/* Shops section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shops</h2>
          <Link href="/shops" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shops.map((s) => {
            const logo = typeof (s as any).logo === 'object' ? ((s as any).logo as any).url : ((s as any).logo as string | undefined);
            return (
              <Link key={s._id} href={`/shops/${(s as any).slug}`} className="border rounded-xl p-3 flex items-center gap-3 bg-white hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo || '/shop-placeholder.png'} alt={(s as any).name} className="w-full h-full object-cover" />
                </div>
                
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{(s as any).name}</div>
                  <div className="text-xs text-slate-500 truncate">@{(s as any).slug}</div>
                </div>
              </Link>
            );
          })}
          {shops.length === 0 && !loading && <div className="text-sm text-slate-500">No shops</div>}
        </div>
      </section>

      {loading && <div className="text-xs text-slate-500">Loading...</div>}

      {/* Hover Preview Overlay */}
      {preview && (
        <div
          className="fixed inset-0 z-[9998] hidden md:flex items-center justify-center"
          onMouseLeave={() => setPreview(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-[9999] w-[min(900px,92vw)] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-emerald-200/60">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3 bg-black">
                <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.media || '/post-placeholder.png'} alt={preview.post.caption || 'Post'} className="w-full h-full object-contain bg-black" />
                </div>
              </div>
              <div className="md:w-1/3 p-4 space-y-3">
                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-6">{preview.post.caption || 'Post'}</div>
                {typeof preview.post.product === 'object' && (
                  <Link href={`/products/${(preview.post.product as any)._id}`} className="block rounded-lg border p-2 hover:shadow transition">
                    <div className="text-sm font-semibold text-emerald-700">View Product</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{(preview.post.product as any).title || 'Product'}</div>
                  </Link>
                )}
                {typeof preview.post.shop === 'object' && (
                  <Link href={`/shops/${(preview.post.shop as any).slug}`} className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-2">
                    <span>Visit shop</span>
                  </Link>
                )}
                <div className="pt-2">
                  <button onClick={() => setPreview(null)} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
