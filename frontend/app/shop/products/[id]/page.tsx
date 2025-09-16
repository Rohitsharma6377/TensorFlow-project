export default function ShopProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Manage Product #{params.id}</h1>
      <p className="text-slate-600">Edit product info, stock, price, images.</p>
    </div>
  )
}
