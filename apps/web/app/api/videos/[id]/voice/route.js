import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

// POST { provider?, voice? } -> queue a (re)generation of the voice-over. The same call the approval event makes.
export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'update' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const voice = body.provider ? { provider: String(body.provider), voice: String(body.voice ?? '') } : null;
    const out = await getPipeline().service.requestVoice({ videoId: id, organizationId: ctx.organizationId, actorId: ctx.user.id, voice });
    return Response.json(out, { status: 202 });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
