"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Box } from "@mui/material";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import ButtonMUI from "@mui/material/Button";

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
  const qs = useSearchParams();
  const isEditor = qs?.get('editor') === '1';
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [builderData, setBuilderData] = useState<any | null>(null);
  // Editor state
  const [themeColorOverride, setThemeColorOverride] = useState<string>("");
  const [bannerOverride, setBannerOverride] = useState<string>("");
  const [logoOverride, setLogoOverride] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

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
        // load builder from server metadata and localStorage
        try {
          let serverBuilder = (shopData.shop?.metadata?.builder || null);
          const localById = typeof window !== 'undefined' ? localStorage.getItem(`builder:${shopData.shop?._id}`) : null;
          const localBySlug = typeof window !== 'undefined' ? localStorage.getItem(`builder:${shopData.shop?.slug}`) : null;
          const parsedLocal = localById ? JSON.parse(localById) : (localBySlug ? JSON.parse(localBySlug) : null);
          if (parsedLocal && typeof parsedLocal === 'object') {
            serverBuilder = { ...(serverBuilder || {}), ...parsedLocal };
          }
          setBuilderData(serverBuilder);
        } catch {}
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

  // Support quick import: /shops/shop/[slug]?builder=<id>
  useEffect(() => {
    if (!shop) return;
    const builderId = qs?.get('builder');
    if (!builderId) return;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(`builder:${builderId}`) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setBuilderData((prev: any) => ({ ...(prev || {}), ...(parsed || {}) }));
        try { localStorage.setItem(`builder:${shop._id}`, raw); } catch {}
        try { localStorage.setItem(`builder:${shop.slug}`, raw); } catch {}
      }
    } catch {}
  }, [qs, shop]);

  const themeColor = (themeColorOverride || shop?.metadata?.themeColor) || "#10b981";

  // Builder rendering helpers
  const colors = useMemo(() => ({
    primary: themeColor,
  }), [themeColor]);

  function renderHeader(block: any) {
    const logo = block?.props?.logoUrl || shop?.logo?.url;
    const menu = Array.isArray(block?.props?.menu) ? block.props.menu : [];
    return (
      <header className="w-full bg-white border rounded-xl p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt="logo" className="h-10 w-10 rounded" /> : <div className="h-10 w-10 bg-slate-100 rounded" />}
          <div className="font-semibold">{shop?.name}</div>
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {menu.map((m: any, i: number) => (
            <Link key={i} href={m.href || '#'} className="hover:underline">{m.label}</Link>
          ))}
        </nav>
      </header>
    );
  }

  function renderHero(block: any) {
    const b = block?.props || {};
    return (
      <section className="rounded-xl overflow-hidden border">
        {b.image ? (
          <div className="relative">
            <img src={b.image} alt="hero" className="w-full h-56 sm:h-72 object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
              {b.heading && <h2 className="text-2xl sm:text-3xl font-semibold">{b.heading}</h2>}
              {b.subheading && <p className="mt-2 max-w-2xl">{b.subheading}</p>}
              {b.ctaText && (
                <Link href={b.ctaHref || '#'} className="mt-4 inline-block">
                  <button className="px-5 py-2 rounded-md font-medium" style={{ background: colors.primary, color: '#fff' }}>{b.ctaText}</button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            {b.heading && <h2 className="text-2xl font-semibold" style={{ color: colors.primary }}>{b.heading}</h2>}
            {b.subheading && <p className="mt-2 text-slate-600">{b.subheading}</p>}
          </div>
        )}
      </section>
    );
  }

  function renderBanner(block: any) {
    const b = block?.props || {};
    const img = b.image;
    const inner = (
      <img src={img} alt={b.alt || 'banner'} className="w-full h-40 sm:h-52 object-cover" />
    );
    return (
      <section className="rounded-xl overflow-hidden border">
        {b.href ? <Link href={b.href}>{inner}</Link> : inner}
      </section>
    );
  }

  function renderProductSlider(block: any) {
    const b = block?.props || {};
    const list = Array.isArray(b.productIds) && b.productIds.length
      ? products.filter((p: any) => b.productIds.includes(p._id)).slice(0, b.limit || 8)
      : products.slice(0, b.limit || 8);
    return (
      <section className="space-y-3">
        {b.title && <h2 className="text-lg font-semibold">{b.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((p: any) => (
            <Link key={p._id} href={`/shop/${shop?.slug}/products/${p.slug ?? p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="aspect-square bg-slate-100">
                <img src={p.mainImage || p.images?.[0] || 'https://dummyimage.com/600x600/e5e7eb/111827&text=Product'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="font-semibold mt-1" style={{ color: colors.primary }}>₹{Number(p.price || 0).toLocaleString()}</div>
              </div>
            </Link>
          ))}
          {list.length === 0 && <div className="text-sm text-slate-500">No products yet.</div>}
        </div>
      </section>
    );
  }

  function renderRichText(block: any) {
    const html = String(block?.props?.html || '');
    return (
      <section className="rounded-xl border bg-white p-4">
        <article className="prose max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </section>
    );
  }

  function renderFooter(block: any) {
    const b = block?.props || {};
    const links = Array.isArray(b.links) ? b.links : [];
    return (
      <footer className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600">{b.copyright || `© ${new Date().getFullYear()} ${shop?.name}`}</div>
          <nav className="flex items-center gap-4">
            {links.map((l: any, i: number) => (
              <Link key={i} href={l.href || '#'} className="hover:underline">{l.label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  function renderBlock(block: any, idx: number) {
    switch (block?.type) {
      case 'Header': return <div key={block.id || idx}>{renderHeader(block)}</div>;
      case 'Hero': return <div key={block.id || idx}>{renderHero(block)}</div>;
      case 'Banner': return <div key={block.id || idx}>{renderBanner(block)}</div>;
      case 'ProductSlider': return <div key={block.id || idx}>{renderProductSlider(block)}</div>;
      case 'RichText': return <div key={block.id || idx}>{renderRichText(block)}</div>;
      case 'Footer': return <div key={block.id || idx}>{renderFooter(block)}</div>;
      default: return null;
    }
  }

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

  // Load editor overrides from localStorage
  useEffect(() => {
    if (!isEditor) return;
    try {
      const key = `shopTheme:${params.slug}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw);
        setThemeColorOverride(obj.themeColor || "");
        setBannerOverride(obj.banner || "");
        setLogoOverride(obj.logo || "");
      }
    } catch {}
  }, [isEditor, params.slug]);

  // Load per-seller gallery for editor
  useEffect(() => {
    if (!isEditor) return;
    let cancelled = false;
    async function run() {
      try {
        setGalleryLoading(true);
        const sellerId = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.id || u?.shop?._id || u?.id || u?._id || ''; } catch { return ''; } })();
        const q = new URLSearchParams();
        if (sellerId) q.set('sellerId', sellerId);
        q.set('folder', 'builder');
        const res = await fetch(`/api/v1/uploads?${q.toString()}`);
        const data = await res.json().catch(() => ({ files: [] }));
        if (!cancelled) setGallery(Array.isArray(data.files) ? data.files : []);
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [isEditor]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    const sellerId = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.id || u?.shop?._id || u?.id || u?._id || ''; } catch { return ''; } })();
    for (const f of files) {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', 'builder');
      if (sellerId) fd.append('sellerId', sellerId);
      const res = await fetch(`/api/v1/uploads`, { method: 'POST', body: fd as any });
      try { const data = await res.json(); const u = data?.url || data?.secure_url || data?.location || data?.path; if (u) urls.push(u); } catch {}
    }
    // refresh gallery
    try {
      const q = new URLSearchParams(); if (sellerId) q.set('sellerId', sellerId); q.set('folder', 'builder');
      const res = await fetch(`/api/v1/uploads?${q.toString()}`);
      const data = await res.json().catch(() => ({ files: [] }));
      setGallery(Array.isArray(data.files) ? data.files : []);
    } catch {}
    return urls;
  };

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

  // Blocks from builder, if present
  const builderBlocks = Array.isArray(builderData?.home?.blocks) ? builderData.home.blocks : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {builderBlocks && builderBlocks.length > 0 && (
        <>
          {builderBlocks.map((b: any, i: number) => renderBlock(b, i))}
        </>
      )}
      {/* Banner */}
      {(bannerOverride || shop.banner?.url) && (
        <div className="rounded-xl overflow-hidden border">
          <img src={bannerOverride || shop.banner?.url!} alt="banner" className="w-full h-48 sm:h-56 object-cover" />
        </div>
      )}

      {/* Header card */}
      <div className="rounded-xl border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[96px_1fr_auto] gap-4 items-start">
          {(logoOverride || shop.logo?.url) ? (
            <img src={logoOverride || shop.logo?.url!} alt="logo" className="h-18 w-18 sm:h-24 sm:w-24 rounded-md border object-cover" />
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
          {products.slice(0, 8).map((p: any) => (
            <Link key={p._id} href={`/shop/${shop.slug}/products/${p.slug ?? p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="aspect-square bg-slate-100">
                <img src={p.mainImage || p.images?.[0] || 'https://dummyimage.com/600x600/e5e7eb/111827&text=Product'} alt={p.title} className="w-full h-full object-cover" />
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
          <Link href={`/shop/${shop.slug}/products`} className="text-emerald-700 hover:underline text-sm">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <Link key={p._id} href={`/shop/${shop.slug}/products/${p.slug ?? p._id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
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
      {/* Right inspector when editor mode */}
      {isEditor && (
        <Box sx={{ position: 'fixed', right: 12, top: 72, bottom: 12, width: 340, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2, overflowY: 'auto', zIndex: 50 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Shop Designer</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Theme color</Typography>
          <TextField size="small" fullWidth label="Theme color (hex)" value={themeColorOverride} onChange={(e) => setThemeColorOverride(e.target.value)} sx={{ mb: 2 }} />

          <Typography variant="subtitle2">Logo</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField size="small" fullWidth label="Logo URL" value={logoOverride} onChange={(e) => setLogoOverride(e.target.value)} />
            <ButtonMUI variant="contained" component="label" size="small">Upload
              <input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files || [])); if (u) setLogoOverride(u); }} />
            </ButtonMUI>
          </Box>
          {logoOverride && (
            <Box sx={{ mb: 2 }}>
              <img src={logoOverride} alt="logo" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </Box>
          )}

          <Typography variant="subtitle2">Banner</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField size="small" fullWidth label="Banner URL" value={bannerOverride} onChange={(e) => setBannerOverride(e.target.value)} />
            <ButtonMUI variant="contained" component="label" size="small">Upload
              <input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files || [])); if (u) setBannerOverride(u); }} />
            </ButtonMUI>
          </Box>
          {bannerOverride && (
            <Box sx={{ mb: 2 }}>
              <img src={bannerOverride} alt="banner" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>My uploads</Typography>
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1, maxHeight: 240, overflow: 'auto' }}>
            {galleryLoading ? (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                {gallery.map((u) => (
                  <Box key={u} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setBannerOverride(u); }}>
                    <img src={u} alt="upload" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
                  </Box>
                ))}
                {gallery.length === 0 && <Typography variant="caption" color="text.secondary">No uploads yet.</Typography>}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />
          <ButtonMUI variant="contained" fullWidth onClick={() => {
            try {
              const key = `shopTheme:${params.slug}`;
              const data = { themeColor: themeColorOverride, banner: bannerOverride, logo: logoOverride };
              localStorage.setItem(key, JSON.stringify(data));
            } catch {}
          }}>Save locally</ButtonMUI>
        </Box>
      )}

    </div>
  );
}
