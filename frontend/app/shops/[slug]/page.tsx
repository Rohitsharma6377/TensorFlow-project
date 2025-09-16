export default function ShopPage({ params }: { params: { slug: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Shop: {params.slug}</h1>
      <p className="text-slate-600">Banner, profile, products grid, posts feed, stories, reels, follower count.</p>
    </div>
  )
}
