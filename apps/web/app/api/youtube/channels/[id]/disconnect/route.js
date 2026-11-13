import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import { getYouTube, YouTubeNotConfiguredError } from '@tubepilot/youtube';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'delete' });
    const { id } = await params;
    const channel = await prisma.channel.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!channel) return Response.json({ error: { code: 'NOT_FOUND', message: 'Channel not found' } }, { status: 404 });
    const result = await getYouTube().disconnectChannel({ channel, actorId: ctx.user.id });
    return Response.json({ disconnected: true, revokedAtGoogle: result.revoked });
  } catch (err) {
    if (err instanceof YouTubeNotConfiguredError) return Response.json({ error: { code: 'NOT_CONFIGURED', message: err.message } }, { status: 503 });
    return toErrorResponse(err);
  }
}
