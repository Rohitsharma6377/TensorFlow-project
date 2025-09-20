"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api/v1";

type Shop = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: { url: string };
  banner?: { url: string };
  categories?: string[];
  metadata?: Record<string, any> & { themeColor?: string };
  contact?: { email?: string; phone?: string; website?: string };
};

export default function ShopPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [myComment, setMyComment] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const shopRes = await fetch(`${API_BASE}/shops/${params.slug}`, { credentials: "include" });
        const shopData = await shopRes.json();
        if (!shopRes.ok) throw new Error(shopData?.message || "Shop not found");
        setShop(shopData.shop);

        const id = shopData.shop._id;
        const [statsRes, revRes] = await Promise.all([
          fetch(`${API_BASE}/shops/${id}/stats`, { credentials: "include" }),
          fetch(`${API_BASE}/shops/${id}/reviews`, { credentials: "include" }),
        ]);
        if (statsRes.ok) {
          const s = await statsRes.json();
          setFollowers(s.followers || 0);
          setRating(s.rating || { average: 0, count: 0 });
        }
        if (revRes.ok) {
          const r = await revRes.json();
          setReviews(r.reviews || []);
        }
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

  const themeColor = shop?.metadata?.themeColor || "#10b981";

  async function followToggle() {
    if (!shop) return;
    const id = shop._id;
    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch(`${API_BASE}/social/follow/${id}`, { method, credentials: "include" });
    if (res.ok) {
      setIsFollowing(!isFollowing);
      // refresh followers
      const statsRes = await fetch(`${API_BASE}/shops/${id}/stats`, { credentials: "include" });
      if (statsRes.ok) {
        const s = await statsRes.json();
        setFollowers(s.followers || 0);
        setRating(s.rating || { average: 0, count: 0 });
      }
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!shop || myRating <= 0) return;
    const id = shop._id;
    const res = await fetch(`${API_BASE}/shops/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rating: myRating, comment: myComment }),
    });
    if (res.ok) {
      setMyComment("");
      // refresh
      const [statsRes, revRes] = await Promise.all([
        fetch(`${API_BASE}/shops/${id}/stats`, { credentials: "include" }),
        fetch(`${API_BASE}/shops/${id}/reviews`, { credentials: "include" }),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setFollowers(s.followers || 0);
        setRating(s.rating || { average: 0, count: 0 });
      }
      if (revRes.ok) {
        const r = await revRes.json();
        setReviews(r.reviews || []);
      }
    }
  }

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!shop) return <div className="p-6">Shop not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      {shop.banner?.url && (
        <div className="rounded-xl overflow-hidden border">
          <img src={shop.banner.url} alt="banner" className="w-full h-56 object-cover" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {shop.logo?.url && (
          <img src={shop.logo.url} alt="logo" className="h-20 w-20 rounded-md border object-cover" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" style={{ color: themeColor }}>{shop.name}</h1>
          <p className="text-slate-600 mt-1">{shop.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
            <span>Followers: {followers}</span>
            <span>Rating: {rating.average.toFixed(1)} ({rating.count})</span>
            {shop.categories && shop.categories.length > 0 && (
              <span>Categories: {shop.categories.join(", ")}</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Button onClick={followToggle}>{isFollowing ? "Unfollow" : "Follow"}</Button>
        </div>
      </div>

      {/* Reviews */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <form onSubmit={submitReview} className="border rounded-md p-3 space-y-2">
          <Label>Your rating</Label>
          <div className="flex items-center gap-2">
            {stars.map((s) => (
              <button
                key={s}
                type="button"
                className={`text-2xl ${myRating >= s ? 'text-yellow-500' : 'text-slate-400'}`}
                onClick={() => setMyRating(s)}
                aria-label={`Rate ${s}`}
              >
                ★
              </button>
            ))}
          </div>
          <Label className="mt-2">Comment (optional)</Label>
          <Input value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Write a short review..." />
          <div>
            <Button disabled={myRating <= 0}>Submit review</Button>
          </div>
        </form>

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
    </div>
  );
}
