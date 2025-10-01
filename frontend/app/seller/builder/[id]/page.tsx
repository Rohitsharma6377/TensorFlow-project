"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Container, AppBar, Toolbar, IconButton, Typography, Button, Drawer, List, ListItemButton, ListItemText, Divider, Stack, Menu, MenuItem, Select, FormControl, InputLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButtonGroup, ToggleButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import PreviewRenderer, { type BuilderData } from "@/components/builder/PreviewRenderer";

type AllData = BuilderData & { product?: any; products?: any };

export default function BuilderPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const qs = useSearchParams();
  const isEditor = qs?.get("editor") === "1";
  const [raw, setRaw] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ anchor: null | { x: number; y: number }; blockId?: string }>({ anchor: null });
  const [template, setTemplate] = useState<string>(qs?.get("template") || "home");
  const [selectedId, setSelectedId] = useState<string>("");
  const [mediaOpen, setMediaOpen] = useState<false | { multi: boolean; onPick: (urls: string[]) => void }>(false);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [mediaUrlsInput, setMediaUrlsInput] = useState<string>("");
  const [productsDialog, setProductsDialog] = useState<null | { url: string }>(null);

  const load = () => {
    try {
      const key = `builder:${id}`;
      const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      setRaw(v);
    } catch {
      setRaw(null);
    }
  };

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
    for (const f of files) {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', 'builder');
      const res = await fetch(`/api/v1/uploads`, { method: 'POST', body: fd as any });
      try { const data = await res.json(); urls.push(data?.url || data?.secure_url || data?.location || data?.path); } catch { }
    }
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
      type === "ProductSlider" ? { id: idGen, type: "ProductSlider", props: { title: "Products", limit: 8 } } :
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f9", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>Theme Editor</Typography>
          <Button onClick={load} sx={{ mr: 1 }}>Reload</Button>
          <Button variant="outlined" onClick={loadDemo}>Load demo content</Button>
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
        <Drawer variant="permanent" open PaperProps={{ sx: { position: "relative", width: 280, overflow: 'hidden', overscrollBehavior: 'none' } }}>
          <Toolbar />
          <Box sx={{ p: 2, overscrollBehavior: 'none' }} onWheel={(e) => { const el = document.getElementById('canvasScroll'); if (el) { e.preventDefault(); el.scrollBy({ top: e.deltaY }); } }}>
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
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("TopBar")}>TopBar</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Header", "0")}>Header (v1)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Header", "1")}>Header (v2)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Hero")}>Hero</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Banner", "0")}>Banner (v1)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Banner", "1")}>Banner (v2)</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ImageCarousel")}>Image Carousel</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ProductSlider")}>ProductSlider</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("FeaturedProduct")}>Featured Product</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("FAQ")}>FAQ</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Testimonials")}>Testimonials</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("ContactForm")}>Contact Form</Button>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addSection("Footer")}>Footer</Button>
            </Stack>
          </Box>
        </Drawer>

        {/* Canvas */}
        <Box id="canvasScroll" sx={{ flex: 1, p: 3, overflow: "auto", display: 'flex', justifyContent: 'center', overscrollBehavior: 'contain' }}>
          <Box sx={{ width: device==='desktop'? 1200 : device==='tablet'? 834 : 390, transition: 'width .2s ease', border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fff' }}>
          {!id && (
            <Typography color="text.secondary">Invalid preview id.</Typography>
          )}
          {id && raw === null && (
            <Typography color="text.secondary">No data found in localStorage for key <code>builder:{id}</code>.</Typography>
          )}
          {allData && (
            <PreviewRenderer data={currentData} editorMode={isEditor} onEditBlock={onEditBlock} onOpenMenu={(blk, anchor) => setMenu({ anchor, blockId: blk.id })} onSelectBlock={(b) => setSelectedId(b.id)} selectedId={selectedId} onOpenProducts={(url) => setProductsDialog({ url })} />
          )}
          </Box>
        </Box>

        {/* Inspector */}
        {isEditor && (
          <Box sx={{ width: 340, borderLeft: '1px solid #e5e7eb', p: 2, bgcolor: '#fff', overflow: 'hidden', overscrollBehavior: 'none' }} onWheel={(e) => { const el = document.getElementById('canvasScroll'); if (el) { e.preventDefault(); el.scrollBy({ top: e.deltaY }); } }}>
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
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" fullWidth label="Image URL" value={selectedBlock.props?.image || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, image: e.target.value } }))} />
                    <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); setMediaOpen(false); } })}>Pick</Button>
                  </Stack>
                )}
                {selectedBlock.type === 'Banner' && (
                  <TextField size="small" label="Link href" value={selectedBlock.props?.href || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, href: e.target.value } }))} />
                )}
                {selectedBlock.type === 'FeaturedProduct' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <TextField size="small" label="Name" value={selectedBlock.props?.name || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, name: e.target.value } }))} />
                    <TextField size="small" type="number" label="Price" value={selectedBlock.props?.price ?? ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, price: Number(e.target.value) } }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" fullWidth label="Image URL" value={selectedBlock.props?.image || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, image: e.target.value } }))} />
                      <Button variant="outlined" onClick={() => setMediaOpen({ multi: false, onPick: (urls) => { const [u] = urls; updateSelected(b => ({ ...b, props: { ...b.props, image: u } })); setMediaOpen(false); } })}>Pick</Button>
                    </Stack>
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
                  </>
                )}
                {selectedBlock.type === 'RichText' && (
                  <TextField size="small" multiline minRows={4} label="HTML" value={selectedBlock.props?.html || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, html: e.target.value } }))} />
                )}
                {selectedBlock.type === 'ProductSlider' && (
                  <>
                    <TextField size="small" label="Title" value={selectedBlock.props?.title || ''} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, title: e.target.value } }))} />
                    <TextField size="small" type="number" label="Products to show" value={selectedBlock.props?.limit ?? 8} onChange={(e) => updateSelected(b => ({ ...b, props: { ...b.props, limit: Math.max(1, Number(e.target.value)) } }))} />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => setProductsDialog({ url: `/seller/products` })}>Open products</Button>
                      <Button size="small" variant="contained" onClick={() => setProductsDialog({ url: `/seller/products/new` })}>Create product</Button>
                    </Stack>
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
    <Dialog open={!!mediaOpen} onClose={() => setMediaOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Select media {mediaOpen && mediaOpen.multi ? '(multiple allowed)' : ''}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>Paste one or more image URLs (one per line), or upload files.</Typography>
        <TextField value={mediaUrlsInput} onChange={(e) => setMediaUrlsInput(e.target.value)} multiline minRows={4} fullWidth placeholder="https://...\nhttps://..." sx={{ mb: 2 }} />
        <Button variant="contained" component="label">Upload images
          <input hidden multiple type="file" accept="image/*" onChange={async (e) => { const urls = await uploadFiles(Array.from(e.target.files || [])); setMediaUrlsInput(prev => (prev ? prev + "\n" : "") + urls.join("\n")); }} />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setMediaOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => { const urls = mediaUrlsInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean); mediaOpen && mediaOpen.onPick(urls); setMediaUrlsInput(""); setMediaOpen(false); }}>Use selected</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
