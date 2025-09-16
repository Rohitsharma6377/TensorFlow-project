import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col items-start gap-4 rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Welcome to Social Commerce</h1>
        <p className="text-slate-600">
          A modern social + commerce platform. Explore the feed, follow shops, and discover products.
        </p>
        <div className="flex gap-3">
          <Link href="/feed">
            <Button>Open Feed</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Admin Dashboard</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-medium">Feature Stack</h2>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            <li>Tailwind CSS (utility-first)</li>
            <li>Headless UI (menus, dialogs, popovers)</li>
            <li>Ant Design (admin tables/forms)</li>
            <li>Shadcn-style UI primitives (buttons, inputs)</li>
          </ul>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-medium">Next Steps</h2>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            <li>Hook pages to backend APIs</li>
            <li>Add auth and protected routes</li>
            <li>Build seller dashboard and feed</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
