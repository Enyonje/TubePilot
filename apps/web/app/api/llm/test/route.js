import { requireOrgContext, toErrorResponse } from '@tubepilot/auth';
import { getLLM, AllProvidersFailedError, NoProvidersConfiguredError, LLMError } from '@tubepilot/ai';

export const dynamic = 'force-dynamic';

// POST { "prompt": "..." } -> real provider call, billed to the caller's active workspace.
export async function POST(req) {
  try {
    const ctx = await requireOrgContext(req.headers, { resource: 'research', action: 'run' });
    const { prompt } = await req.json().catch(() => ({}));
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
      return Response.json({ error: { code: 'BAD_PROMPT', message: 'prompt must be 1-2000 characters' } }, { status: 400 });
    }
    const r = await getLLM().complete(
      { messages: [{ role: 'user', content: prompt }], maxTokens: 300 },
      { organizationId: ctx.organizationId, userId: ctx.user.id, feature: 'smoke_test' },
    );
    return Response.json({
      text: r.text, provider: r.provider, model: r.model, usage: r.usage, costUsd: r.costUsd, failedOver: r.attempts,
    });
  } catch (err) {
    if (err instanceof NoProvidersConfiguredError) {
      return Response.json({ error: { code: 'NO_PROVIDERS', message: err.message } }, { status: 503 });
    }
    if (err instanceof AllProvidersFailedError) {
      return Response.json({ error: { code: 'ALL_PROVIDERS_FAILED', attempts: err.attempts } }, { status: 502 });
    }
    if (err instanceof LLMError) {
      return Response.json({ error: { code: err.kind.toUpperCase(), message: err.message } }, { status: err.kind === 'bad_request' ? 400 : 502 });
    }
    return toErrorResponse(err);
  }
}
