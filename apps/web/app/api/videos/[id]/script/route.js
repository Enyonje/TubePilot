import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'update' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const out = await getPipeline().service.saveScriptEdit({ videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id, text: body.text });
    return Response.json(out);
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
