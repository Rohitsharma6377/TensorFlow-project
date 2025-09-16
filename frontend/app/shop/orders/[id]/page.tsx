export default function ShopOrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Order #{params.id} (Shop)</h1>
      <p className="text-slate-600">Update shipment status, generate invoice, resolve disputes.</p>
    </div>
  )
}
