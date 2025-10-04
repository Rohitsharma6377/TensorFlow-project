"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProductAPI, type ProductDTO } from "@/lib/api";
import { AppBar, Toolbar, Button, Container, Box, Typography, Card, CardMedia, TextField, Avatar, IconButton, useMediaQuery, Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";

export type BuilderData = {
  home?: { blocks?: Array<{ id: string; type: string; props?: any }> };
};

function hexToRgba(hex?: string, alpha: number = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function HeaderBlock({ props, device }: any) {
  const menu = Array.isArray(props?.menu) ? props.menu : [];
  const mqMobile = useMediaQuery('(max-width: 600px)');
  const isMobile = device === 'mobile' ? true : mqMobile;
  const [open, setOpen] = useState(false);
  const getContainer = () => (typeof document !== 'undefined' ? document.getElementById('previewRoot') as any : undefined);
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>{props?.title || 'Header'}</Typography>
        {!isMobile && menu.map((m: any) => (
          <Button key={m.href || m.label} LinkComponent={Link} href={m.href || '#'} color="inherit" size="small">
            {m.label}
          </Button>
        ))}
        {isMobile && (
          <IconButton edge="end" onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      {/* Mobile drawer */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} container={getContainer} ModalProps={{ keepMounted: true }} hideBackdrop disablePortal
        PaperProps={{ sx: { width: 260, boxShadow: 3 } }}
      >
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setOpen(false)}>
          <List>
            {menu.map((m: any) => (
              <ListItemButton key={m.href || m.label} component={Link as any} href={m.href || '#'}>
                <ListItemText primary={m.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

function ImageCarouselBlock({ props }: any) {
  const images: string[] = Array.isArray(props?.images) ? props.images : [];
  const autoplay: boolean = Boolean(props?.autoplay);
  const interval: number = Math.max(1000, Number(props?.interval ?? 3000));
  const showArrows: boolean = props?.showArrows !== false; // default true
  const showDots: boolean = Boolean(props?.showDots);

  const [index, setIndex] = useState(0);
  const timerRef = useRef<any>(null);
  const count = images.length;

  const goTo = (i: number) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoplay, interval, count]);

  return (
    <Container sx={{ my: 2 }}>
      {props?.title && <Typography variant="h6" sx={{ mb: 1 }}>{props.title}</Typography>}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ width: '100%', height: 200, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
          {count > 0 ? (
            <img src={images[index]} alt={`slide-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Typography variant="body2" color="text.secondary">Add images to props.images []</Typography>
          )}
        </Box>
        {showArrows && count > 1 && (
          <>
            <Button size="small" variant="contained" onClick={prev} sx={{ minWidth: 0, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>{"<"}</Button>
            <Button size="small" variant="contained" onClick={next} sx={{ minWidth: 0, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>{">"}</Button>
          </>
        )}
        {showDots && count > 1 && (
          <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {images.map((_, i) => (
              <Box key={i} onClick={() => goTo(i)} sx={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', bgcolor: i === index ? 'primary.main' : '#d1d5db' }} />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}

function TopBarBlock({ props }: any) {
  const text = props?.text || "Welcome to our store";
  return (
    <Box sx={{ bgcolor: props?.bg || "#0ea5e9", color: props?.color || "#fff", py: 0.5, px: 2, textAlign: "center" }}>
      <Typography variant="caption">{text}</Typography>
    </Box>
  );
}

function FAQBlock({ props }: any) {
  const items = Array.isArray(props?.items) ? props.items : [];
  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{props?.title || "FAQs"}</Typography>
      <Box>
        {items.map((q: any, idx: number) => (
          <Box key={idx} sx={{ py: 1.5, borderTop: idx ? "1px solid #eee" : "none" }}>
            <Typography fontWeight={600}>{q.q}</Typography>
            <Typography variant="body2" color="text.secondary">{q.a}</Typography>
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary">Add questions in props.items</Typography>
        )}
      </Box>
    </Container>
  );
}

function TestimonialsBlock({ props }: any) {
  const items = Array.isArray(props?.items) ? props.items : [];
  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{props?.title || "Testimonials"}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {items.map((t: any, idx: number) => (
          <Card key={idx} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar src={t.avatar} sx={{ width: 32, height: 32 }} />
              <Typography variant="subtitle2">{t.name || 'Customer'}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{t.text || 'Great products!'}</Typography>
          </Card>
        ))}
        {items.length === 0 && (
          <Box><Typography variant="body2" color="text.secondary">Add testimonials in props.items</Typography></Box>
        )}
      </Box>
    </Container>
  );
}

function ContactFormBlock({ props }: any) {
  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{props?.title || "Contact us"}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField fullWidth size="small" label="Name" placeholder="Your name" />
        <TextField fullWidth size="small" label="Email" placeholder="you@example.com" />
        <TextField fullWidth size="small" label="Message" placeholder="How can we help?" multiline minRows={4} sx={{ gridColumn: '1 / -1' }} />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Button variant="contained">Send</Button>
        </Box>
      </Box>
    </Container>
  );
}

function FeaturedProductBlock({ props }: any) {
  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{props?.title || "Featured product"}</Typography>
      <Card sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'inherit', color: 'inherit' }}>
        <img src={props?.image || "https://dummyimage.com/300x300/e5e7eb/111827&text=Product"} alt={props?.name || "Product"} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600}>{props?.name || 'Product name'}</Typography>
          {props?.price && <Typography color="primary" fontWeight={700}>₹{Number(props.price).toLocaleString()}</Typography>}
          <Button variant="contained" size="small" sx={{ mt: 1 }}>Add to cart</Button>
        </Box>
      </Card>
    </Container>
  );
}

function HeroBlock({ props }: any) {
  return (
    <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", mb: 2 }}>
      <img src={props?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=60&auto=format&fit=crop"} alt="hero" style={{ width: "100%", height: 360, objectFit: "cover" }} />
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: hexToRgba(props?.overlayColor || '#000000', Number(props?.overlayOpacity ?? 0.25)) }}>
        <Box sx={{ textAlign: "center", color: props?.color || "#fff" }}>
          <Typography variant="h3" fontWeight={800}>{props?.heading || "Welcome"}</Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>{props?.subheading || "Start building"}</Typography>
          {props?.ctaHref && (
            <Button LinkComponent={Link} href={props.ctaHref} variant="contained" color="primary" sx={{ mt: 2 }}>
              {props?.ctaText || "Shop now"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function BannerBlock({ props }: any) {
  const slides: any[] = Array.isArray(props?.slides) ? props.slides : [];
  const autoplay: boolean = Boolean(props?.autoplay);
  const interval: number = Math.max(1000, Number(props?.interval ?? 3000));
  const showArrows: boolean = props?.showArrows !== false; // default true
  const showDots: boolean = Boolean(props?.showDots);

  // Backward compat: single banner if no slides
  if (!slides.length) {
    return (
      <Card sx={{ mb: 2, position: 'relative' }}>
        <Link href={props?.href || "#"}>
          <CardMedia component="img" src={props?.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=60&auto=format&fit=crop"} alt={props?.alt || "Banner"} sx={{ height: 200 }} />
        </Link>
      </Card>
    );
  }

  const [index, setIndex] = useState(0);
  const timerRef = useRef<any>(null);
  const count = slides.length;
  const goTo = (i: number) => setIndex(((i % count) + count) % count);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoplay, interval, count]);

  const slide = slides[index] || {};
  const content = (
    <Box sx={{ position: 'relative' }}>
      <CardMedia component="img" src={slide.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=60&auto=format&fit=crop"} alt={slide.alt || "Banner"} sx={{ height: 200 }} />
      {(slide.ctaText || slide.ctaHref) && (
        <Box sx={{ position: 'absolute', bottom: 12, right: 12 }}>
          <Button LinkComponent={Link} href={slide.ctaHref || '#'} variant="contained" size="small">{slide.ctaText || 'Learn more'}</Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      {slide.href ? (
        <Link href={slide.href}>{content}</Link>
      ) : content}
      {showArrows && count > 1 && (
        <>
          <Button size="small" variant="contained" onClick={prev} sx={{ minWidth: 0, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>{"<"}</Button>
          <Button size="small" variant="contained" onClick={next} sx={{ minWidth: 0, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>{">"}</Button>
        </>
      )}
      {showDots && count > 1 && (
        <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', gap: 1, justifyContent: 'center' }}>
          {slides.map((_, i) => (
            <Box key={i} onClick={() => goTo(i)} sx={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', bgcolor: i === index ? 'primary.main' : '#d1d5db' }} />
          ))}
        </Box>
      )}
    </Card>
  );
}

function RichTextBlock({ props }: any) {
  return (
    <Container sx={{ my: 2 }}>
      <div dangerouslySetInnerHTML={{ __html: String(props?.html || "") }} />
    </Container>
  );
}

function BlogGridBlock({ props }: any) {
  const items: Array<{ image?: string; title?: string; excerpt?: string; href?: string; slug?: string }> = Array.isArray(props?.items) ? props.items : [];
  const title = props?.title || 'Blog';
  const cols = Math.max(1, Math.min(4, Number(props?.cols ?? 3)));
  const layout: 'grid' | 'featured' = props?.layout === 'featured' ? 'featured' : 'grid';

  const card = (it: any, key: number, mediaHeight = 140) => {
    const url = it.href || (it.slug ? `/blogs/${it.slug}` : undefined);
    const inner = (
      <Card sx={{ overflow: 'hidden', height: '100%' }}>
        {it.image && <CardMedia component="img" src={it.image} alt={it.title || 'post'} sx={{ height: mediaHeight }} />}
        <Box sx={{ p: 1.25 }}>
          <Typography variant="subtitle2" noWrap title={it.title}>{it.title || 'Post title'}</Typography>
          {it.excerpt && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{it.excerpt}</Typography>}
          {url && <Button LinkComponent={Link} href={url} size="small" sx={{ mt: 0.75 }}>Read more</Button>}
        </Box>
      </Card>
    );
    return url ? <Box key={key} component={Link as any} href={url} sx={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Box> : <Box key={key}>{inner}</Box>;
  };

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      {layout === 'featured' && items.length >= 3 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          <Box>
            {card(items[0], 0, 220)}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
            {card(items[1], 1)}
            {card(items[2], 2)}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${cols}, minmax(0,1fr))` }, gap: 2 }}>
          {items.map((it, idx) => card(it, idx))}
          {items.length === 0 && (
            <Box sx={{ p: 2, border: '1px dashed #e5e7eb', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">Add posts in the inspector.</Typography>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}

function BlogPostBlock({ props }: any) {
  const title = props?.title || 'Blog title';
  const author = props?.author || '';
  const date = props?.date || '';
  const image = props?.image;
  const html = String(props?.html || '<p>Write your blog content...</p>');
  return (
    <Container sx={{ my: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{title}</Typography>
      {(author || date) && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {author}{author && date ? ' · ' : ''}{date}
        </Typography>
      )}
      {image && <CardMedia component="img" src={image} alt={title} sx={{ borderRadius: 1, mb: 2 }} />}
      <Box dangerouslySetInnerHTML={{ __html: html }} />
    </Container>
  );
}

function FooterBlock({ props }: any) {
  const links = Array.isArray(props?.links) ? props.links : [];
  return (
    <Box component="footer" sx={{ borderTop: "1px solid #eee", py: 3, mt: 4 }}>
      <Container sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {links.map((l: any) => (
          <Button key={l.href} LinkComponent={Link} href={l.href} size="small" color="inherit">{l.label}</Button>
        ))}
        <Box sx={{ ml: "auto" }}>
          <Typography variant="caption">© {new Date().getFullYear()} Your Brand</Typography>
        </Box>
      </Container>
    </Box>
  );
}

function ProductSliderBlock({ props, editorMode = false, onOpenProducts }: any) {
  const limit = Math.max(1, Number(props?.limit ?? 8));
  const productIds: string[] = Array.isArray(props?.productIds) ? props.productIds : [];
  const autoplay: boolean = Boolean(props?.autoplay);
  const interval: number = Math.max(1000, Number(props?.interval ?? 3000));
  const showArrows: boolean = props?.showArrows !== false; // default true
  const showDots: boolean = Boolean(props?.showDots);

  const [products, setProducts] = useState<Array<ProductDTO & { _id: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (productIds.length === 0) { setProducts(null); return; }
      try {
        setLoading(true);
        // 1) Try batch list with ids param if backend supports it (harmless if ignored)
        try {
          const res: any = await ProductAPI.list({ ids: productIds.join(',') });
          const arr = (res?.products || res) as any[];
          if (Array.isArray(arr) && arr.length) {
            if (!cancelled) setProducts(arr as any);
            return;
          }
        } catch {}

        // 2) Fallback: limited concurrency per-id fetch, tolerate 429s
        const limit = 2;
        const queue = [...productIds];
        const fetched: Array<ProductDTO & { _id: string }> = [] as any;
        async function worker() {
          while (queue.length && !cancelled) {
            const id = queue.shift()!;
            try {
              const res = await ProductAPI.get(id);
              const p = (res as any)?.product || (res as any);
              if (p) fetched.push(p as any);
            } catch (e: any) {
              // On 429, back off a bit
              const status = (e && (e as any).status) || 0;
              if (status === 429) {
                await new Promise(r => setTimeout(r, 500));
                queue.unshift(id);
              }
            }
          }
        }
        await Promise.all(Array.from({ length: limit }).map(() => worker()));
        if (!cancelled) setProducts(fetched);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productIds]);

  const items = useMemo(() => {
    if (products && products.length) {
      return products.map((p) => ({
        id: (p as any)._id || (p as any).id,
        name: p.title,
        image: p.mainImage || (Array.isArray(p.images) ? p.images[0] : undefined) || props?.placeholderImage || 'https://dummyimage.com/300x300/e5e7eb/111827&text=Product',
        price: Number((p as any).price ?? 0),
        mrp: Number((p as any).mrp ?? 0),
        discount: (p as any).discount,
      }));
    }
    // placeholders
    return Array.from({ length: limit }).map((_, i) => ({ id: `new-${i}`, name: 'New product', image: props?.placeholderImage || 'https://dummyimage.com/300x300/e5e7eb/111827&text=Product', price: undefined, mrp: undefined, discount: undefined }));
  }, [products, limit, props?.placeholderImage]);

  const [index, setIndex] = useState(0);
  const timerRef = useRef<any>(null);
  const count = items.length;

  const goTo = (i: number) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoplay, interval, count]);

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{props?.title || 'Products'}</Typography>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', transition: 'transform .3s ease', transform: `translateX(-${index * 220}px)` }}>
            {items.map((p, i) => {
              const hasDiscountField = p.discount && (p.discount.type === 'percent' || p.discount.type === 'fixed');
              const discountPercent = hasDiscountField
                ? (p.discount.type === 'percent' ? Number(p.discount.value) : (p.mrp && p.mrp > 0 ? Math.round(((p.mrp - (p.price ?? 0)) / p.mrp) * 100) : undefined))
                : (p.mrp && p.price && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : undefined);
              const showBadge = typeof discountPercent === 'number' && discountPercent > 0;
              return (
                <Card key={p.id || i} sx={{ position: 'relative', minWidth: 220, maxWidth: 220, p: 1, mr: 1, cursor: editorMode ? 'pointer' : 'default' }} onClick={(e) => { if (editorMode && productIds.length === 0) { e.stopPropagation(); onOpenProducts && onOpenProducts('/seller/products'); } }}>
                  {showBadge && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'error.main', color: '#fff', px: 0.75, py: 0.25, borderRadius: 1, fontSize: 12, fontWeight: 700 }}>
                      -{discountPercent}%
                    </Box>
                  )}
                  <CardMedia component="img" src={p.image} sx={{ height: 120, borderRadius: 1 }} />
                  <Typography variant="body2" sx={{ mt: 0.5 }} noWrap title={p.name}>{p.name}</Typography>
                  {p.price !== undefined ? (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="subtitle2" color="primary" fontWeight={700}>₹{Number(p.price).toLocaleString()}</Typography>
                      {p.mrp && p.mrp > p.price && (
                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>₹{Number(p.mrp).toLocaleString()}</Typography>
                      )}
                    </Box>
                  ) : (
                    editorMode && productIds.length === 0 && (
                      <Button variant="outlined" size="small" sx={{ mt: 0.5 }} onClick={(e) => { e.stopPropagation(); onOpenProducts && onOpenProducts('/seller/products/new'); }}>Add</Button>
                    )
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
        {showArrows && count > 1 && (
          <>
            <Button size="small" variant="contained" onClick={prev} sx={{ minWidth: 0, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>{"<"}</Button>
            <Button size="small" variant="contained" onClick={next} sx={{ minWidth: 0, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>{">"}</Button>
          </>
        )}
        {showDots && count > 1 && (
          <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {items.map((_, i) => (
              <Box key={i} onClick={() => goTo(i)} sx={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', bgcolor: i === index ? 'primary.main' : '#d1d5db' }} />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default function PreviewRenderer({ data, editorMode = false, onEditBlock, onOpenMenu, onSelectBlock, selectedId, onOpenProducts, device }: { data: BuilderData; editorMode?: boolean; onEditBlock?: (block: any) => void; onOpenMenu?: (block: any, anchor: { x: number; y: number }) => void; onSelectBlock?: (block: any) => void; selectedId?: string; onOpenProducts?: (url: string) => void; device?: 'desktop' | 'tablet' | 'mobile' }) {
  const blocks = data?.home?.blocks || [];
  return (
    <Box id="previewRoot" sx={{ position: 'relative', border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
      {/* Custom CSS from blocks */}
      {blocks.some((b: any) => b?.props?.customCss) && (
        <style dangerouslySetInnerHTML={{ __html: blocks.map((b: any) => b?.props?.customCss).filter(Boolean).join("\n") }} />
      )}
      {blocks.map((b) => {
        const outline = editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none';
        const border = b?.props?.borderWidth ? `${b.props.borderWidth}px solid ${b?.props?.borderColor || '#e5e7eb'}` : undefined;
        const radius = b?.props?.radius;
        const padding = b?.props?.p;
        const bgcolor = b?.props?.bg;
        const color = b?.props?.color;
        switch (b.type) {
          case "TopBar":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline, cursor: editorMode ? 'pointer' : 'default', p: padding, border, borderRadius: radius, bgcolor, color }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <TopBarBlock props={b.props} />
              </Box>
            );
          case "Header":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <HeaderBlock props={b.props} device={device} />
              </Box>
            );
          case "Hero":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <HeroBlock props={b.props} />
              </Box>
            );
          case "Banner":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <BannerBlock props={b.props} />
              </Box>
            );
          case "RichText":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <RichTextBlock props={b.props} />
              </Box>
            );
          case "ProductSlider":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <ProductSliderBlock props={b.props} editorMode={editorMode} onOpenProducts={onOpenProducts} />
              </Box>
            );
          case "Footer":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <FooterBlock props={b.props} />
              </Box>
            );
          case "FAQ":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <FAQBlock props={b.props} />
              </Box>
            );
          case "Testimonials":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <TestimonialsBlock props={b.props} />
              </Box>
            );
          case "ContactForm":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <ContactFormBlock props={b.props} />
              </Box>
            );
          case "FeaturedProduct":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <FeaturedProductBlock props={b.props} />
              </Box>
            );
          case "ImageCarousel":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <ImageCarouselBlock props={b.props} />
              </Box>
            );
          case "BlogGrid":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <BlogGridBlock props={b.props} />
              </Box>
            );
          case "BlogPost":
            return (
              <Box key={b.id} sx={{ position: "relative", opacity: b?.props?.hidden ? 0.4 : 1, outline: editorMode && selectedId===b.id ? '2px solid #3b82f6' : 'none', cursor: editorMode ? 'pointer' : 'default', bgcolor, color, p: padding, border, borderRadius: radius }} onClick={() => editorMode && onSelectBlock && onSelectBlock(b)} onContextMenu={(e) => { if (editorMode) { e.preventDefault(); onEditBlock && onEditBlock(b); } }}>
                {editorMode && (
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, zIndex: 10, bgcolor: 'white' }} onClick={(e) => onOpenMenu && onOpenMenu(b, { x: e.clientX, y: e.clientY })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
                <BlogPostBlock props={b.props} />
              </Box>
            );
          default:
            return (
              <Container key={b.id} sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">Unknown block: {b.type}</Typography>
              </Container>
            );
        }
      })}
    </Box>
  );
}
