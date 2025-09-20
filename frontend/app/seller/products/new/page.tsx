"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api/v1";

type Variant = {
  sku?: string;
  attributes?: Record<string, string>;
  price?: number;
  mrp?: number;
  stock?: number;
  images?: string[];
  mainImage?: string;
};

export default function NewProductPage() {
  const router = useRouter();

  // shop association
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopCategories, setShopCategories] = useState<string[]>([]);

  // product core
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [mrp, setMrp] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [taxRate, setTaxRate] = useState<number | "">(0);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // gallery
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);

  // variants
  const [variants, setVariants] = useState<Variant[]>([]);

  // ui
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch(`${API_BASE}/shops/my`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const s = data.shop;
        setShopId(s?._id || null);
        setShopCategories(Array.isArray(s?.categories) ? s.categories : []);
      } catch {}
    }
    loadShop();
  }, []);

  // tags add on Enter/Comma
  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const value = tagInput.trim();
      if (!tags.includes(value)) setTags([...tags, value]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  // upload helper
  async function uploadOne(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "products");
    const res = await fetch(`${API_BASE}/uploads`, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url as string;
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const uploads = files.map((f) => uploadOne(f));
    return await Promise.all(uploads);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!shopId) throw new Error("No shop found for this user.");
      if (!title.trim()) throw new Error("Title is required");
      if (!price || Number(price) <= 0) throw new Error("Price is required");

      // Upload new images, keep already-uploaded imageUrls
      let gallery = [...imageUrls];
      if (imageFiles.length) {
        const uploaded = await uploadImages(imageFiles);
        gallery = [...gallery, ...uploaded];
      }

      const payload: any = {
        shopId,
        title,
        sku: sku || undefined,
        description,
        price: Number(price),
        mrp: mrp === "" ? undefined : Number(mrp),
        stock: stock === "" ? 0 : Number(stock),
        taxRate: taxRate === "" ? 0 : Number(taxRate),
        brand: brand || undefined,
        category: category || undefined,
        tags,
        images: gallery,
        mainImage: mainImage || (gallery.length ? gallery[0] : undefined),
        variants: variants.map((v) => ({
          sku: v.sku,
          attributes: v.attributes || {},
          price: v.price ? Number(v.price) : Number(price),
          mrp: v.mrp ? Number(v.mrp) : undefined,
          stock: v.stock ? Number(v.stock) : 0,
          images: v.images || [],
          mainImage: v.mainImage || undefined,
        })),
      };

      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        credentials: "include",
        body: (() => { const fd = new FormData(); Object.entries(payload).forEach(([k,v])=>{
          if (k === "tags" || k === "images" || k === "variants") fd.append(k, JSON.stringify(v));
          else if (v !== undefined && v !== null) fd.append(k, String(v));
        }); return fd; })(),
      });
      if (!res.ok) throw new Error("Failed to create product");
      const data = await res.json();
      setSuccess("Product created");
      router.push(`/seller/products/${data.product._id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const canSave = useMemo(() => !!title.trim() && !!price && !!shopId, [title, price, shopId]);

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-emerald-200/60 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-emerald-900 dark:text-emerald-200">New Product</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Create a product for your shop</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="product" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="categories">Categories & Tags</TabsTrigger>
              <TabsTrigger value="tax">Tax</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e)=>setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={sku} onChange={(e)=>setSku(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <textarea className="mt-1 w-full min-h-[120px] border rounded-md px-3 py-2" value={description} onChange={(e)=>setDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input type="number" value={price} onChange={(e)=>setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div>
                  <Label>MRP</Label>
                  <Input type="number" value={mrp} onChange={(e)=>setMrp(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={stock} onChange={(e)=>setStock(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input value={brand} onChange={(e)=>setBrand(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Gallery Images</Label>
                <Input type="file" multiple accept="image/*" onChange={(e)=> setImageFiles(e.target.files ? Array.from(e.target.files) : [])} />
                <div className="mt-2 grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[...imageUrls, ...imageFiles.map(f=>URL.createObjectURL(f))].map((url)=> (
                    <button key={url} type="button" onClick={()=>setMainImage(url)} className={`relative rounded border ${mainImage===url? 'ring-2 ring-emerald-500' : ''}`}>
                      <img src={url} alt="img" className="h-24 w-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variants" className="pt-4 space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" className="border-emerald-200" onClick={()=> setVariants([...variants, {}])}>Add Variant</Button>
              </div>
              {variants.map((v, idx)=> (
                <div key={idx} className="border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label>SKU</Label>
                      <Input value={v.sku || ''} onChange={(e)=>{
                        const arr=[...variants]; arr[idx] = { ...arr[idx], sku: e.target.value }; setVariants(arr);
                      }} />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input type="number" value={v.price ?? ''} onChange={(e)=>{
                        const arr=[...variants]; arr[idx] = { ...arr[idx], price: e.target.value === '' ? undefined : Number(e.target.value) }; setVariants(arr);
                      }} />
                    </div>
                    <div>
                      <Label>MRP</Label>
                      <Input type="number" value={v.mrp ?? ''} onChange={(e)=>{
                        const arr=[...variants]; arr[idx] = { ...arr[idx], mrp: e.target.value === '' ? undefined : Number(e.target.value) }; setVariants(arr);
                      }} />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input type="number" value={v.stock ?? ''} onChange={(e)=>{
                        const arr=[...variants]; arr[idx] = { ...arr[idx], stock: e.target.value === '' ? undefined : Number(e.target.value) }; setVariants(arr);
                      }} />
                    </div>
                    <div className="col-span-4">
                      <Label>Attributes (key:value, comma separated)</Label>
                      <Input placeholder="color:Red, size:M" onBlur={(e)=>{
                        const pairs = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                        const attrs: Record<string,string> = {};
                        for (const p of pairs) { const [k,...rest]=p.split(':'); if (k && rest.length) attrs[k.trim()] = rest.join(':').trim(); }
                        const arr=[...variants]; arr[idx] = { ...arr[idx], attributes: attrs }; setVariants(arr);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="categories" className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input list="shop-categories" value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Type to select or create" />
                  <datalist id="shop-categories">
                    {shopCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                  <p className="text-xs text-slate-500 mt-1">Choose an existing category or type a new one.</p>
                </div>
                <div>
                  <Label>Tags</Label>
                  <Input placeholder="Type a tag and press Enter" value={tagInput} onChange={(e)=>setTagInput(e.target.value)} onKeyDown={onTagKeyDown} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-1 text-sm rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t}
                        <button className="ml-2 text-emerald-700" onClick={()=>removeTag(t)} type="button">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tax" className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" value={taxRate} onChange={(e)=> setTaxRate(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <p className="text-xs text-slate-500">Coupons management UI can be added here later if needed.</p>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-3 pt-6">
            <Button disabled={!canSave || saving} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? "Saving..." : "Create Product"}
            </Button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {success && <span className="text-emerald-700 text-sm">{success}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
