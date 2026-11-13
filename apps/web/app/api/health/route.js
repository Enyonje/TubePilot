import { getEnv } from '@tubepilot/config';
import { checkDatabase } from '@tubepilot/database';
import { checkRedis } from '@tubepilot/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnv();
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis(env.REDIS_URL)]);
  const ok = database.ok && redis.ok;
  return Response.json(
    { status: ok ? 'ok' : 'degraded', checks: { database, redis }, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
