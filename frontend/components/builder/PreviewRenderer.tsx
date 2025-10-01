"use client";

import React from "react";
import { AppBar, Toolbar, Button, Container, Box, Typography, Card, CardMedia, TextField, Avatar, IconButton } from "@mui/material";
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

function HeaderBlock({ props }: any) {
  const menu = Array.isArray(props?.menu) ? props.menu : [];
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Header</Typography>
        {menu.map((m: any) => (
          <Button key={m.href || m.label} LinkComponent={Link} href={m.href || '#'} color="inherit" size="small">
            {m.label}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  );
}

function ImageCarouselBlock({ props }: any) {
  const images: string[] = Array.isArray(props?.images) ? props.images : [];
  return (
    <Container sx={{ my: 2 }}>
      {props?.title && <Typography variant="h6" sx={{ mb: 1 }}>{props.title}</Typography>}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
        {images.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt={`slide-${i}`} style={{ width: 220, height: 140, objectFit: 'cover', borderRadius: 8 }} />
        ))}
        {images.length === 0 && (
          <Typography variant="body2" color="text.secondary">Add images to props.images []</Typography>
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
        <img src={props?.image || "/product-placeholder.png"} alt={props?.name || "Product"} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
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
      <img src={props?.image || "/banner-placeholder.jpg"} alt="hero" style={{ width: "100%", height: 360, objectFit: "cover" }} />
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
  return (
    <Card sx={{ mb: 2 }}>
      <Link href={props?.href || "#"}>
        <CardMedia component="img" src={props?.image || "/banner-placeholder.jpg"} alt={props?.alt || "Banner"} sx={{ height: 200 }} />
      </Link>
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

export default function PreviewRenderer({ data, editorMode = false, onEditBlock, onOpenMenu, onSelectBlock, selectedId, onOpenProducts }: { data: BuilderData; editorMode?: boolean; onEditBlock?: (block: any) => void; onOpenMenu?: (block: any, anchor: { x: number; y: number }) => void; onSelectBlock?: (block: any) => void; selectedId?: string; onOpenProducts?: (url: string) => void }) {
  const blocks = data?.home?.blocks || [];
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
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
                <HeaderBlock props={b.props} />
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
                <Container sx={{ my: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{b.props?.title || "Products"}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
                    {Array.from({ length: Math.max(1, Number(b.props?.limit ?? 8)) }).map((_, i) => (
                      <Card key={i} sx={{ minWidth: 180, p: 1, cursor: editorMode ? 'pointer' : 'default' }} onClick={(e) => { e.stopPropagation(); onOpenProducts && onOpenProducts('/seller/products/new'); }}>
                        <CardMedia component="img" src={b.props?.placeholderImage || '/product-placeholder.png'} sx={{ height: 110, borderRadius: 1 }} />
                        <Typography variant="body2" sx={{ mt: 0.5 }}>New product</Typography>
                        <Button variant="outlined" size="small" sx={{ mt: 0.5 }} onClick={(e) => { e.stopPropagation(); onOpenProducts && onOpenProducts('/seller/products/new'); }}>Add</Button>
                      </Card>
                    ))}
                  </Box>
                </Container>
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
