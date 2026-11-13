import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';

export const dynamic = 'force-dynamic';

// Reference implementation of a guarded, tenant-scoped API route.
export async function GET(req) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'channel', action: 'read' });
    return Response.json({
      user: { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name },
      organizationId: ctx.organizationId,
      role: ctx.role,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
