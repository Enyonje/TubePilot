import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getResearch, researchErrorResponse } from '@tubepilot/research';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'update' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const out = await getResearch().setRpm({ channelId: id, organizationId: ctx.organizationId, rpmUsd: body.rpmUsd });
    return Response.json(out);
  } catch (err) {
    return researchErrorResponse(err) ?? toErrorResponse(err);
  }
}
