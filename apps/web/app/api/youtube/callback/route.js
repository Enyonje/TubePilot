import { getEnv } from '@tubepilot/config';
import { getOrgContext } from '@tubepilot/auth';
import { ConnectionError, getYouTube, YouTubeAuthError } from '@tubepilot/youtube';

export const dynamic = 'force-dynamic';

function readCookie(header, name) {
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export async function GET(req) {
  const appUrl = getEnv().APP_URL;
  const clearCookie = 'yt_oauth_state=; HttpOnly; SameSite=Lax; Path=/api/youtube; Max-Age=0';
  const go = (q) =>
    new Response(null, { status: 302, headers: { Location: new URL(`/dashboard/channels?${q}`, appUrl).toString(), 'Set-Cookie': clearCookie } });

  const ctx = await getOrgContext(req.headers);
  if (!ctx) return Response.redirect(new URL('/sign-in?next=/dashboard/channels', appUrl), 302);
  if (!ctx.organizationId) return go('error=state_invalid');

  const params = new URL(req.url).searchParams;
  if (params.get('error')) return go('error=access_denied'); // user clicked "Cancel" at Google

  try {
    const channel = await getYouTube().finishConnection({
      code: params.get('code'),
      state: params.get('state'),
      cookieState: readCookie(req.headers.get('cookie'), 'yt_oauth_state'),
      userId: ctx.user.id,
      organizationId: ctx.organizationId,
    });
    return go(`connected=${encodeURIComponent(channel.title)}`);
  } catch (err) {
    if (err instanceof ConnectionError) return go(`error=${err.code}`);
    if (err instanceof YouTubeAuthError) return go('error=token_exchange_failed');
    console.error('youtube callback failed', err);
    return go('error=unexpected');
  }
}
