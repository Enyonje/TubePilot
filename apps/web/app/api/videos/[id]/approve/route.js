import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'approve' });
    const { id } = await params;
    await getPipeline().service.approveVideo({ videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id });
    return Response.json({ approved: true });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
