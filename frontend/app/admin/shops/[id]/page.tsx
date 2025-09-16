export default function AdminShopDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Shop #{params.id}</h1>
      <p className="text-slate-600">Approve/reject KYC, plan upgrades/downgrades.</p>
    </div>
  )
}
