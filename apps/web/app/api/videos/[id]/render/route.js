import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

// POST -> queue a (re)render of the video from its active voice-over. Needs ffmpeg on the machine running the worker.
export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'update' });
    const { id } = await params;
    const out = await getPipeline().service.requestRender({ videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id });
    return Response.json(out, { status: 202 });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
