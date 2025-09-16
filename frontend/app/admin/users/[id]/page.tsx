export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">User #{params.id}</h1>
      <p className="text-slate-600">View user profile, orders and chats. Ban/unban actions.</p>
    </div>
  )
}
