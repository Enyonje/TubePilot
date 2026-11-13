import { getAuthHandlers } from '@tubepilot/auth';

export const dynamic = 'force-dynamic';

// Handlers are created lazily so `next build` never needs runtime secrets.
export const GET = (req) => getAuthHandlers().GET(req);
export const POST = (req) => getAuthHandlers().POST(req);
