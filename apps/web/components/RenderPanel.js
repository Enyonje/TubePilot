'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

export default function RenderPanel({ videoId, canRender, hasVoice, voiceBatchId, stage, render, subtitlesId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const running = stage?.state === 'QUEUED' || stage?.state === 'RUNNING';
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [running, router]);

  async function start() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/videos/${videoId}/render`, { method: 'POST' });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out?.error?.message ?? 'Request failed');
    router.refresh();
  }

  const stale = render && voiceBatchId && render.voiceBatchId !== voiceBatchId;

  return (
    <div className="card">
      <h3>Video</h3>
      {!hasVoice && <p className="muted">Generate the voice-over first: the video is built from it.</p>}
      {running && <p>Rendering… a long video can take several minutes. This page refreshes automatically.</p>}
      {stage?.state === 'FAILED' && <p className="error">Render failed: {stage.error}</p>}
      {error && <p className="error">{error}</p>}

      {hasVoice && canRender && !running && (
        <p className="row">
          <button className="primary" disabled={busy} onClick={start}>{render ? 'Re-render video' : 'Render video'}</button>
          <span className="muted">Uses your own computer (ffmpeg); no provider cost.</span>
        </p>
      )}

      {stale && <p className="error">The voice-over changed after this render. Re-render to match it.</p>}

      {render && (
        <>
          <video controls preload="metadata" src={`/api/media/${render.id}`} style={{ width: '100%', maxWidth: '960px', background: '#000' }} />
          <p className="muted">
            {fmt(render.durationMs)} · {mb(render.bytes)} · 1080p ·{' '}
            <a href={`/api/media/${render.id}?download=1`}>Download MP4</a>
            {subtitlesId && <> · <a href={`/api/media/${subtitlesId}?download=1`}>Download captions (.srt)</a></>}
          </p>
          <p className="muted">
            Visuals are chapter cards over the narration for now; generated images and thumbnails come next. Caption timing is
            approximate: the speech providers do not report word timings.
          </p>
        </>
      )}
    </div>
  );
}
