export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Product #{params.id}</h1>
      <p className="text-slate-600">Images carousel, title, description, price, reviews, related products.</p>
    </div>
  )
}
