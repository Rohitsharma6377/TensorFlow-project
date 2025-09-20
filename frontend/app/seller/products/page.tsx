"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1';

type Product = {
  _id: string;
  title: string;
  price: number;
  stock: number;
  status: 'active' | 'archived' | 'draft';
};

export default function SellerProductsPage() {
  const router = useRouter();

  // shop + products
  const [shopId, setShopId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // local state for other tabs
  const [taxes, setTaxes] = useState<Array<{ id: string; name: string; percent: number; active: boolean }>>([]);
  const [coupons, setCoupons] = useState<Array<{ id: string; code: string; type: 'percent'|'flat'; value: number; expiry?: string; active: boolean }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parent?: string; active: boolean }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; logo?: string; active: boolean }>>([]);
  const [reviews, setReviews] = useState<Array<{ id: string; user: string; product: string; rating: number; comment?: string; active: boolean }>>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE}/shops/my`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setShopId(data.shop?._id || null);
        }
      } catch {}
    }
    init();
  }, []);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products?shopId=${shopId}&page=${page}&limit=${limit}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // backend list doesn't return total, approximate with page size
          setItems(data.products || []);
          setTotal((data.products || []).length < limit && page === 1 ? (data.products || []).length : page * limit + 1); // naive
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId, page, limit]);

  async function toggleStatus(id: string, current: Product['status']) {
    try {
      const status = current === 'active' ? 'archived' : 'active';
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'PUT', credentials: 'include', body: (()=>{const fd=new FormData(); fd.append('status', status); return fd;})() });
      if (res.ok) {
        setItems(items.map(it => it._id === id ? { ...it, status } : it));
      }
    } catch {}
  }

  async function removeProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setItems(items.filter(it => it._id !== id));
  }

  function HeaderTabs() {
    return (
      <TabsList className="w-full grid grid-cols-6 bg-white">
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="tax">Tax</TabsTrigger>
        <TabsTrigger value="coupons">Coupons</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="brands">Brands</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/95 dark:bg-slate-900/80 backdrop-blur border border-slate-200 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Catalog</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Manage your products and merchandising</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <HeaderTabs />

            {/* Products Tab */}
            <TabsContent value="products" className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/seller/products/new')}>➕ Add Product</Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Product Name</th>
                      <th className="text-left p-3 font-semibold">Price</th>
                      <th className="text-left p-3 font-semibold">Stock</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading...</td></tr>
                    ) : items.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-500">No products found.</td></tr>
                    ) : (
                      items.map((p) => (
                        <tr key={p._id} className="border-t hover:bg-slate-50">
                          <td className="p-3">{p.title}</td>
                          <td className="p-3">₹{p.price}</td>
                          <td className="p-3">{p.stock ?? 0}</td>
                          <td className="p-3">
                            <button onClick={()=>toggleStatus(p._id, p.status)} className={`px-2 py-1 rounded-full text-xs border transition ${p.status==='active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {p.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={()=>router.push(`/seller/products/${p._id}`)}>✏️ Edit</Button>
                            <Button variant="outline" className="border-red-300 text-red-700" onClick={()=>removeProduct(p._id)}>🗑 Delete</Button>
                            <Button variant="outline" className="border-emerald-300 text-emerald-700" onClick={()=>toggleStatus(p._id, p.status)}>✅ Toggle</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))}>Prev</Button>
                <span className="text-sm text-slate-600">Page {page} / {totalPages}</span>
                <Button variant="outline" onClick={()=>setPage((p)=>p+1)}>Next</Button>
              </div>
            </TabsContent>

            {/* Tax Tab */}
            <TabsContent value="tax" className="pt-4 space-y-4">
              <InlineAdd
                buttonLabel="➕ Add Tax"
                onAdd={(name) => setTaxes([...taxes, { id: crypto.randomUUID(), name, percent: 0, active: true }])}
              />
              <SimpleTable
                headers={["Tax Name","Percentage","Status","Actions"]}
                rows={taxes.map(t => ([
                  t.name,
                  <span key="p">{t.percent}%</span>,
                  t.active ? 'Active' : 'Inactive',
                  <RowActions key="a" onToggle={()=>setTaxes(taxes.map(x=>x.id===t.id?{...x,active:!x.active}:x))} onDelete={()=>setTaxes(taxes.filter(x=>x.id!==t.id))} />
                ]))}
              />
            </TabsContent>

            {/* Coupons Tab */}
            <TabsContent value="coupons" className="pt-4 space-y-4">
              <InlineAdd
                buttonLabel="➕ Add Coupon"
                onAdd={(code) => setCoupons([...coupons, { id: crypto.randomUUID(), code, type: 'percent', value: 10, active: true }])}
              />
              <SimpleTable
                headers={["Coupon Code","Discount Type","Value","Expiry Date","Status","Actions"]}
                rows={coupons.map(c => ([
                  c.code,
                  c.type,
                  String(c.value),
                  c.expiry || '-',
                  c.active ? 'Active' : 'Inactive',
                  <RowActions key="a" onToggle={()=>setCoupons(coupons.map(x=>x.id===c.id?{...x,active:!x.active}:x))} onDelete={()=>setCoupons(coupons.filter(x=>x.id!==c.id))} />
                ]))}
              />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="pt-4 space-y-4">
              <InlineAdd
                buttonLabel="➕ Add Category"
                onAdd={(name) => setCategories([...categories, { id: crypto.randomUUID(), name, active: true }])}
              />
              <SimpleTable
                headers={["Category Name","Parent Category","Status","Actions"]}
                rows={categories.map(c => ([
                  c.name,
                  c.parent || '-',
                  c.active ? 'Active' : 'Inactive',
                  <RowActions key="a" onToggle={()=>setCategories(categories.map(x=>x.id===c.id?{...x,active:!x.active}:x))} onDelete={()=>setCategories(categories.filter(x=>x.id!==c.id))} />
                ]))}
              />
            </TabsContent>

            {/* Brands Tab */}
            <TabsContent value="brands" className="pt-4 space-y-4">
              <InlineAdd
                buttonLabel="➕ Add Brand"
                onAdd={(name) => setBrands([...brands, { id: crypto.randomUUID(), name, active: true }])}
              />
              <SimpleTable
                headers={["Brand Name","Logo","Status","Actions"]}
                rows={brands.map(b => ([
                  b.name,
                  b.logo ? <img key="l" src={b.logo} alt="logo" className="h-6" /> : '-',
                  b.active ? 'Active' : 'Inactive',
                  <RowActions key="a" onToggle={()=>setBrands(brands.map(x=>x.id===b.id?{...x,active:!x.active}:x))} onDelete={()=>setBrands(brands.filter(x=>x.id!==b.id))} />
                ]))}
              />
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="pt-4 space-y-4">
              <InlineAdd
                buttonLabel="➕ Add Review"
                onAdd={(name) => setReviews([...reviews, { id: crypto.randomUUID(), user: name, product: '-', rating: 5, active: true } as any])}
              />
              <SimpleTable
                headers={["Reviewer Name","Product","Rating","Comment","Status","Actions"]}
                rows={reviews.map(r => ([
                  r.user,
                  r.product,
                  '⭐'.repeat(r.rating || 0),
                  r.comment || '-',
                  r.active ? 'Active' : 'Inactive',
                  <RowActions key="a" onToggle={()=>setReviews(reviews.map(x=>x.id===r.id?{...x,active:!x.active}:x))} onDelete={()=>setReviews(reviews.filter(x=>x.id!==r.id))} />
                ]))}
              />
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function InlineAdd({ buttonLabel, onAdd }: { buttonLabel: string; onAdd: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center justify-end gap-3">
      {open && (
        <div className="flex items-center gap-2 bg-slate-50 border rounded-md p-2">
          <Input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="Enter name" />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={()=>{ if(value.trim()){ onAdd(value.trim()); setValue(''); setOpen(false);} }}>Save</Button>
          <Button variant="outline" onClick={()=>{ setOpen(false); setValue(''); }}>Cancel</Button>
        </div>
      )}
      {!open && (
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={()=>setOpen(true)}>{buttonLabel}</Button>
      )}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map(h => <th key={h} className="text-left p-3 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="p-6 text-center text-slate-500">No records</td></tr>
          ) : rows.map((cols, i) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              {cols.map((c, j) => <td key={j} className="p-3">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ onToggle, onDelete }: { onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" className="border-slate-300 text-slate-700" onClick={onToggle}>✅ Toggle</Button>
      <Button variant="outline" className="border-red-300 text-red-700" onClick={onDelete}>🗑 Delete</Button>
    </div>
  );
}
