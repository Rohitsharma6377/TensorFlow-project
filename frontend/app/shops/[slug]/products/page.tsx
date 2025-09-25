"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api/v1";

type Shop = {
  _id: string;
  name: string;
  slug: string;
  categories?: string[];
};

type Product = {
  _id: string;
  shopId: string;
  title: string;
  price: number;
  mainImage?: string;
  images?: string[];
};

export default function ShopProductsPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState<boolean>(false);
  const [q, setQ] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");
  const [page, setPage] = useState<number>(1);
  const perPage = 24;

  // Load shop by slug first
  useEffect(() => {
    async function loadShop() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/shops/${params.slug}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Shop not found");
        setShop({ _id: data.shop._id, name: data.shop.name, slug: data.shop.slug, categories: data.shop.categories || [] });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [params.slug]);

  async function loadProducts(shopId: string) {
    try {
      setProdLoading(true);
      const params = new URLSearchParams();
      params.set("shopId", shopId);
      params.set("limit", String(perPage));
      params.set("page", String(page));
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
      if (sort) params.set("sort", sort);
      const res = await fetch(`${API_BASE}/products?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } finally {
      setProdLoading(false);
    }
  }

  useEffect(() => {
    if (shop?._id) loadProducts(shop._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?._id, q, category, priceMin, priceMax, sort, page]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!shop) return <div className="p-6">Shop not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{shop.name} – All Products</h1>
        <Link href={`/shops/${shop.slug}`} className="text-emerald-700 hover:underline text-sm">Back to shop</Link>
      </div>

      {/* Products Slider (All products from this shop) */}
      {products.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Browse products</h2>
            <div className="flex gap-2">
              <button
                onClick={() => document.getElementById('shop-products-slider')?.scrollBy({ left: -600, behavior: 'smooth' })}
                className="px-3 py-1.5 text-sm rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                ◀
              </button>
              <button
                onClick={() => document.getElementById('shop-products-slider')?.scrollBy({ left: 600, behavior: 'smooth' })}
                className="px-3 py-1.5 text-sm rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                ▶
              </button>
            </div>
          </div>
          <div
            id="shop-products-slider"
            className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent scroll-smooth pb-2"
          >
            {products.map((p) => (
              <Link key={`slider-${p._id}`} href={`/products/${p._id}`} className="min-w-[180px] max-w-[180px] border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <div className="text-xs font-medium line-clamp-2">{p.title}</div>
                  <div className="text-emerald-700 font-semibold mt-1 text-sm">₹{p.price.toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search products..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <select className="border rounded-md p-2" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
            <option value="">All categories</option>
            {(shop.categories || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Input placeholder="Min" value={priceMin} onChange={(e) => { setPage(1); setPriceMin(e.target.value); }} />
            <Input placeholder="Max" value={priceMax} onChange={(e) => { setPage(1); setPriceMax(e.target.value); }} />
          </div>
          <select className="border rounded-md p-2" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-3">
        {prodLoading && <div className="text-sm text-slate-500">Loading products...</div>}
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
          {products.length === 0 && !prodLoading && <div className="text-sm text-slate-500">No products found.</div>}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button disabled={products.length < perPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </section>
    </div>
  );
}
