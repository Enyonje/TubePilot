import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import { getPipeline, pipelineErrorResponse } from '@tubepilot/pipeline';

export const dynamic = 'force-dynamic';

// Turn a researched topic into a video (and start its script). The topic can be used only once.
export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'video', action: 'create' });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const topic = await prisma.topic.findFirst({ where: { id, channel: { organizationId: ctx.organizationId } } });
    if (!topic) return Response.json({ error: { code: 'NOT_FOUND', message: 'Topic not found' } }, { status: 404 });

    const video = await getPipeline().service.createVideo({
      channelId: topic.channelId,
      organizationId: ctx.organizationId,
      actorId: ctx.user.id,
      topicId: topic.id,
      brief: { idea: topic.title, angle: topic.rationale ?? undefined, targetMinutes: Number(body.targetMinutes) || 8 },
    });
    return Response.json({ id: video.id }, { status: 201 });
  } catch (err) {
    return pipelineErrorResponse(err) ?? toErrorResponse(err);
  }
}
