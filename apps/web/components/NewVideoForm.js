'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewVideoForm({ channels, canCreate }) {
  const router = useRouter();
  const [f, setF] = useState({ channelId: channels[0]?.id ?? '', idea: '', angle: '', audience: '', tone: 'conversational and clear', targetMinutes: 8 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!canCreate) return null;
  if (channels.length === 0) {
    return <p className="card">Create a channel profile first: <Link href="/dashboard/channels">Channels</Link>.</p>;
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { channelId, ...brief } = f;
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channelId, brief: { ...brief, targetMinutes: Number(brief.targetMinutes) } }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body?.error?.message ?? 'Could not create the video');
    router.push(`/dashboard/videos/${body.id}`);
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>New video</h3>
      <p className="row">
        <select value={f.channelId} onChange={set('channelId')}>
          {channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <label>Length (min) <input type="number" min={1} max={20} value={f.targetMinutes} onChange={set('targetMinutes')} style={{ width: '4rem' }} /></label>
      </p>
      <p><input style={{ width: '100%' }} value={f.idea} onChange={set('idea')} placeholder="Video idea (what is it about?)" required minLength={5} maxLength={300} /></p>
      <p><input style={{ width: '100%' }} value={f.angle} onChange={set('angle')} placeholder="Angle (optional)" maxLength={300} /></p>
      <p className="row">
        <input value={f.audience} onChange={set('audience')} placeholder="Audience (optional)" maxLength={150} />
        <input value={f.tone} onChange={set('tone')} placeholder="Tone" maxLength={100} />
      </p>
      <button className="primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create and write the script'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
