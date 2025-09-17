"use client";
import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchFeed } from '@/store/slice/feedSlice'
import Link from 'next/link'

export default function FeedPage() {
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector(s => s.feed)

  useEffect(() => {
    dispatch(fetchFeed())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feed</h1>
      {status === 'loading' && <p className="text-slate-500">Loading...</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(p => (
          <div key={p._id} className="rounded-lg border bg-white p-4">
            {p.media?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.media[0]} alt={p.caption || 'post'} className="mb-3 h-48 w-full rounded object-cover" />
            )}
            <p className="text-slate-700">{p.caption}</p>
            {p.product && (
              <div className="mt-2">
                <Link href={`/products/${p.product}`} className="text-blue-600">View product</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
