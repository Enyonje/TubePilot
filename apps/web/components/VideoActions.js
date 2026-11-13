'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoActions({ videoId, status, canGenerate, canApprove, initialText }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
  const [text, setText] = useState(initialText);

  // While the worker is writing, poll by refreshing the server component.
  useEffect(() => {
    if (status !== 'SCRIPTING') return undefined;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [status, router]);

  async function call(path, method = 'POST', body = {}) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/videos/${videoId}/${path}`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out?.error?.message ?? 'Request failed');
    router.refresh();
  }

  const regenerable = ['DRAFT', 'REJECTED', 'AWAITING_APPROVAL', 'FAILED'].includes(status);

  return (
    <div className="card">
      {error && <p className="error">{error}</p>}

      {canGenerate && regenerable && (
        <p className="row">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={status === 'DRAFT' ? 'Optional notes' : 'What should change? (optional)'} style={{ minWidth: '18rem' }} maxLength={1500} />
          <button disabled={busy} onClick={() => call('generate', 'POST', { feedback })}>
            {status === 'DRAFT' || status === 'FAILED' ? 'Write script' : 'Regenerate'}
          </button>
        </p>
      )}

      {status === 'AWAITING_APPROVAL' && canGenerate && (
        <>
          <p className="muted">Edit the narration (saved as a new version):</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} style={{ width: '100%' }} />
          <p><button disabled={busy || text.trim() === initialText.trim()} onClick={() => call('script', 'PUT', { text })}>Save edit</button></p>
        </>
      )}

      {status === 'AWAITING_APPROVAL' && canApprove && (
        <p className="row">
          <button className="primary" disabled={busy} onClick={() => call('approve')}>Approve script</button>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejecting (used as feedback)" style={{ minWidth: '18rem' }} maxLength={1000} />
          <button disabled={busy || reason.trim().length < 3} onClick={() => call('reject', 'POST', { reason })}>Reject</button>
        </p>
      )}
      {status === 'AWAITING_APPROVAL' && !canApprove && <p className="muted">Waiting for an admin or owner to approve.</p>}
      {status === 'APPROVED' && <p>Approved. The voice-over starts automatically when a text-to-speech provider is configured (see below).</p>}
    </div>
  );
}
