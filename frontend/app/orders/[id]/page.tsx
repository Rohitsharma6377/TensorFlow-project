export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Order #{params.id}</h1>
      <p className="text-slate-600">Shipment tracking, support chat, timeline.</p>
    </div>
  )
}
