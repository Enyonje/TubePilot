import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'create' });
    const body = await req.json().catch(() => null);
    const video = await getPipeline().service.createVideo({
      channelId: body?.channelId, organizationId: ctx.organizationId, actorId: ctx.user.id, brief: body?.brief,
    });
    return Response.json({ id: video.id }, { status: 201 });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
