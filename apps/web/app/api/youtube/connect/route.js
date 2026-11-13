import { getEnv } from '@tubepilot/config';
import { AuthError, requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { ConnectionError, getYouTube, YouTubeNotConfiguredError } from '@tubepilot/youtube';

export const dynamic = 'force-dynamic';

const back = (q) => Response.redirect(new URL(`/dashboard/channels?${q}`, getEnv().APP_URL), 302);

// Browser navigation: GET /api/youtube/connect?niche=...&language=en  ->  302 to Google.
export async function GET(req) {
  let ctx;
  try {
    ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'create' });
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) {
      return Response.redirect(new URL('/sign-in?next=/dashboard/channels', getEnv().APP_URL), 302);
    }
    return toErrorResponse(err);
  }

  const params = new URL(req.url).searchParams;
  const niche = (params.get('niche') ?? '').trim().slice(0, 80);
  const attachChannelId = /^[0-9a-f-]{36}$/i.test(params.get('attach') ?? '') ? params.get('attach') : undefined;
  const language = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(params.get('language') ?? '') ? params.get('language') : 'en';

  try {
    const { authUrl, state } = await getYouTube().startConnection({
      organizationId: ctx.organizationId, userId: ctx.user.id, niche, language, attachChannelId,
    });
    const secure = getEnv().APP_URL.startsWith('https://') ? '; Secure' : '';
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        // Binds the OAuth round trip to THIS browser (login-CSRF protection).
        'Set-Cookie': `yt_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/youtube; Max-Age=600${secure}`,
      },
    });
  } catch (err) {
    if (err instanceof YouTubeNotConfiguredError) return back('error=not_configured');
    if (err instanceof ConnectionError) return back(`error=${err.code}`);
    throw err;
  }
}
