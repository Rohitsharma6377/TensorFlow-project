import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const sellerId = String(form.get('sellerId') || '').trim();
    const folderHint = String(form.get('folder') || '').trim();
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = (file as any).name ? path.extname((file as any).name) : "";
    const uploadsDir = path.join(process.cwd(), "public", "uploads", sellerId || '', folderHint || '');
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}${ext || ".bin"}`;
    const outPath = path.join(uploadsDir, filename);
    await writeFile(outPath, buffer);
    const parts = ["/uploads", sellerId, folderHint, filename].filter(Boolean);
    const url = parts.join("/");
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = (searchParams.get('sellerId') || '').trim();
    const folder = (searchParams.get('folder') || '').trim();
    const base = path.join(process.cwd(), 'public', 'uploads', sellerId || '', folder || '');
    try { await mkdir(base, { recursive: true }); } catch {}
    const items = await readdir(base);
    const files: string[] = [];
    for (const name of items) {
      const p = path.join(base, name);
      try {
        const s = await stat(p);
        if (s.isFile()) {
          const parts = ["/uploads", sellerId, folder, name].filter(Boolean);
          files.push(parts.join('/'));
        }
      } catch {}
    }
    // newest first by filename time-uuid is okay as-is
    files.sort().reverse();
    return NextResponse.json({ files });
  } catch (e) {
    return NextResponse.json({ files: [] });
  }
}
