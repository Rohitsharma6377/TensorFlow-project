"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { PostDTO } from "@/lib/api";
import { SearchAPI, ShopsAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

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
  const hoverTimerRef = React.useRef<any>(null);
  const closeTimerRef = React.useRef<any>(null);
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(false);
  const [category, setCategory] = useState<string>("");
  const searchParams = useSearchParams();

  // animations
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0.03 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
  };

  // initial content: featured shops + latest products + recent posts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qParam = searchParams?.get('q') || '';
        const catParam = searchParams?.get('category') || '';
        setQ(qParam);
        setCategory(catParam);
        const [shopRes, prodRes, postRes] = await Promise.all([
          ShopsAPI.list({ featured: true, limit: 12 }).catch(() => ({ shops: [] } as any)),
          (qParam || catParam) ? SearchAPI.products({ q: qParam || undefined, category: catParam || undefined, limit: 24 }).catch(() => ({ products: [] } as any)) : SearchAPI.products({ limit: 16 }).catch(() => ({ products: [] } as any)),
          (qParam) ? SearchAPI.posts({ q: qParam, limit: 24 }).catch(() => ({ posts: [] } as any)) : SearchAPI.posts({ limit: 24 }).catch(() => ({ posts: [] } as any)),
        ]);
        if (cancelled) return;
        setShops((shopRes as any)?.shops || []);
        setProducts((prodRes as any)?.products || []);
        setPosts((postRes as any)?.posts || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  // search on query or category
  useEffect(() => {
    const term = q.trim();
    setShowSuggest(!!term);
    const handle = setTimeout(async () => {
      // If neither q nor category, show nothing special; initial effect already handled defaults
      if (!term && !category) return;
      setLoading(true);
      try {
        let prod: any = { products: [] }, post: any = { posts: [] }, shop: any = { shops: [] };
        if (term) {
          [prod, post, shop] = await Promise.all([
            SearchAPI.products({ q: term, limit: 24 }).catch(() => ({ products: [] } as any)),
            SearchAPI.posts({ q: term, limit: 24 }).catch(() => ({ posts: [] } as any)),
            ShopsAPI.list({ q: term, limit: 24 }).catch(() => ({ shops: [] } as any)),
          ]);
        } else if (category) {
          [prod, post, shop] = await Promise.all([
            SearchAPI.products({ category, limit: 24 }).catch(() => ({ products: [] } as any)),
            SearchAPI.posts({ limit: 24 }).catch(() => ({ posts: [] } as any)),
            ShopsAPI.list({ featured: true, limit: 12 }).catch(() => ({ shops: [] } as any)),
          ]);
        }
        setProducts((prod as any)?.products || []);
        setPosts((post as any)?.posts || []);
        const shopList = ((shop as any)?.shops || []) as any[];
        setShops(shopList);
        // suggestions derived from top product titles and shop names (only when typing)
        if (term) {
          const prodNames = ((prod as any)?.products || []).map((p: Product) => p.title);
          const shopNames = shopList.map((s: any) => s.name);
          const uniq = Array.from(new Set([...prodNames, ...shopNames]))
            .filter(Boolean)
            .filter((s: string) => s.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 8);
          setSuggestions(uniq);
        } else {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q, category]);

  // ESC to close preview
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Post hover handlers to avoid flicker
  const onPostEnter = (p: PostDTO, media?: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // If a preview is already open, switch immediately; otherwise, delay slightly
    setPreview((cur) => {
      const curId = (cur as any)?._id || (cur?.post as any)?._id;
      const nextId = (p as any)._id;
      if (cur && curId !== nextId) {
        return { post: p, media };
      }
      return cur;
    });
    if (!preview) {
      hoverTimerRef.current = setTimeout(() => {
        setPreview({ post: p, media });
      }, 180);
    }
  };
  const onPostLeave = (p: PostDTO) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setPreview((cur) => {
        if (!cur) return cur;
        const curId = (cur as any)?._id || (cur.post as any)?._id;
        const leaveId = (p as any)._id;
        return curId === leaveId ? null : cur;
      });
    }, 150);
  };

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
            className="pl-3 pr-12 rounded-xl shadow-sm border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-300"
          />
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute z-20 mt-1 w-full rounded-xl border border-emerald-100/70 bg-white/95 dark:bg-gray-900/90 backdrop-blur shadow-xl max-h-64 overflow-auto"
              >
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    onClick={() => onPickSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50/80 dark:hover:bg-gray-800"
                    whileHover={{ x: 2 }}
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>Preview on hover</span>
            <Switch checked={hoverPreviewEnabled} onChange={(e) => setHoverPreviewEnabled((e.target as HTMLInputElement).checked)} />
          </div>
          <Button onClick={() => setShowSuggest(false)} variant="outline" className="rounded-xl border-emerald-300 hover:bg-emerald-50">Search</Button>
        </div>
      </div>

      {/* Products section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Link href="/products" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {loading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={`pskel-${i}`} variants={itemVariants} className="border rounded-2xl p-0 overflow-hidden ring-1 ring-emerald-100/60 bg-white">
                <Skeleton className="aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </motion.div>
            ))}
            {products.map((p) => (
              <motion.div key={p._id} variants={itemVariants} exit="exit">
                <Link href={`/products/${p._id}`} className="group border rounded-2xl overflow-hidden bg-white ring-1 ring-emerald-100/60 hover:ring-emerald-300/70 shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="aspect-square bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} loading="lazy" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium line-clamp-2 text-slate-800 group-hover:text-slate-900">{p.title}</div>
                    {typeof p.price === 'number' && <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>}
                  </div>
                </Link>
              </motion.div>
            ))}
            {products.length === 0 && !loading && (
              <motion.div variants={itemVariants} className="text-sm text-slate-500">No products</motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Posts section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Posts</h2>
          <Link href="/feed" className="text-sm text-emerald-700 hover:underline">View feed</Link>
        </div>
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <AnimatePresence initial={false}>
            {loading && posts.length === 0 && Array.from({ length: 9 }).map((_, i) => (
              <motion.div key={`postskel-${i}`} variants={itemVariants} className="rounded-2xl overflow-hidden ring-1 ring-emerald-100/60 bg-white">
                <Skeleton className="aspect-square" />
              </motion.div>
            ))}
            {posts.map((p) => {
              const media = Array.isArray(p.media) && p.media.length ? p.media[0] : undefined;
              const href = typeof p.product === 'object' ? `/products/${(p.product as any)._id}` : '/feed';
              return (
                <motion.div key={(p as any)._id} variants={itemVariants} exit="exit">
                  <Link
                    href={href}
                    className="group rounded-2xl overflow-hidden border bg-white ring-1 ring-emerald-100/60 hover:ring-emerald-300/70 shadow-sm hover:shadow-lg transition-all"
                    onMouseEnter={hoverPreviewEnabled ? () => onPostEnter(p, media) : undefined}
                    onMouseLeave={hoverPreviewEnabled ? () => onPostLeave(p) : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setPreview({ post: p, media });
                    }}
                  >
                    <div className="aspect-square bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media || '/post-placeholder.png'} alt={p.caption || 'Post'} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            {posts.length === 0 && !loading && <motion.div variants={itemVariants} className="text-sm text-slate-500">No posts</motion.div>}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Shops section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shops</h2>
          <Link href="/shops" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {loading && shops.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={`shopskel-${i}`} variants={itemVariants} className="group border rounded-2xl p-3 flex items-center gap-3 bg-white ring-1 ring-emerald-100/60">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </motion.div>
            ))}
            {shops.map((s) => {
              const logo = typeof (s as any).logo === 'object' ? ((s as any).logo as any).url : ((s as any).logo as string | undefined);
              return (
                <motion.div key={s._id} variants={itemVariants} exit="exit">
                  <Link href={`/shops/${(s as any).slug}`} className="group border rounded-2xl p-3 flex items-center gap-3 bg-white ring-1 ring-emerald-100/60 hover:ring-emerald-300/70 hover:shadow-lg shadow-sm transition-all">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-50 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo || '/shop-placeholder.png'} alt={(s as any).name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{(s as any).name}</div>
                      <div className="text-xs text-slate-500 truncate">@{(s as any).slug}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            {shops.length === 0 && !loading && <motion.div variants={itemVariants} className="text-sm text-slate-500">No shops</motion.div>}
          </AnimatePresence>
        </motion.div>
      </section>

      {loading && (
        <>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span>Loading...</span>
          </div>
          {/* top progress bar */}
          <motion.div
            className="fixed left-0 right-0 top-0 h-0.5 bg-emerald-500/80 z-[10000]"
            initial={{ scaleX: 0, transformOrigin: '0% 50%' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
          />
        </>
      )}

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
