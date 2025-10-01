"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Product = {
  _id: string;
  title: string;
  price: number;
  mrp?: number;
  mainImage?: string;
  images?: string[];
};

export default function ShopProductsPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopName, setShopName] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Resolve shop by slug first
        const shopData = await api<any>(`/api/v1/shops/${params.slug}`, { method: 'GET', skipAuth: true });
        const shopId = shopData?.shop?._id;
        setShopName(shopData?.shop?.name || params.slug);
        if (shopId) {
          const data = await api<any>(`/api/v1/products?shopId=${shopId}&limit=200`, { method: 'GET', skipAuth: true });
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  if (loading) return <div className="p-6">Loading products...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">Products · {shopName}</h1>
        <Link href={`/shop/${params.slug}`} className="text-emerald-700 hover:underline text-sm">Back to shop</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <Link key={p._id} href={`/shop/${params.slug}/products/${p.slug ?? p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
            <div className="aspect-square bg-slate-100">
              <img src={p.mainImage || p.images?.[0] || '/product-placeholder.png'} alt={p.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-2">
              <div className="text-sm font-medium line-clamp-2">{p.title}</div>
              <div className="text-emerald-700 font-semibold mt-1">₹{p.price.toLocaleString()}</div>
            </div>
          </Link>
        ))}
        {products.length === 0 && (
          <div className="text-sm text-slate-500">No products found.</div>
        )}
      </div>
    </div>
  );
}
