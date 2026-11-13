import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import { enqueueChannelSync, getYouTube, YouTubeNotConfiguredError } from '@tubepilot/youtube';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'update' });
    const { id } = await params;
    // Tenant scope: the channel must belong to the caller's active workspace.
    const channel = await prisma.channel.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true, status: true } });
    if (!channel) return Response.json({ error: { code: 'NOT_FOUND', message: 'Channel not found' } }, { status: 404 });
    if (channel.status !== 'CONNECTED') {
      return Response.json({ error: { code: 'NOT_CONNECTED', message: 'Reconnect this channel first' } }, { status: 409 });
    }
    await enqueueChannelSync(getYouTube().queue, { channelId: channel.id, days: 7, manual: true });
    return Response.json({ queued: true }, { status: 202 });
  } catch (err) {
    if (err instanceof YouTubeNotConfiguredError) return Response.json({ error: { code: 'NOT_CONFIGURED', message: err.message } }, { status: 503 });
    return toErrorResponse(err);
  }
}
