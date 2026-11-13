import { randomUUID } from 'node:crypto';
import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';

export const dynamic = 'force-dynamic';

// Create a channel PROFILE (no YouTube needed). It can be attached to a real channel later.
export async function POST(req) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'create' });
    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim().slice(0, 100);
    const niche = String(body.niche ?? '').trim().slice(0, 80);
    const language = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(body.language ?? '') ? body.language : 'en';
    if (title.length < 2 || niche.length < 2) {
      return Response.json({ error: { code: 'INVALID', message: 'title and niche are required' } }, { status: 422 });
    }
    const channel = await prisma.channel.create({
      data: { organizationId: ctx.organizationId, youtubeChannelId: `local-${randomUUID()}`, title, niche, language, status: 'DISCONNECTED' },
    });
    await prisma.auditLog.create({
      data: { organizationId: ctx.organizationId, actorId: ctx.user.id, action: 'channel.profile_created', targetType: 'channel', targetId: channel.id },
    });
    return Response.json({ id: channel.id }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
