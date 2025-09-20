"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type React from "react";
import { useState, useMemo, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api/v1";

// Using hosted demo assets so previews work immediately.
// Replace with local /icons/3d/*.glb files later if you add them under frontend/public/
const ICON_PRESETS: { id: string; label: string; url: string }[] = [
  { id: "bag", label: "Shopping Bag", url: "https://modelviewer.dev/shared-assets/models/Astronaut.glb" },
  { id: "shirt", label: "Clothes", url: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb" },
  { id: "bolt", label: "Electronics", url: "https://modelviewer.dev/shared-assets/models/MaterialsHelmet.glb" },
  { id: "sofa", label: "Furniture", url: "https://modelviewer.dev/shared-assets/models/Chair.glb" },
  { id: "food", label: "Food", url: "https://modelviewer.dev/shared-assets/models/ShopifyModels/Chair/glb/Chair.glb" },
];

const SHOP_TYPES = [
  "electronics",
  "clothing",
  "home",
  "beauty",
  "grocery",
  "sports",
  "books",
  "toys",
  "automotive",
  "other",
];

export default function SellerShopProfilePage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shopId, setShopId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("#10b981"); // emerald
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [social, setSocial] = useState({ facebook: "", instagram: "", twitter: "", youtube: "" });

  const [address, setAddress] = useState({ street: "", city: "", state: "", country: "India", pincode: "" });
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>("");

  const [icon3d, setIcon3d] = useState<string>(ICON_PRESETS[0].url);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : existingLogoUrl), [logoFile, existingLogoUrl]);
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : existingBannerUrl), [bannerFile, existingBannerUrl]);

  // Prefill if user has a shop (edit mode)
  useEffect(() => {
    async function loadMyShop() {
      try {
        const res = await fetch(`${API_BASE}/shops/my`, { credentials: "include" });
        if (!res.ok) return; // No shop yet
        const data = await res.json();
        const s = data.shop;
        if (!s) return;
        setShopId(s._id);
        setName(s.name || "");
        setDescription(s.description || "");
        setThemeColor((s.metadata && s.metadata.themeColor) || "#10b981");
        setCategories(Array.isArray(s.categories) ? s.categories : []);
        setTags(Array.isArray(s.tags) ? s.tags.join(", ") : "");
        setContactEmail(s.contact?.email || "");
        setContactPhone(s.contact?.phone || "");
        setWebsite(s.contact?.website || "");
        setSocial({
          facebook: s.contact?.social?.facebook || "",
          instagram: s.contact?.social?.instagram || "",
          twitter: s.contact?.social?.twitter || "",
          youtube: s.contact?.social?.youtube || "",
        });
        setAddress({
          street: s.address?.street || "",
          city: s.address?.city || "",
          state: s.address?.state || "",
          country: s.address?.country || "India",
          pincode: s.address?.pincode || "",
        });
        const coords = s.address?.location?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          setLng(typeof coords[0] === 'number' ? coords[0] : "");
          setLat(typeof coords[1] === 'number' ? coords[1] : "");
        }
        setIcon3d((s.metadata && s.metadata.icon3d) || ICON_PRESETS[0].url);
        setExistingLogoUrl(s.logo?.url || null);
        setExistingBannerUrl(s.banner?.url || null);
        if (s.metadata?.mapsUrl) {
          setGoogleMapsUrl(s.metadata.mapsUrl as string);
        } else if (Array.isArray(s.address?.location?.coordinates) && s.address.location.coordinates.length === 2) {
          const lt = s.address.location.coordinates[1];
          const lg = s.address.location.coordinates[0];
          if (typeof lt === 'number' && typeof lg === 'number') {
            setGoogleMapsUrl(`https://www.google.com/maps?q=${lt},${lg}`);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    loadMyShop();
  }, []);

  // Parse lat/lng from a Google Maps URL if possible
  useEffect(() => {
    if (!googleMapsUrl) return;
    let newLat: number | '' = '';
    let newLng: number | '' = '';
    try {
      // Patterns: https://maps.google.com/...@lat,lng, or ...?q=lat,lng
      const atMatch = googleMapsUrl.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      const qMatch = googleMapsUrl.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      const coords = atMatch || qMatch;
      if (coords && coords.length >= 3) {
        const lt = parseFloat(coords[1]);
        const lg = parseFloat(coords[2]);
        if (!Number.isNaN(lt) && !Number.isNaN(lg)) {
          newLat = Number(lt.toFixed(6));
          newLng = Number(lg.toFixed(6));
        }
      }
    } catch {}
    setLat(newLat);
    setLng(newLng);
  }, [googleMapsUrl]);

  async function uploadAsset(file: File, folder = "shops") {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Upload failed");
    }
    const data = await res.json();
    // Map to { url, publicId }
    return { url: data.url, publicId: data.key } as { url: string; publicId: string };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (!name.trim()) throw new Error("Please enter a shop name");

      // Upload assets first if provided
      let logo: { url: string; publicId: string } | undefined;
      let banner: { url: string; publicId: string } | undefined;
      if (logoFile) logo = await uploadAsset(logoFile, "shops/logos");
      if (bannerFile) banner = await uploadAsset(bannerFile, "shops/banners");

      const payload: any = {
        name,
        description,
        themeColor,
        categories,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        website: website || undefined,
        contact: { social },
        address: {
          ...address,
          ...(typeof lat === 'number' && typeof lng === 'number'
            ? { location: { type: 'Point', coordinates: [Number(lng), Number(lat)] } }
            : {}),
        },
        icon3d,
        metadata: {
          mapsUrl: googleMapsUrl || undefined,
        },
        ...(logo ? { logo } : {}),
        ...(banner ? { banner } : {}),
      };

      const url = shopId ? `${API_BASE}/shops/${shopId}` : `${API_BASE}/shops`;
      const method = shopId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save shop");
      setSuccess(shopId ? "Shop updated" : "Shop created (pending approval)");
      // refresh from DB so previews and IDs are in sync
      try {
        const myRes = await fetch(`${API_BASE}/shops/my`, { credentials: "include" });
        if (myRes.ok) {
          const data = await myRes.json();
          const s = data.shop;
          setShopId(s?._id || null);
          setExistingLogoUrl(s?.logo?.url || null);
          setExistingBannerUrl(s?.banner?.url || null);
          setIcon3d((s?.metadata && s.metadata.icon3d) || icon3d);
          const coords = s?.address?.location?.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            setGoogleMapsUrl(`https://www.google.com/maps?q=${coords[1]},${coords[0]}`);
          }
          if (s?.metadata?.mapsUrl) {
            setGoogleMapsUrl(s.metadata.mapsUrl as string);
          }
        }
      } catch {}
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return false;
    if (contactPhone && contactPhone.replace(/\D/g, '').length < 8) return false;
    return true;
  }, [name, contactEmail, contactPhone]);

  return (
    <div className="space-y-8 px-4 py-6 md:py-10 mx-auto">
      <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-emerald-200/60 shadow-lg rounded-2xl">
        <CardHeader className="sticky top-16 z-10 bg-white/90 dark:bg-slate-900/80 backdrop-blur rounded-t-2xl border-b border-emerald-200/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-emerald-900 dark:text-emerald-300">Shop Profile</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Manage your shop details</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Mini 3D preview */}
              <div className="hidden md:block rounded-md border border-emerald-200/60 overflow-hidden" style={{ width: 56, height: 56, background: '#f8fafc' }}>
                {/* @ts-ignore model-viewer is a web component */}
                <model-viewer
                  src={icon3d}
                  autoplay
                  interaction-prompt="none"
                  camera-controls
                  style={{ width: '56px', height: '56px' }}
                />
              </div>
              <Button type="submit" form="shop-form" disabled={submitting || !isValid} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow">
                {submitting ? (shopId ? "Updating..." : "Saving...") : shopId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form id="shop-form" className="grid md:grid-cols-2 gap-10" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Basic Details</h3>
              <div>
                <Label>Shop Name</Label>
                <Input
                  placeholder="Your shop name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Google Maps URL + Preview */}
              <div className="space-y-2">
                <Label>Google Maps URL (optional)</Label>
                <Input
                  placeholder="Paste a Google Maps link (we'll parse coordinates)"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="mt-1"
                />
                {(typeof lat === 'number' && typeof lng === 'number') ? (
                  <div className="mt-2 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                    <iframe
                      title="Map preview"
                      width="100%"
                      height="260"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    />
                    <div className="p-2 text-xs text-slate-600">Parsed: lat {lat}, lng {lng}</div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">We will only save location if we can parse lat/lng from your link.</p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  placeholder="Tell customers about your shop"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="mt-1 w-full min-h-[120px] border rounded-md px-3 py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Theme Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-10 w-14 p-0 border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    <Input
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Shop Categories</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SHOP_TYPES.map((t) => {
                      const active = categories.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCategories((prev) => active ? prev.filter(x => x !== t) : [...prev, t])}
                          className={`text-sm px-3 py-2 rounded-md border transition select-none ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Click to toggle categories</p>
                </div>
              </div>

              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  placeholder="e.g. sustainable, handmade"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                />
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />
              <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Media</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                  {logoPreview && (
                    <img src={logoPreview} alt="logo preview" className="mt-2 h-28 w-full object-cover rounded-md border" />
                  )}
                </div>
                <div>
                  <Label>Banner</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                  {bannerPreview && (
                    <img src={bannerPreview} alt="banner preview" className="mt-2 h-28 w-full object-cover rounded-md border" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact & Social</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="you@shop.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="99999 99999"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  placeholder="https://"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Facebook</Label>
                  <Input
                    placeholder="https://facebook.com/"
                    value={social.facebook}
                    onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    placeholder="https://instagram.com/"
                    value={social.instagram}
                    onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>Twitter</Label>
                  <Input
                    placeholder="https://x.com/"
                    value={social.twitter}
                    onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>YouTube</Label>
                  <Input
                    placeholder="https://youtube.com/"
                    value={social.youtube}
                    onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />
              <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Street</Label>
                  <Input
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />
              <div className="space-y-2">
                <Label>3D Icon for Shop Page</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {ICON_PRESETS.map((icon) => (
                    <button
                      type="button"
                      key={icon.id}
                      onClick={() => setIcon3d(icon.url)}
                      className={`border rounded-md p-2 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition ${icon3d === icon.url ? "ring-2 ring-emerald-500" : ""}`}
                      title={icon.label}
                    >
                      {icon.label}
                    </button>
                  ))}
                </div>
                {/* Live 3D preview */}
                <div className="mt-3">
                  {/* @ts-ignore model-viewer is a web component */}
                  <model-viewer
                    src={icon3d}
                    autoplay
                    ar
                    camera-controls
                    style={{ width: '100%', height: '260px', background: '#f8fafc', borderRadius: '12px' }}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-4 pt-4">
              <Button disabled={submitting || !isValid} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow">
                {submitting ? (shopId ? "Updating..." : "Saving...") : shopId ? "Update" : "Save"}
              </Button>
              {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
              {success && <p className="text-emerald-700 text-sm font-medium">{success}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

