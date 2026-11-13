import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from '@tubepilot/config';
import { getOrgContext, hasRolePermission } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import { getYouTube } from '@tubepilot/youtube';
import ChannelsClient from '../../../components/ChannelsClient';

export const dynamic = 'force-dynamic';

const ERRORS = {
  access_denied: 'You cancelled the connection at Google.',
  state_invalid: 'The connection attempt expired or did not match this browser. Please try again.',
  scopes_missing: 'Not every requested permission was granted. Connect again and leave all permissions ticked.',
  no_channel: 'That Google account has no YouTube channel.',
  owned_elsewhere: 'That channel is already connected to another workspace.',
  no_refresh_token: 'Google did not return a refresh token. Remove TubePilot at myaccount.google.com/permissions, then connect again.',
  token_exchange_failed: 'Google rejected the sign-in. Check the OAuth client settings and try again.',
  already_connected_here: 'That YouTube channel is already in this workspace as a different channel.',
  niche_required: 'Enter the channel niche first.',
  not_configured: 'YouTube is not configured on this server.',
  unexpected: 'Something went wrong. Check the server log.',
};

export default async function ChannelsPage({ searchParams }) {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');
  if (!ctx.organizationId) return <p>No active workspace.</p>;

  const env = getEnv();
  const configured = Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET);
  const sp = await searchParams;

  const channels = await prisma.channel.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { videos: true } } },
  });

  let quota = null;
  if (configured && hasRolePermission(ctx.role, 'organization', 'update')) {
    try {
      quota = await getYouTube().quota.usage();
    } catch {
      quota = null;
    }
  }

  return (
    <>
      <h1>Channels</h1>
      {sp.connected && <p className="card">Connected “{sp.connected}”. The first sync is queued from the channel row.</p>}
      {sp.error && <p className="error">{ERRORS[sp.error] ?? 'Connection failed.'}</p>}
      <ChannelsClient
        configured={configured}
        canConnect={hasRolePermission(ctx.role, 'channel', 'create')}
        canSync={hasRolePermission(ctx.role, 'channel', 'update')}
        canDisconnect={hasRolePermission(ctx.role, 'channel', 'delete')}
        quota={quota}
        channels={channels.map((c) => ({
          id: c.id,
          title: c.title,
          niche: c.niche,
          language: c.language,
          status: c.status,
          isLocal: c.youtubeChannelId.startsWith('local-'),
          videos: c._count.videos,
          lastSyncAt: c.lastSyncAt ? c.lastSyncAt.toISOString() : null,
          lastSyncError: c.lastSyncError,
        }))}
      />
    </>
  );
}
