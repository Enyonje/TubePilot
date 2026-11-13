import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getResearch, researchErrorResponse } from '@tubepilot/research';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'research', action: 'run' });
    const { id } = await params;
    return Response.json(await getResearch().dismissTopic({ topicId: id, organizationId: ctx.organizationId }));
  } catch (err) {
    return researchErrorResponse(err) ?? toErrorResponse(err);
  }
}
