"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Container, AppBar, Toolbar, IconButton, Typography, Button, Drawer, List, ListItemButton, ListItemText, Divider, Stack, Menu, MenuItem, Select, FormControl, InputLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButtonGroup, ToggleButton, FormControlLabel, Switch, Checkbox, CircularProgress, Avatar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import PreviewRenderer, { type BuilderData } from "@/components/builder/PreviewRenderer";
import { ProductAPI, AuthAPI, api as apiRequest, type ProductDTO } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { saveBuilderDesign } from "@/store/slice/builderSlice";
import { meThunk } from "@/store/slice/authSlice";
import { loadCodeSession, saveCodeSession, createNewSession, setFile, setMeta } from "@/store/slice/codeStudioSlice";

type AllData = BuilderData & { product?: any; products?: any };

// Module-level cache to survive component remounts / HMR
const __loadedPairs = new Set<string>();
const __initedSessions = new Set<string>();

export default function BuilderPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const qs = useSearchParams();
  const isEditor = (qs?.get("editor") ?? "1") !== "0";
  const dispatch = useAppDispatch();
  const code = useAppSelector((s: any) => s.codeStudio);
  const authUser = useAppSelector((s: any) => s.auth?.user);
  const [raw, setRaw] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ anchor: null | { x: number; y: number }; blockId?: string }>({ anchor: null });
  const [template, setTemplate] = useState<string>(qs?.get("template") || "home");
  const [selectedId, setSelectedId] = useState<string>("");
  const [mediaOpen, setMediaOpen] = useState<false | { multi: boolean; onPick: (urls: string[]) => void }>(false);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [mediaUrlsInput, setMediaUrlsInput] = useState<string>("");
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const [productsDialog, setProductsDialog] = useState<null | { url?: string; mode?: 'picker' }>(null);
  const [serverOnlyPublish, setServerOnlyPublish] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>("");
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [productResults, setProductResults] = useState<ProductDTO[]>([]);
  const [productTempSelected, setProductTempSelected] = useState<string[]>([]);
  const [productPage, setProductPage] = useState<number>(1);
  const [productHasMore, setProductHasMore] = useState<boolean>(false);
  // Names cache for selected product IDs (for display under ProductSlider)
  const [productNameCache, setProductNameCache] = useState<Record<string, string>>({});
  // Drag & drop state for media dialog
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // Cache shopId and init status to avoid repeated API calls in dev/StrictMode or re-renders
  const [shopIdState, setShopIdState] = useState<string | null>(null);
  const initRef = useRef<string | null>(null);
  const lastLoadedRef = useRef<{ shopId: string; sessionId: string } | null>(null);

  // Resolve logged-in seller shopId reliably (localStorage -> /api/v1/auth/me)
  const resolveShopId = async (): Promise<string | null> => {
    try {
      // 0) Prefer Redux auth
      const reduxShopId = authUser?.shop?._id || authUser?.shop?.id || null;
      if (reduxShopId) return String(reduxShopId);
      // 1) localStorage fallback
      const uLocal = (() => { try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch { return {}; } })();
      const idLocal = uLocal?.shop?._id || uLocal?.shop?.id || '';
      if (idLocal) return String(idLocal);
    } catch {}
    try {
      const data = await AuthAPI.getCurrentUser();
      const user = (data as any)?.user;
      const id = user?.shop?._id || user?.shop?.id || null;
      if (user) {
        try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
      }
      if (id) return String(id);
    } catch {}
    // Final fallback: ask backend for current user's shop
    try {
      const my = await apiRequest<any>('/api/v1/shops/my');
      const sid = my?.shop?._id || my?.shop?.id || null;
      if (sid) return String(sid);
    } catch {
      return null;
    }
    return null;
  };

  // (moved below selectedBlock to avoid TS order issue)

  // Load or create a code session tied to this builder id
  useEffect(() => {
    if (!id) return;
    // Guard to run only once per session id using ref + sessionStorage + module set
    const initKey = `builder:init:${id}`;
    if (initRef.current === id || (typeof window !== 'undefined' && sessionStorage.getItem(initKey) === '1') || __initedSessions.has(String(id))) {
      return;
    }
    initRef.current = id as string;
    try { if (typeof window !== 'undefined') sessionStorage.setItem(initKey, '1'); } catch {}
    __initedSessions.add(String(id));
    // Always ensure a session exists for this page
    dispatch(createNewSession({ sessionId: id as string }));
    (async () => {
      if (!authUser) {
        try { await dispatch(meThunk()).unwrap(); } catch {}
      }
      const shopId = await resolveShopId();
      if (shopId) setShopIdState(shopId);
      try { console.log('[Builder:init]', { id, shopId }); } catch {}
      if (shopId) {
        // Skip duplicate load if same pair already loaded
        const pair = { shopId, sessionId: id as string };
        const pairKey = `${pair.shopId}:${pair.sessionId}`;
        const already = (lastLoadedRef.current && lastLoadedRef.current.shopId === pair.shopId && lastLoadedRef.current.sessionId === pair.sessionId) || __loadedPairs.has(pairKey) || code?.loading;
        if (!already) {
          lastLoadedRef.current = pair;
          __loadedPairs.add(pairKey);
          dispatch(loadCodeSession(pair)).catch((e: any) => { try { console.error('[Builder] loadCodeSession error', e); } catch {} });
        }
        dispatch(setMeta({ template, shopId, sessionId: id }));
      } else {
        dispatch(setMeta({ template, sessionId: id }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = () => {
    try {
      const key = `builder:${id}`;
      const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (!v) {
        // initialize empty structure if not found
        const init = { home: { blocks: [] }, products: { blocks: [] }, product: { blocks: [] } };
        localStorage.setItem(key, JSON.stringify(init, null, 2));
        setRaw(JSON.stringify(init));
      } else {
        setRaw(v);
      }
    } catch {
      setRaw(null);
    }
  };

  // Ensure all sections are mirrored into code session files before saving
  const syncAllToFiles = () => {
    try {
      const obj = allData || { home: { blocks: [] }, products: { blocks: [] }, product: { blocks: [] } } as any;
      ['home','products','product'].forEach((section) => {
        const path = `builder/${section}.json`;
        const content = JSON.stringify(obj[section] || { blocks: [] }, null, 2);
        dispatch(setFile({ path, content }));
      });
      dispatch(setMeta({ lastEditedSection: template }));
    } catch {}
  };

  // Load products for picker
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!productsDialog || productsDialog.mode !== 'picker') return;
      try {
        setProductLoading(true);
        const res = await ProductAPI.list({ q: productSearch, limit: 25, page: productPage });
        const items = (res as any)?.products || (res as any) || [];
        if (!cancelled) setProductResults(items);
        // Simple heuristic for hasMore: if page full
        if (!cancelled) setProductHasMore(Array.isArray(items) && items.length === 25);
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [productsDialog, productSearch, productPage]);

  // Load seller media gallery when media dialog opens
  useEffect(() => {
    let cancelled = false;
    async function loadGallery() {
      if (!mediaOpen) return;
      try {
        setMediaLoading(true);
        const sellerId = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.id || u?.shop?._id || u?.id || u?._id || ''; } catch { return ''; } })();
        const q = new URLSearchParams();
        if (sellerId) q.set('sellerId', sellerId);
        q.set('folder', 'builder');
        const res = await fetch(`/api/v1/uploads?${q.toString()}`);
        const data = await res.json().catch(() => ({ files: [] }));
        if (!cancelled) setMediaGallery(Array.isArray(data.files) ? data.files : []);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    }
    loadGallery();
    return () => { cancelled = true; };
  }, [mediaOpen]);

  const updateSelected = (mutate: (b: any) => any) => {
    if (!allData || !selectedId) return;
    const next = { ...allData } as any;
    const key = template as keyof AllData;
    const arr = next[key].blocks || [];
    const idx = arr.findIndex((b: any) => b.id === selectedId);
    if (idx < 0) return;
    const edited = mutate({ ...arr[idx], props: { ...(arr[idx].props || {}) } });
    arr[idx] = edited;
    next[key].blocks = [...arr];
    save(next);
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    const sellerId = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.id || u?.shop?._id || u?.id || u?._id || ''; } catch { return ''; } })();
    for (const f of files) {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', 'builder');
      if (sellerId) fd.append('sellerId', sellerId);
      const res = await fetch(`/api/v1/uploads`, { method: 'POST', body: fd as any });
      try { const data = await res.json(); urls.push(data?.url || data?.secure_url || data?.location || data?.path); } catch { }
    }
    // refresh gallery after upload
    try {
      const q = new URLSearchParams(); if (sellerId) q.set('sellerId', sellerId); q.set('folder', 'builder');
      const res = await fetch(`/api/v1/uploads?${q.toString()}`);
      const data = await res.json().catch(() => ({ files: [] }));
      setMediaGallery(Array.isArray(data.files) ? data.files : []);
    } catch {}
    return urls.filter(Boolean);
  };

  // Prefill the current template with a complete set of demo blocks
  const loadDemo = () => {
    const demo: any = {
      home: {
        blocks: [
          { id: `topbar-${Math.random().toString(36).slice(2,6)}`, type: 'TopBar', props: { text: 'Free shipping over ₹999' } },
          { id: `header-${Math.random().toString(36).slice(2,6)}`, type: 'Header', props: { menu: [ { label: 'Home', href: '/' }, { label: 'Products', href: '/shops/sample/products' }, { label: 'Contact', href: '/contact' } ] } },
          { id: `carousel-${Math.random().toString(36).slice(2,6)}`, type: 'ImageCarousel', props: { title: 'Highlights', images: ['/banner-placeholder.jpg','/banner2.jpg','/banner3.jpg'] } },
          { id: `hero-${Math.random().toString(36).slice(2,6)}`, type: 'Hero', props: { image: '/banner-placeholder.jpg', heading: 'Welcome', subheading: 'Build your store', ctaText: 'Shop now', ctaHref: '/shops/sample/products' } },
          { id: `feat-${Math.random().toString(36).slice(2,6)}`, type: 'FeaturedProduct', props: { title: 'Editor’s pick', name: 'Awesome Tee', price: 799, image: '/product-placeholder.png' } },
          { id: `faq-${Math.random().toString(36).slice(2,6)}`, type: 'FAQ', props: { title: 'FAQs', items: [ { q: 'Shipping time?', a: '3–5 days.' }, { q: 'Returns?', a: '7-day easy return.' } ] } },
          { id: `testi-${Math.random().toString(36).slice(2,6)}`, type: 'Testimonials', props: { title: 'Happy customers', items: [ { name: 'Aarav', text: 'Great quality!' }, { name: 'Mira', text: 'Fast delivery.' }, { name: 'Rohan', text: 'Love it!' } ] } },
          { id: `contact-${Math.random().toString(36).slice(2,6)}`, type: 'ContactForm', props: { title: 'Contact us' } },
          { id: `footer-${Math.random().toString(36).slice(2,6)}`, type: 'Footer', props: { links: [ { label: 'Shipping', href: '/shops/sample/pages/shipping-policy' }, { label: 'Terms', href: '#' } ] } },
        ],
      },
      products: { blocks: [] },
      product: { blocks: [] },
    };
    save(demo);
  };

  const toggleHidden = (blockId: string) => {
    if (!allData) return;
    const next = { ...allData } as any;
    const key = template as keyof AllData;
    const arr = next[key].blocks || [];
    const idx = arr.findIndex((b: any) => b.id === blockId);
    if (idx < 0) return;
    const blk = { ...arr[idx] };
    blk.props = blk.props || {};
    blk.props.hidden = !blk.props.hidden;
    arr[idx] = blk;
    next[key].blocks = [...arr];
    save(next);
  };

  const save = (obj: any) => {
    try {
      const key = `builder:${id}`;
      localStorage.setItem(key, JSON.stringify(obj, null, 2));
      setRaw(JSON.stringify(obj));
      // Sync into code session files and meta
      const section = template;
      const path = `builder/${section}.json`;
      dispatch(setFile({ path, content: JSON.stringify((obj as any)[section] || { blocks: [] }, null, 2) }));
      dispatch(setMeta({ lastEditedSection: section }));
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  const allData: AllData | null = useMemo(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.home) parsed.home = { blocks: [] };
      if (!parsed.product) parsed.product = { blocks: [] };
      if (!parsed.products) parsed.products = { blocks: [] };
      return parsed;
    } catch {
      return { home: { blocks: [] } } as AllData;
    }
  }, [raw]);

  const currentData: BuilderData = useMemo(() => {
    if (!allData) return { home: { blocks: [] } };
    const key = template as keyof AllData;
    const section = (allData as any)[key] || { blocks: [] };
    return key === "home" ? { home: section } : { home: section };
  }, [allData, template]);

  const selectedBlock = useMemo(() => {
    const b = (currentData.home?.blocks || []).find((x: any) => x.id === selectedId);
    return b as any;
  }, [currentData, selectedId]);

  // Resolve and cache product names for ProductSlider inspector (after selectedBlock is defined)
  useEffect(() => {
    const b = selectedBlock;
    if (!b || b.type !== 'ProductSlider') return;
    const ids: string[] = Array.isArray(b.props?.productIds) ? b.props.productIds : [];
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      const missing = ids.filter((id) => !productNameCache[id]);
      if (missing.length === 0) return;
      const queue = [...missing];
      const fetched: Record<string, string> = {};
      const workers = 2;
      async function worker() {
        while (queue.length && !cancelled) {
          const id = queue.shift() as string;
          try {
            const res = await ProductAPI.get(id);
            const p: any = (res as any)?.product || res;
            if (p) fetched[id] = p.title || id;
          } catch {
            fetched[id] = id;
          }
        }
      }
      await Promise.all(Array.from({ length: workers }).map(() => worker()));
      if (!cancelled && Object.keys(fetched).length) setProductNameCache((prev) => ({ ...prev, ...fetched }));
    })();
    return () => { cancelled = true };
  }, [selectedBlock, selectedBlock?.type, selectedBlock?.props?.productIds]);

  const addSection = (type: string, variant?: string) => {
    if (!allData) return;
    const idGen = `${type.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;
    // preset variants
    const headerPresets: any[] = [
      { menu: [ { label: "Home", href: "/" }, { label: "Products", href: "/shops/sample/products" } ] },
      { menu: [ { label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Contact", href: "/contact" } ] },
      { menu: [ { label: "Shop", href: "/shops/sample/products" }, { label: "FAQ", href: "#faq" } ] },
      { menu: [] }, { menu: [] }, { menu: [] }
    ];
    const bannerPresets: any[] = [
      { image: "/banner-placeholder.jpg", href: "/shops/sample/products", alt: "Banner" },
      { image: "/banner2.jpg", href: "/shops/sample/products", alt: "Sale" },
      { image: "/banner3.jpg", href: "#", alt: "Promo" },
      { image: "/banner4.jpg" }, { image: "/banner5.jpg" }, { image: "/banner6.jpg" }
    ];
    const block =
      type === "TopBar" ? { id: idGen, type: "TopBar", props: { text: "Free shipping over ₹999" } } :
      type === "Header" ? { id: idGen, type: "Header", props: headerPresets[Math.min(Number(variant || 0), 5)] } :
      type === "Hero" ? { id: idGen, type: "Hero", props: { image: "/banner-placeholder.jpg", heading: "Welcome", subheading: "Customize your theme", ctaText: "Shop now", ctaHref: "/shops/sample/products" } } :
      type === "Banner" ? { id: idGen, type: "Banner", props: bannerPresets[Math.min(Number(variant || 0), 5)] } :
      type === "ImageCarousel" ? { id: idGen, type: "ImageCarousel", props: { title: "Highlights", images: ["/banner-placeholder.jpg", "/banner2.jpg", "/banner3.jpg"] } } :
      type === "FeaturedProduct" ? { id: idGen, type: "FeaturedProduct", props: { title: "Editor’s pick", name: "Awesome Tee", price: 799, image: "/product-placeholder.png" } } :
      type === "FAQ" ? { id: idGen, type: "FAQ", props: { title: "FAQs", items: [ { q: "Shipping time?", a: "3–5 days." } ] } } :
      type === "Testimonials" ? { id: idGen, type: "Testimonials", props: { title: "Happy customers", items: [ { name: "Aarav", text: "Great quality!" } ] } } :
      type === "ContactForm" ? { id: idGen, type: "ContactForm", props: { title: "Contact us" } } :
      type === "RichText" ? { id: idGen, type: "RichText", props: { html: "<h2>About</h2><p>Write content...</p>" } } :
      type === "BlogGrid" ? { id: idGen, type: "BlogGrid", props: { title: "From the blog", cols: 3, layout: 'grid', items: [ { image: "/banner4.jpg", title: "Welcome", excerpt: "Short intro.", href: "#", slug: "welcome" } ] } } :
      type === "BlogPost" ? { id: idGen, type: "BlogPost", props: { title: "Welcome", author: "", date: "", image: "/banner4.jpg", html: "<p>Write your blog content...</p>" } } :
      type === "ProductSlider" ? { id: idGen, type: "ProductSlider", props: { title: "Products", limit: 8 } } :
      type === "ProfileHeader" ? { id: idGen, type: "ProfileHeader", props: { name: "Seller Name", bio: "Write a short bio...", avatar: "", banner: "" } } :
      type === "WhyChooseUs" ? { id: idGen, type: "WhyChooseUs", props: { title: "Why choose us", cols: 3, items: [ { icon: "", title: "Quality", desc: "Best in class" } ] } } :
      type === "GallerySlider" ? { id: idGen, type: "GallerySlider", props: { title: "Gallery", images: [], autoplay: true, interval: 3000, showArrows: true, showDots: false } } :
      { id: idGen, type: "Footer", props: { links: [ { label: "Shipping", href: "/shops/sample/pages/shipping-policy" } ] } };

    const next = { ...allData } as any;
    const key = template as keyof AllData;
    if (!next[key]) next[key] = { blocks: [] };
    if (!Array.isArray(next[key].blocks)) next[key].blocks = [];
    next[key].blocks.push(block);
    save(next);
  };

  const onEditBlock = (block: any) => {
    router.push(`/seller/builder/${id}/code?template=${template}&block=${block.id}`);
  };

  const removeBlock = (blockId: string) => {
    if (!allData) return;
    const next = { ...allData } as any;
    const key = template as keyof AllData;
    next[key].blocks = (next[key].blocks || []).filter((b: any) => b.id !== blockId);
    save(next);
  };

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    if (!allData) return;
    const next = { ...allData } as any;
    const key = template as keyof AllData;
    const arr = next[key].blocks || [];
    const idx = arr.findIndex((b: any) => b.id === blockId);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    next[key].blocks = [...arr];
    save(next);
  };

  const duplicateBlock = (blockId: string) => {
    if (!allData) return;
    const next = { ...allData } as any;
    const key = template as keyof AllData;
    const arr = next[key].blocks || [];
    const idx = arr.findIndex((b: any) => b.id === blockId);
    if (idx < 0) return;
    const copy = { ...arr[idx], id: `${arr[idx].type.toLowerCase()}-${Math.random().toString(36).slice(2,8)}` };
    arr.splice(idx + 1, 0, copy);
    next[key].blocks = [...arr];
    save(next);
  };

  return (
    <>
    <Box sx={{ height: "100vh", bgcolor: "#f6f7f9", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>Theme Editor</Typography>
          <Button onClick={load} sx={{ mr: 1 }}>Reload</Button>
          <Button variant="outlined" onClick={async () => {
            // Load from backend for logged-in seller
            const shopId = shopIdState || await resolveShopId();
            if (!shopId || !id) return alert('Login required to load code');
            try {
              // Avoid redundant loads if same pair
              const pair = { shopId, sessionId: id as string };
              const pairKey = `${pair.shopId}:${pair.sessionId}`;
              const already = (lastLoadedRef.current && lastLoadedRef.current.shopId === pair.shopId && lastLoadedRef.current.sessionId === pair.sessionId) || __loadedPairs.has(pairKey) || code?.loading;
              const payload = already ? { files: code?.files || {} } : await dispatch(loadCodeSession(pair)).unwrap();
              lastLoadedRef.current = pair;
              __loadedPairs.add(pairKey);
              try { console.info('[Builder] Loaded code session', { shopId, sessionId: id, files: Object.keys(payload?.files||{}) }); } catch {}
              // Remember last session id for this shop so storefront can auto-hydrate
              try { if (shopId) localStorage.setItem(`builder:lastSessionId:${shopId}`, String(id)); } catch {}
              // Hydrate current template from returned code files if available
              const files: Record<string,string> = (payload?.files || {} as any);
              const current = files[`builder/${template}.json`] || files['builder/home.json'];
              if (current) {
                try {
                  const parsed = JSON.parse(current);
                  const existing = allData || { home: { blocks: [] }, products: { blocks: [] }, product: { blocks: [] } };
                  const next = { ...existing } as any;
                  next[template] = parsed;
                  const key = `builder:${id}`;
                  localStorage.setItem(key, JSON.stringify(next, null, 2));
                  setRaw(JSON.stringify(next));
                } catch {}
              }
            } catch {
              alert('Failed to load code session');
            }
          }} sx={{ mr: 1 }}>Load Code</Button>
          <Button variant="outlined" onClick={() => { loadDemo(); setTimeout(syncAllToFiles, 0); }} sx={{ mr: 1 }}>Load demo content</Button>
          <FormControlLabel sx={{ mr: 2 }} control={<Switch checked={serverOnlyPublish} onChange={(e) => setServerOnlyPublish(e.target.checked)} />} label="Server-only" />
          <Button variant="outlined" color="secondary" disabled={code?.saving} onClick={async () => {
            // Ensure we have a session id
            if (!code?.sessionId && id) {
              dispatch(createNewSession({ sessionId: id as string }));
            }
            // Resolve shopId from localStorage or meta fallback
            const shopId = shopIdState || await resolveShopId();
            if (!shopId) return alert('Login required to save code');
            try {
              // Mirror current builder JSON into code files for all sections
              syncAllToFiles();
              await dispatch(saveCodeSession({ shopId })).unwrap();
              try { console.info('[Builder] Saved code session', { shopId, sessionId: id }); } catch {}
              // Remember last session id for this shop so storefront can auto-hydrate
              try { if (shopId) localStorage.setItem(`builder:lastSessionId:${shopId}`, String(id)); } catch {}
              // Also publish to shop.metadata.builder so public storefront can render without auth
              try {
                const files = code?.files || {} as Record<string, string>;
                const nextBuilder: any = {};
                const home = files['builder/home.json'] || files['builder\\home.json'];
                const products = files['builder/products.json'] || files['builder\\products.json'];
                const product = files['builder/product.json'] || files['builder\\product.json'];
                if (home) { try { nextBuilder.home = JSON.parse(home); } catch {} }
                if (products) { try { nextBuilder.products = JSON.parse(products); } catch {} }
                if (product) { try { nextBuilder.product = JSON.parse(product); } catch {} }
                // Persist locally for immediate storefront read
                try { localStorage.setItem(`builder:${shopId}`, JSON.stringify(nextBuilder)); } catch {}
                const slug = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.slug || u?.slug || ''; } catch { return ''; } })();
                try { if (slug) localStorage.setItem(`builder:${slug}`, JSON.stringify(nextBuilder)); } catch {}
                // Push to backend metadata (public)
                if (Object.keys(nextBuilder).length) {
                  await dispatch(saveBuilderDesign({ shopId, builder: nextBuilder })).unwrap();
                  try { console.info('[Builder] Published builder to metadata', { shopId, sections: Object.keys(nextBuilder) }); } catch {}
                }
              } catch (e) { try { console.warn('[Builder] Auto-publish metadata failed (non-fatal):', e); } catch {} }
              alert('Code session saved');
            } catch (e: any) {
              const msg = e?.message || (typeof e === 'string' ? e : 'Failed to save code session');
              console.error('[Builder] Save code session failed:', e);
              alert(msg);
            }
          }} sx={{ mr: 1 }}>{code?.saving ? 'Saving…' : 'Save Code'}</Button>
          <Button variant="contained" color="primary" onClick={async () => {
            try {
              // build payload
              const builderData = allData || { home: { blocks: [] } };
              // get seller shop via resolver
              const shopId = shopIdState || await resolveShopId();
              const slug = (() => { try { const u = JSON.parse(localStorage.getItem('user')||'{}'); return u?.shop?.slug || u?.slug || ''; } catch { return ''; } })();
              if (!shopId) { alert('Login required to publish'); return; }
              // optimistic local persistence for shop pages
              if (!serverOnlyPublish) {
                try { if (shopId) localStorage.setItem(`builder:${shopId}`, JSON.stringify(builderData)); } catch {}
                try { if (slug) localStorage.setItem(`builder:${slug}`, JSON.stringify(builderData)); } catch {}
              }
              // backend persistence via Redux thunk
              if (shopId) {
                await dispatch(saveBuilderDesign({ shopId, builder: builderData })).unwrap();
              }
              alert('Published design to shop. Visit /shop/<slug> to see it.');
            } catch (e) {
              alert('Failed to publish. The design is still saved locally for your shop slug.');
            }
          }}>Publish to Shop</Button>
          <FormControl size="small" sx={{ mr: 2, minWidth: 150 }}>
            <InputLabel>Template</InputLabel>
            <Select
              native
              value={template}
              onChange={(e: any) => setTemplate(e.target.value)}
              label="Template"
            >
              <option value="home">Home</option>
              <option value="products">Products</option>
              <option value="product">Product</option>
              <option value="profile">Profile</option>
            </Select>
          </FormControl>
          <ToggleButtonGroup exclusive size="small" value={device} onChange={(e, v) => v && setDevice(v)} sx={{ mr: 1 }}>
            <ToggleButton value="desktop">Desktop</ToggleButton>
            <ToggleButton value="tablet">Tablet</ToggleButton>
            <ToggleButton value="mobile">Mobile</ToggleButton>
          </ToggleButtonGroup>
          <Button startIcon={<RefreshIcon />} onClick={load}>Reload</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0, height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Drawer variant="permanent" open PaperProps={{ sx: { position: "relative", width: 280, height: '100%', overflow: 'hidden', overscrollBehavior: 'none' } }}>
          <Toolbar />
          <Box sx={{ p: 2, height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' }, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sections</Typography>
            <List dense>
              {(currentData.home?.blocks || []).map((b: any) => (
                <ListItemButton key={b.id} onClick={() => onEditBlock(b)} onContextMenu={(e) => { e.preventDefault(); setMenu({ anchor: { x: e.clientX, y: e.clientY }, blockId: b.id }); }}>
                  <ListItemText primary={`${b.type}`} secondary={b.id} />
                </ListItemButton>
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Add section</Typography>
            <Stack spacing={1}>
              {/* Profile page sections */}
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ProfileHeader")}>Profile Header</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("WhyChooseUs")}>Why choose us</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("GallerySlider")}>Gallery slider</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("TopBar")}>TopBar</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Header", "0")}>Header (v1)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Header", "1")}>Header (v2)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Hero")}>Hero</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Banner", "0")}>Banner (v1)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Banner", "1")}>Banner (v2)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ImageCarousel")}>Image Carousel</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ProductSlider")}>ProductSlider</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("BlogGrid")}>Blog Grid</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("BlogPost")}>Single Blog</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("FeaturedProduct")}>Featured Product</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("FAQ")}>FAQ</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Testimonials")}>Testimonials</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ContactForm")}>Contact Form</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Footer")}>Footer</Button>
            </Stack>
          </Box>
        </Drawer>

        {/* Canvas */}
        <Box id="canvasScroll" sx={{ flex: 1, p: 3, overflowY: 'auto', overflowX: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overscrollBehavior: 'contain' }}>
          <Box sx={{ width: device==='desktop'? 1200 : device==='tablet'? 834 : 390, transition: 'width .2s ease', border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fff' }}>
          {!id && (
            <Typography color="text.secondary">Invalid preview id.</Typography>
          )}
          {id && raw === null && (
            <Typography color="text.secondary">No data found in localStorage for key <code>builder:{id}</code>.</Typography>
          )}
          {allData && (
            <PreviewRenderer data={currentData} device={device} editorMode={isEditor} onEditBlock={onEditBlock} onOpenMenu={(blk, anchor) => setMenu({ anchor, blockId: blk.id })} onSelectBlock={(b) => setSelectedId(b.id)} selectedId={selectedId} onOpenProducts={(url) => setProductsDialog({ url })} />
          )}
          </Box>
        </Box>

        {/* Inspector */}
        {isEditor && (
          <Box sx={{ width: 340, height: '100%', borderLeft: '1px solid #e5e7eb', p: 2, bgcolor: '#fff', overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Inspector</Typography>
            {!selectedBlock && (
              <Typography color="text.secondary" variant="body2">Select a section to edit its content and styles.</Typography>
            )}
            {selectedBlock && (
              <Stack spacing={1.25}>
                <Typography variant="subtitle2">{selectedBlock.type}</Typography>
                {/* Common styles */}
                <TextField size="small" label="Background" type="color" value={selectedBlock.props?.bg || '#ffffff'} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, bg: e.target.value } }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Text color" type="color" value={selectedBlock.props?.color || '#000000'} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, color: e.target.value } }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Border color" type="color" value={selectedBlock.props?.borderColor || '#e5e7eb'} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, borderColor: e.target.value } }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="number" label="Border width (px)" value={selectedBlock.props?.borderWidth ?? ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, borderWidth: Number(e.target.value) } }))} />
                <TextField size="small" type="number" label="Radius (px)" value={selectedBlock.props?.radius ?? ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, radius: Number(e.target.value) } }))} />
                <TextField size="small" type="number" label="Padding (px)" value={selectedBlock.props?.p ?? ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, p: Number(e.target.value) } }))} />

                {/* Per block fields */}
                {selectedBlock.type === 'TopBar' && (
                  <TextField size="small" label="Text" value={selectedBlock.props?.text || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, text: e.target.value } }))} />
                )}
                {selectedBlock.type === 'Header' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <Typography variant="body2">Menu items</Typography>
                    <Stack spacing={1}>
                      {Array.isArray(selectedBlock.props?.menu) ? selectedBlock.props.menu.map((m: any, i: number) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField size="small" label="Label" value={m.label || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.menu)? [...b.props.menu]:[]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...b, props: { ...b.props, menu: arr } }; })} />
                          <TextField size="small" label="Href" value={m.href || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.menu)? [...b.props.menu]:[]; arr[i] = { ...(arr[i]||{}), href: e.target.value }; return { ...b, props: { ...b.props, menu: arr } }; })} />
                          <Button size="small" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.menu)? [...b.props.menu]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, menu: arr } }; })}>Remove</Button>
                        </Stack>
                      )) : null}
                    </Stack>
                    <Button size="small" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, menu: [ ...(b.props?.menu || []), { label: '', href: '' } ] } }))}>Add menu item</Button>
                  </>
                )}
                {selectedBlock.type === 'Hero' && (
                  <>
                    <TextField size="small" label="Heading" value={selectedBlock.props?.heading || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, heading: e.target.value } }))} />
                    <TextField size="small" label="Subheading" value={selectedBlock.props?.subheading || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, subheading: e.target.value } }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" label="CTA text" value={selectedBlock.props?.ctaText || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, ctaText: e.target.value } }))} />
                      <TextField size="small" label="CTA href" value={selectedBlock.props?.ctaHref || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, ctaHref: e.target.value } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" label="Overlay color" type="color" value={selectedBlock.props?.overlayColor || '#000000'} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, overlayColor: e.target.value } }))} InputLabelProps={{ shrink: true }} />
                      <TextField size="small" type="number" inputProps={{ step: 0.05, min: 0, max: 1 }} label="Overlay opacity" value={selectedBlock.props?.overlayOpacity ?? 0.25} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, overlayOpacity: Math.max(0, Math.min(1, Number(e.target.value))) } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" fullWidth label="Image URL" value={selectedBlock.props?.image || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, image: e.target.value } }))} />
                      <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); setMediaOpen(false); } })}>Pick</Button>
                    </Stack>
                  </>
                )}
                {selectedBlock.type === 'Banner' && (
                  <>
                    <Typography variant="body2">Slides ({Array.isArray(selectedBlock.props?.slides) ? selectedBlock.props.slides.length : 0})</Typography>
                    <Stack spacing={1}>
                      {(Array.isArray(selectedBlock.props?.slides) ? selectedBlock.props.slides : []).map((s: any, i: number) => (
                        <Box key={i} sx={{ p: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" fullWidth label="Image URL" value={s.image || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), image: e.target.value }; return { ...b, props: { ...b.props, slides: arr } }; })} />
                              <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), image: u }; return { ...b, props: { ...b.props, slides: arr } }; }); setMediaOpen(false); } })}>Pick</Button>
                              <Button variant="contained" component="label">Upload
                                <input hidden type="file" accept="image/*" onChange={async (e) => { const files = Array.from(e.target.files || []); const [u] = await uploadFiles(files); if (u) updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), image: u }; return { ...b, props: { ...b.props, slides: arr } }; }); }} />
                              </Button>
                            </Stack>
                            <TextField size="small" label="Alt" value={s.alt || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), alt: e.target.value }; return { ...b, props: { ...b.props, slides: arr } }; })} />
                            <TextField size="small" label="Link href" value={s.href || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), href: e.target.value }; return { ...b, props: { ...b.props, slides: arr } }; })} />
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" label="Button text" value={s.ctaText || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), ctaText: e.target.value }; return { ...b, props: { ...b.props, slides: arr } }; })} />
                              <TextField size="small" label="Button href" value={s.ctaHref || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr[i] = { ...(arr[i]||{}), ctaHref: e.target.value }; return { ...b, props: { ...b.props, slides: arr } }; })} />
                            </Stack>
                            <Button size="small" color="error" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.slides)? [...b.props.slides]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, slides: arr } }; })}>Remove slide</Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, slides: [ ...(b.props?.slides || []), { image: '', href: '', alt: '', ctaText: '', ctaHref: '' } ] } }))}>Add slide</Button>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.autoplay)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, autoplay: e.target.checked } }))} />} label="Autoplay" />
                      <TextField size="small" type="number" label="Interval (ms)" value={selectedBlock.props?.interval ?? 3000} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, interval: Math.max(1000, Number(e.target.value)) } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <FormControlLabel control={<Switch checked={selectedBlock.props?.showArrows !== false} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showArrows: e.target.checked } }))} />} label="Show arrows" />
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.showDots)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showDots: e.target.checked } }))} />} label="Show dots" />
                    </Stack>
                  </>
                )}
                {selectedBlock.type === 'FeaturedProduct' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <TextField size="small" label="Name" value={selectedBlock.props?.name || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, name: e.target.value } }))} />
                    <TextField size="small" type="number" label="Price" value={selectedBlock.props?.price ?? ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, price: Number(e.target.value) } }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" fullWidth label="Image URL" value={selectedBlock.props?.image || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, image: e.target.value } }))} />
                      <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); setMediaOpen(false); } })}>Pick</Button>
                      <Button variant="contained" component="label">Upload
                        <input hidden type="file" accept="image/*" onChange={async (e) => { const urls = await uploadFiles(Array.from(e.target.files || [])); const [u] = urls; if (u) updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); }} />
                      </Button>
                    </Stack>
                  </>
                )}
                {selectedBlock.type === 'BlogGrid' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <TextField size="small" type="number" label="Columns (1-4)" value={selectedBlock.props?.cols ?? 3} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, cols: Math.max(1, Math.min(4, Number(e.target.value))) } }))} />
                    <FormControl size="small">
                      <InputLabel id="bloggrid-layout-label">Layout</InputLabel>
                      <Select labelId="bloggrid-layout-label" label="Layout" value={selectedBlock.props?.layout || 'grid'} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, layout: e.target.value } }))}>
                        <MenuItem value="grid">Grid</MenuItem>
                        <MenuItem value="featured">Featured (1 big + 2 side)</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2">Posts ({Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items.length : 0})</Typography>
                    <Stack spacing={1}>
                      {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((it: any, i: number) => (
                        <Box key={i} sx={{ p: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" fullWidth label="Image URL" value={it.image || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), image: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                              <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), image: u }; return { ...b, props: { ...b.props, items: arr } }; }); setMediaOpen(false); } })}>Pick</Button>
                              <Button variant="contained" component="label">Upload
                                <input hidden type="file" accept="image/*" onChange={async (e) => { const files = Array.from(e.target.files || []); const [u] = await uploadFiles(files); if (u) updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), image: u }; return { ...b, props: { ...b.props, items: arr } }; }); }} />
                              </Button>
                            </Stack>
                            <TextField size="small" label="Title" value={it.title || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), title: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            <TextField size="small" multiline minRows={2} label="Excerpt" value={it.excerpt || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), excerpt: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            <TextField size="small" label="Href" value={it.href || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), href: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            <TextField size="small" label="Slug (optional)" value={it.slug || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), slug: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} helperText="If set, card will link to /blogs/<slug> when Href is empty" />
                            <Button size="small" color="error" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, items: arr } }; })}>Remove post</Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                    <Button size="small" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, items: [ ...(b.props?.items || []), { image: '', title: '', excerpt: '', href: '' } ] } }))}>Add post</Button>
                  </>
                )}
                {selectedBlock.type === 'BlogPost' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" label="Author" value={selectedBlock.props?.author || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, author: e.target.value } }))} />
                      <TextField size="small" label="Date" value={selectedBlock.props?.date || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, date: e.target.value } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" fullWidth label="Hero image URL" value={selectedBlock.props?.image || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, image: e.target.value } }))} />
                      <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); setMediaOpen(false); } })}>Pick</Button>
                      <Button variant="contained" component="label">Upload
                        <input hidden type="file" accept="image/*" onChange={async (e) => { const urls = await uploadFiles(Array.from(e.target.files || [])); const [u] = urls; if (u) updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); }} />
                      </Button>
                    </Stack>
                    <TextField size="small" multiline minRows={8} label="HTML" value={selectedBlock.props?.html || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, html: e.target.value } }))} helperText="You can paste rich HTML here. For advanced editing, click 'Open code editor'." />
                    <Button size="small" onClick={() => router.push(`/seller/builder/${id}/code?template=${template}&block=${selectedId}`)}>Open code editor</Button>
                  </>
                )}
                {selectedBlock.type === 'Testimonials' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    {/* Non-MUI: layout toggle */}
                    <div className="mt-1">
                      <label className="text-xs text-slate-600">Layout</label>
                      <div className="mt-1 flex gap-2">
                        <button type="button" className={`px-2 py-1 rounded border text-xs ${selectedBlock.props?.layout !== 'slider' ? 'border-emerald-500 text-emerald-700' : 'border-slate-300'}`} onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, layout: 'grid' } }))}>Grid</button>
                        <button type="button" className={`px-2 py-1 rounded border text-xs ${selectedBlock.props?.layout === 'slider' ? 'border-emerald-500 text-emerald-700' : 'border-slate-300'}`} onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, layout: 'slider' } }))}>Slider</button>
                      </div>
                    </div>
                    {/* Non-MUI: slider options */}
                    {selectedBlock.props?.layout === 'slider' && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(selectedBlock.props?.autoplay)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, autoplay: e.target.checked } }))} /> Autoplay</label>
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedBlock.props?.showArrows !== false} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showArrows: e.target.checked } }))} /> Show arrows</label>
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(selectedBlock.props?.showDots)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showDots: e.target.checked } }))} /> Show dots</label>
                        <div className="flex items-center gap-2 text-xs">
                          <span>Interval (ms)</span>
                          <input className="border rounded px-1 py-0.5 w-24 text-xs" type="number" value={selectedBlock.props?.interval ?? 3000} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, interval: Math.max(1000, Number(e.target.value)) } }))} />
                        </div>
                      </div>
                    )}
                    <Typography variant="body2">Reviews ({Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items.length : 0})</Typography>
                    <Stack spacing={1}>
                      {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((it: any, i: number) => (
                        <Box key={i} sx={{ p: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar src={it.avatar} sx={{ width: 28, height: 28 }} />
                              <TextField size="small" fullWidth label="Avatar URL" value={it.avatar || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), avatar: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                              <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), avatar: u }; return { ...b, props: { ...b.props, items: arr } }; }); setMediaOpen(false); } })}>Pick</Button>
                              <Button variant="contained" component="label">Upload
                                <input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files || [])); if (u) updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), avatar: u }; return { ...b, props: { ...b.props, items: arr } }; }); }} />
                              </Button>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" label="Name" value={it.name || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), name: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                              <TextField size="small" fullWidth label="Review" value={it.text || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), text: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            </Stack>
                            <Button size="small" color="error" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, items: arr } }; })}>Remove review</Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                    <Button size="small" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, items: [ ...(b.props?.items || []), { avatar: '', name: '', text: '' } ] } }))}>Add review</Button>
                  </>
                )}
                {selectedBlock.type === 'ImageCarousel' && (
                  <>
                    <Typography variant="body2">Images ({(selectedBlock.props?.images || []).length})</Typography>
                    <Stack spacing={1}>
                      {(selectedBlock.props?.images || []).map((u: string, i: number) => (
                        <Stack key={`${u}-${i}`} direction="row" spacing={1} alignItems="center">
                          <TextField size="small" fullWidth value={u} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.images)? [...b.props.images]:[]; arr[i] = e.target.value; return { ...b, props: { ...b.props, images: arr } }; })} />
                          <Button size="small" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.images)? [...b.props.images]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, images: arr } }; })}>Remove</Button>
                        </Stack>
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, images: [ ...(b.props?.images || []), '' ] } }))}>Add URL row</Button>
                      <Button variant="outlined" onClick={() => setMediaOpen({ multi: true, onPick: (urls) => { updateSelected(b => ({ ...b, props: { ...b.props, images: [ ...(b.props?.images || []), ...urls ] } })); setMediaOpen(false); } })}>Pick images</Button>
                      <Button variant="contained" component="label">Upload
                        <input hidden multiple type="file" accept="image/*" onChange={async (e) => { const files = Array.from(e.target.files || []); const urls = await uploadFiles(files); updateSelected(b => ({ ...b, props: { ...b.props, images: [ ...(b.props?.images || []), ...urls ] } })); }} />
                      </Button>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.autoplay)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, autoplay: e.target.checked } }))} />} label="Autoplay" />
                      <TextField size="small" type="number" label="Interval (ms)" value={selectedBlock.props?.interval ?? 3000} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, interval: Math.max(1000, Number(e.target.value)) } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <FormControlLabel control={<Switch checked={selectedBlock.props?.showArrows !== false} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showArrows: e.target.checked } }))} />} label="Show arrows" />
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.showDots)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showDots: e.target.checked } }))} />} label="Show dots" />
                    </Stack>
                  </>
                )}
                {selectedBlock.type === 'RichText' && (
                  <TextField size="small" multiline minRows={4} label="HTML" value={selectedBlock.props?.html || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, html: e.target.value } }))} />
                )}
                {/* ProfileHeader editor (non-MUI inputs for main bits) */}
                {selectedBlock.type === 'ProfileHeader' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Display name</label>
                      <input className="w-full border rounded px-2 py-1 text-sm" value={selectedBlock.props?.name || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, name: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Bio</label>
                      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3} value={selectedBlock.props?.bio || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, bio: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Avatar URL</label>
                      <div className="flex gap-2">
                        <input className="flex-1 border rounded px-2 py-1 text-sm" value={selectedBlock.props?.avatar || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, avatar: e.target.value } }))} />
                        <button type="button" className="px-2 border rounded text-xs" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, avatar: u } })); setMediaOpen(false); } })}>Pick</button>
                        <label className="px-2 border rounded text-xs cursor-pointer">Upload<input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files||[])); if (u) updateSelected(b => ({ ...b, props: { ...b.props, avatar: u } })); }} /></label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Banner URL</label>
                      <div className="flex gap-2">
                        <input className="flex-1 border rounded px-2 py-1 text-sm" value={selectedBlock.props?.banner || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, banner: e.target.value } }))} />
                        <button type="button" className="px-2 border rounded text-xs" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, banner: u } })); setMediaOpen(false); } })}>Pick</button>
                        <label className="px-2 border rounded text-xs cursor-pointer">Upload<input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files||[])); if (u) updateSelected(b => ({ ...b, props: { ...b.props, banner: u } })); }} /></label>
                      </div>
                    </div>
                  </>
                )}

                {/* WhyChooseUs editor */}
                {selectedBlock.type === 'WhyChooseUs' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Title</label>
                      <input className="w-full border rounded px-2 py-1 text-sm" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Columns</label>
                      <input className="w-24 border rounded px-2 py-1 text-sm" type="number" value={selectedBlock.props?.cols ?? 3} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, cols: Math.max(1, Math.min(4, Number(e.target.value))) } }))} />
                    </div>
                    <Typography variant="body2">Points ({Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items.length : 0})</Typography>
                    <Stack spacing={1}>
                      {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((it: any, i: number) => (
                        <Box key={i} sx={{ p: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex gap-2 items-center">
                              <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Icon URL" value={it.icon || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), icon: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                              <button type="button" className="px-2 border rounded text-xs" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), icon: u }; return { ...b, props: { ...b.props, items: arr } }; }); setMediaOpen(false); } })}>Pick</button>
                              <label className="px-2 border rounded text-xs cursor-pointer">Upload<input hidden type="file" accept="image/*" onChange={async (e) => { const [u] = await uploadFiles(Array.from(e.target.files||[])); if (u) updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), icon: u }; return { ...b, props: { ...b.props, items: arr } }; }); }} /></label>
                            </div>
                            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Title" value={it.title || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), title: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2} placeholder="Description" value={it.desc || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr[i] = { ...(arr[i]||{}), desc: e.target.value }; return { ...b, props: { ...b.props, items: arr } }; })} />
                            <button type="button" className="px-2 py-1 border rounded text-xs" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.items)? [...b.props.items]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, items: arr } }; })}>Remove</button>
                          </div>
                        </Box>
                      ))}
                    </Stack>
                    <button type="button" className="mt-1 px-2 py-1 border rounded text-xs" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, items: [ ...(b.props?.items || []), { icon: '', title: '', desc: '' } ] } }))}>Add point</button>
                  </>
                )}

                {/* GallerySlider editor */}
                {selectedBlock.type === 'GallerySlider' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600">Title</label>
                      <input className="w-full border rounded px-2 py-1 text-sm" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    </div>
                    <div className="mt-1">
                      <div className="flex gap-2 text-xs">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(selectedBlock.props?.autoplay)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, autoplay: e.target.checked } }))} /> Autoplay</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={selectedBlock.props?.showArrows !== false} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showArrows: e.target.checked } }))} /> Show arrows</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(selectedBlock.props?.showDots)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showDots: e.target.checked } }))} /> Show dots</label>
                        <div className="flex items-center gap-2"><span>Interval</span><input className="w-24 border rounded px-1 py-0.5 text-xs" type="number" value={selectedBlock.props?.interval ?? 3000} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, interval: Math.max(1000, Number(e.target.value)) } }))} /></div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <label className="text-xs text-slate-600">Images</label>
                      <div className="flex gap-2">
                        <button type="button" className="px-2 border rounded text-xs" onClick={() => setMediaOpen({ multi: true, onPick: (urls) => { updateSelected(b => ({ ...b, props: { ...b.props, images: [ ...(b.props?.images || []), ...urls ] } })); setMediaOpen(false); } })}>Pick</button>
                        <label className="px-2 border rounded text-xs cursor-pointer">Upload<input hidden multiple type="file" accept="image/*" onChange={async (e) => { const urls = await uploadFiles(Array.from(e.target.files||[])); updateSelected(b => ({ ...b, props: { ...b.props, images: [ ...(b.props?.images || []), ...urls ] } })); }} /></label>
                      </div>
                      {(selectedBlock.props?.images || []).map((u: string, i: number) => (
                        <div key={`${u}-${i}`} className="flex items-center gap-2 text-xs">
                          <input className="flex-1 border rounded px-2 py-1" value={u} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.images)? [...b.props.images]:[]; arr[i] = e.target.value; return { ...b, props: { ...b.props, images: arr } }; })} />
                          <button type="button" className="px-2 border rounded" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.images)? [...b.props.images]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, images: arr } }; })}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {selectedBlock.type === 'ProductSlider' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <TextField size="small" type="number" label="Products to show" value={selectedBlock.props?.limit ?? 8} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, limit: Math.max(1, Number(e.target.value)) } }))} />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => { setProductTempSelected(Array.isArray(selectedBlock.props?.productIds) ? [...selectedBlock.props.productIds] : []); setProductsDialog({ mode: 'picker' }); }}>Open products</Button>
                      <Button size="small" variant="contained" onClick={() => setProductsDialog({ url: `/seller/products/new` })}>Create product</Button>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.autoplay)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, autoplay: e.target.checked } }))} />} label="Autoplay" />
                      <TextField size="small" type="number" label="Interval (ms)" value={selectedBlock.props?.interval ?? 3000} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, interval: Math.max(1000, Number(e.target.value)) } }))} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <FormControlLabel control={<Switch checked={selectedBlock.props?.showArrows !== false} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showArrows: e.target.checked } }))} />} label="Show arrows" />
                      <FormControlLabel control={<Switch checked={Boolean(selectedBlock.props?.showDots)} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, showDots: e.target.checked } }))} />} label="Show dots" />
                    </Stack>
                    <TextField size="small" multiline minRows={3} label="Product IDs (one per line)" value={(Array.isArray(selectedBlock.props?.productIds) ? selectedBlock.props.productIds : []).join("\n")} onChange={(e) => { const ids = e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean); updateSelected(b => ({ ...b, props: { ...b.props, productIds: ids } })); }} helperText="Optional: specify exact product IDs to show. Leave empty to show placeholders." />
                    {/* Non-MUI: show selected product names for clarity */}
                    {Array.isArray(selectedBlock.props?.productIds) && selectedBlock.props.productIds.length > 0 && (
                      <div className="mt-1 p-2 rounded border border-slate-200 bg-slate-50">
                        <div className="text-[11px] text-slate-600 mb-1">Selected products</div>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {selectedBlock.props.productIds.map((id: string) => (
                            <li key={id} className="text-xs"><span className="text-slate-500">{id.slice(0,6)}…</span> — {productNameCache[id] || 'loading…'}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {selectedBlock.type === 'Footer' && (
                  <>
                    <Typography variant="body2">Links</Typography>
                    <Stack spacing={1}>
                      {Array.isArray(selectedBlock.props?.links) ? selectedBlock.props.links.map((l: any, i: number) => (
                        <Stack key={i} direction="row" spacing={1}>
                          <TextField size="small" label="Label" value={l.label || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.links)? [...b.props.links]:[]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...b, props: { ...b.props, links: arr } }; })} />
                          <TextField size="small" label="Href" value={l.href || ''} onChange={(e) => updateSelected(b => { const arr = Array.isArray(b.props?.links)? [...b.props.links]:[]; arr[i] = { ...(arr[i]||{}), href: e.target.value }; return { ...b, props: { ...b.props, links: arr } }; })} />
                          <Button size="small" onClick={() => updateSelected(b => { const arr = Array.isArray(b.props?.links)? [...b.props.links]:[]; arr.splice(i,1); return { ...b, props: { ...b.props, links: arr } }; })}>Remove</Button>
                        </Stack>
                      )) : null}
                    </Stack>
                    <Button size="small" onClick={() => updateSelected(b => ({ ...b, props: { ...b.props, links: [ ...(b.props?.links || []), { label: '', href: '' } ] } }))}>Add link</Button>
                  </>
                )}

                {/* Custom CSS */}
                <TextField size="small" multiline minRows={4} label="Custom CSS (scoped)" value={selectedBlock.props?.customCss || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, customCss: e.target.value } }))} helperText="Injected into preview; use specific selectors to avoid conflicts" />
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {/* Context menu for blocks (canvas and list) */}
      <Menu
        open={!!menu.anchor}
        onClose={() => setMenu({ anchor: null })}
        anchorReference="anchorPosition"
        anchorPosition={menu.anchor ? { top: menu.anchor.y, left: menu.anchor.x } : undefined}
      >
        <MenuItem onClick={() => { const blk = (currentData.home?.blocks || []).find((x: any) => x.id === menu.blockId); if (blk) onEditBlock(blk); setMenu({ anchor: null }); }}>Edit code</MenuItem>
        <MenuItem onClick={() => { if (menu.blockId) duplicateBlock(menu.blockId); setMenu({ anchor: null }); }}>Duplicate</MenuItem>
        <MenuItem onClick={() => { if (menu.blockId) moveBlock(menu.blockId, -1); setMenu({ anchor: null }); }}>Move up</MenuItem>
        <MenuItem onClick={() => { if (menu.blockId) moveBlock(menu.blockId, 1); setMenu({ anchor: null }); }}>Move down</MenuItem>
        <MenuItem onClick={() => { if (menu.blockId) toggleHidden(menu.blockId); setMenu({ anchor: null }); }}>{(() => {
          const blk = (currentData.home?.blocks || []).find((x: any) => x.id === menu.blockId);
          return blk?.props?.hidden ? 'Show section' : 'Hide section';
        })()}</MenuItem>
        <MenuItem onClick={() => { if (menu.blockId) removeBlock(menu.blockId); setMenu({ anchor: null }); }} sx={{ color: 'error.main' }}>Delete section</MenuItem>
      </Menu>
    </Box>

    {/* Media Picker */}
    <Dialog open={!!mediaOpen} onClose={() => setMediaOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Select media {mediaOpen && mediaOpen.multi ? '(multiple allowed)' : ''}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2 }}>
        <Typography variant="body2">My uploads</Typography>
        <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1, maxHeight: '40vh', overflow: 'auto' }}>
          {mediaLoading ? (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1 }}>
              {mediaGallery.map((u) => (
                <Box key={u} sx={{ position: 'relative', cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid #e5e7eb' }} onClick={() => { mediaOpen && mediaOpen.onPick([u]); setMediaOpen(false); }}>
                  <img src={u} alt="upload" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                </Box>
              ))}
              {mediaGallery.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No uploads yet.</Typography>
              )}
            </Box>
          )}
        </Box>
        <Divider />
        <Typography variant="body2">Paste URLs or upload files</Typography>
        <TextField value={mediaUrlsInput} onChange={(e) => setMediaUrlsInput(e.target.value)} multiline minRows={4} fullWidth placeholder="https://...\nhttps://..." />
        {/* Previews for pasted/added URLs */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Preview</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1 }}>
            {mediaUrlsInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(u => (
              <Box key={u} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                <img src={u} alt="preview" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
              </Box>
            ))}
            {mediaUrlsInput.trim() === '' && (
              <Typography variant="caption" color="text.secondary">No URLs added yet.</Typography>
            )}
          </Box>
        </Box>
        <Button variant="contained" component="label">Upload images
          <input hidden multiple type="file" accept="image/*" onChange={async (e) => { const urls = await uploadFiles(Array.from(e.target.files || [])); setMediaUrlsInput(prev => (prev ? prev + "\n" : "") + urls.join("\n")); }} />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setMediaOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => { const urls = mediaUrlsInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean); mediaOpen && mediaOpen.onPick(urls); setMediaUrlsInput(""); setMediaOpen(false); }}>Use selected</Button>
      </DialogActions>
    </Dialog>

    {/* Products Picker */}
    <Dialog open={!!productsDialog} onClose={() => setProductsDialog(null)} maxWidth="md" fullWidth>
      <DialogTitle>Select products</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2 }}>
        {productsDialog?.mode === 'picker' ? (
          <>
            <TextField size="small" label="Search" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products" />
            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, maxHeight: '50vh', overflow: 'auto' }}>
              {productLoading ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
              ) : (
                <List dense>
                  {productResults.map((p: any) => {
                    const id = p._id || p.id;
                    const checked = productTempSelected.includes(id);
                    return (
                      <ListItemButton key={id} onClick={() => setProductTempSelected(prev => checked ? prev.filter(x => x !== id) : [...prev, id])}>
                        <Checkbox edge="start" tabIndex={-1} disableRipple checked={checked} sx={{ mr: 1 }} />
                        <Box sx={{ width: 40, height: 32, mr: 1, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
                          <img src={p.mainImage || (Array.isArray(p.images) ? p.images[0] : '') || '/product-placeholder.png'} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <ListItemText primary={p.title} secondary={`₹${Number(p.price ?? 0).toLocaleString()}`} />
                      </ListItemButton>
                    );
                  })}
                  {productResults.length === 0 && (
                    <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">No products found.</Typography></Box>
                  )}
                </List>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button disabled={productPage <= 1} onClick={() => setProductPage(p => Math.max(1, p - 1))}>Prev</Button>
              <Typography variant="caption">Page {productPage}</Typography>
              <Button disabled={!productHasMore} onClick={() => setProductPage(p => p + 1)}>Next</Button>
            </Box>
          </>
        ) : productsDialog?.url ? (
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden', height: '50vh' }}>
            <iframe src={productsDialog.url} style={{ width: '100%', height: '100%', border: 'none' }} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        {productsDialog?.mode === 'picker' ? (
          <>
            <Button onClick={() => setProductsDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={() => { updateSelected(b => ({ ...b, props: { ...b.props, productIds: productTempSelected } })); setProductsDialog(null); }}>Use selected ({productTempSelected.length})</Button>
          </>
        ) : (
          <Button onClick={() => setProductsDialog(null)}>Done</Button>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
}
