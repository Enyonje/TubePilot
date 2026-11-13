'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

export default function VoicePanel({ videoId, canGenerate, providers, stage, assets, costUsd }) {
  const router = useRouter();
  const [provider, setProvider] = useState(providers[0]?.name ?? '');
  const [voice, setVoice] = useState(providers[0]?.defaultVoice ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const running = stage?.state === 'QUEUED' || stage?.state === 'RUNNING';
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [running, router]);

  async function generate() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/videos/${videoId}/voice`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider, voice }) });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out?.error?.message ?? 'Request failed');
    router.refresh();
  }

  const totalMs = assets.reduce((a, x) => a + x.durationMs, 0);

  return (
    <div className="card">
      <h3>Voice-over</h3>
      {providers.length === 0 && <p className="muted">No text-to-speech provider is configured. Set a <code>TTS_*_MODEL</code> in <code>.env</code> (see <code>.env.example</code>) and restart.</p>}
      {running && <p>Generating the voice-over… this page refreshes automatically.</p>}
      {stage?.state === 'FAILED' && <p className="error">Voice-over failed: {stage.error}</p>}
      {error && <p className="error">{error}</p>}

      {providers.length > 0 && canGenerate && !running && (
        <p className="row">
          <select value={provider} onChange={(e) => { setProvider(e.target.value); setVoice(providers.find((p) => p.name === e.target.value)?.defaultVoice ?? ''); }}>
            {providers.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <input value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="Voice name" maxLength={40} style={{ width: '10rem' }} />
          <button className="primary" disabled={busy || !voice} onClick={generate}>{assets.length ? 'Regenerate voice-over' : 'Generate voice-over'}</button>
          <span className="muted">Costs real money with your provider. Stock voices only.</span>
        </p>
      )}

      {assets.length > 0 && (
        <>
          <p className="muted">{assets.length} segments · {fmt(totalMs)} · voice cost ${costUsd.toFixed(4)} · {assets[0].provider} / {assets[0].voice}</p>
          <table>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>{a.heading}</td>
                  <td className="muted">{fmt(a.durationMs)}</td>
                  <td><audio controls preload="none" src={`/api/media/${a.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Next (Step 6c): these segments set the timing of the finished video.</p>
        </>
      )}
    </div>
  );
}
