import { Readable } from 'node:stream';
import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import { getStorage, parseRange } from '@tubepilot/media';

export const dynamic = 'force-dynamic';

const notFound = () => Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });

// Streams a stored asset to members of the owning workspace. The storage key comes from the database row, never the URL.
export async function GET(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'read' });
    const { id } = await params;
    const asset = await prisma.mediaAsset.findFirst({ where: { id, organizationId: ctx.organizationId }, include: { video: { select: { title: true } } } });
    if (!asset) return notFound();

    const storage = getStorage();
    let size;
    try {
      ({ size } = await storage.stat(asset.storageKey));
    } catch {
      return notFound(); // row exists but the file is gone
    }

    const headers = {
      'Content-Type': asset.mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };
    // ?download=1 turns the response into a file download named after the video (ASCII fallback + UTF-8 name).
    if (new URL(req.url).searchParams.get('download') === '1') {
      const ext = { 'video/mp4': 'mp4', 'application/x-subrip': 'srt', 'audio/wav': 'wav' }[asset.mimeType] ?? 'bin';
      const base = (asset.video?.title ?? 'video').replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim().slice(0, 80) || 'video';
      const ascii = base.replace(/[^A-Za-z0-9 _-]+/g, '').trim() || 'video';
      headers['Content-Disposition'] = `attachment; filename="${ascii}.${ext}"; filename*=UTF-8''${encodeURIComponent(base)}.${ext}`;
    }
    const range = parseRange(req.headers.get('range'), size);
    if (range === 'invalid') return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });

    const { start, end } = range ?? { start: 0, end: size - 1 };
    return new Response(Readable.toWeb(storage.stream(asset.storageKey, { start, end })), {
      status: range ? 206 : 200,
      headers: { ...headers, 'Content-Length': String(end - start + 1), ...(range && { 'Content-Range': `bytes ${start}-${end}/${size}` }) },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
