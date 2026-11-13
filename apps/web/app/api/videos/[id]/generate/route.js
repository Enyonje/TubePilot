import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'update' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const base = { videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id };
    await getPipeline().service.requestScriptGeneration({ ...base, feedback: typeof body.feedback === 'string' ? body.feedback.slice(0, 1500) : null });
    return Response.json({ queued: true }, { status: 202 });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
