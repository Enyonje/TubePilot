import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'approve' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await getPipeline().service.rejectVideo({ videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id, reason: body.reason });
    return Response.json({ rejected: true });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
