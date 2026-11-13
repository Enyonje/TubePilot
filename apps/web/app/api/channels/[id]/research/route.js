import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getResearch, researchErrorResponse } from '@tubepilot/research';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'research', action: 'run' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const out = await getResearch().startRun({
      channelId: id, organizationId: ctx.organizationId, actorId: ctx.user.id,
      count: body.count === undefined ? undefined : Number(body.count),
    });
    return Response.json(out, { status: 202 });
  } catch (err) {
    return researchErrorResponse(err) ?? toErrorResponse(err);
  }
}
