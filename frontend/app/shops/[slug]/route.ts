import { NextResponse } from 'next/server'

export async function GET(req: Request, context: { params: { slug: string } }) {
  const url = new URL(`/shop/${context.params.slug}`, new URL(req.url).origin)
  return NextResponse.redirect(url, 308)
}

export async function HEAD(req: Request, context: { params: { slug: string } }) {
  const url = new URL(`/shop/${context.params.slug}`, new URL(req.url).origin)
  return NextResponse.redirect(url, 308)
}
