'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const pct = (x) => (x == null ? 'n/a' : `${Math.round(x * 100)}%`);

export default function TopicsClient({ channel, canRun, canEditChannel, canCreateVideo, runs, topics }) {
  const router = useRouter();
  const [count, setCount] = useState(8);
  const [rpm, setRpm] = useState(channel.rpm ?? '');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(null);

  const active = runs.some((r) => r.status === 'QUEUED' || r.status === 'RUNNING');
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [active, router]);

  async function call(key, url, method, body) {
    setBusy(key);
    setMessage('');
    const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const out = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) {
      setMessage(out?.error?.message ?? 'Request failed');
      return null;
    }
    return out;
  }

  const run = async () => {
    if (await call('run', `/api/channels/${channel.id}/research`, 'POST', { count: Number(count) })) router.refresh();
  };
  const saveRpm = async () => {
    const out = await call('rpm', `/api/channels/${channel.id}/rpm`, 'PUT', { rpmUsd: rpm });
    if (out) {
      setMessage(`Saved. ${out.rescored} topic(s) re-scored (no new YouTube calls).`);
      router.refresh();
    }
  };
  const dismiss = async (id) => {
    if (await call(`d${id}`, `/api/topics/${id}/dismiss`, 'POST')) router.refresh();
  };
  const makeVideo = async (id) => {
    const out = await call(`v${id}`, `/api/topics/${id}/video`, 'POST');
    if (out) router.push(`/dashboard/videos/${out.id}`);
  };

  return (
    <>
      <p className="muted">
        Scores come from public YouTube data for each topic&apos;s search phrase: how fast recent relevant videos gain views,
        how many top results come from big channels, and how often small channels outperform their size. They are
        heuristics to rank ideas, not predictions. YouTube does not publish search volume, so none is shown.
      </p>

      {canRun && (
        <div className="card row">
          <label>Topics to research <input type="number" min={1} max={30} value={count} onChange={(e) => setCount(e.target.value)} style={{ width: '4rem' }} /></label>
          <button className="primary" disabled={busy === 'run' || active} onClick={run}>{active ? 'Research running…' : 'Find topic ideas'}</button>
          <span className="muted">Uses the shared daily YouTube search quota (1 per new topic) and one LLM call.</span>
        </div>
      )}

      {canEditChannel && (
        <div className="card row">
          <label>
            Assumed RPM for {channel.title} (USD per 1,000 views){' '}
            <input type="number" min={0} max={200} step="0.1" value={rpm} onChange={(e) => setRpm(e.target.value)} style={{ width: '6rem' }} placeholder="not set" />
          </label>
          <button disabled={busy === 'rpm'} onClick={saveRpm}>Save</button>
          <span className="muted">Your own estimate; never measured. Left empty, revenue is ignored in the score.</span>
        </div>
      )}
      {message && <p className="muted">{message}</p>}

      {runs.length > 0 && (
        <p className="muted">
          Latest runs: {runs.map((r) => `${r.status} (${r.researched}/${r.requested})${r.error ? ` – ${r.error}` : ''}${r.note ? ` – ${r.note}` : ''}`).join(' · ')}
        </p>
      )}

      {topics.length === 0 ? (
        <p className="muted">No researched topics yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Topic</th><th>Score</th><th>Median views/day</th><th>Big channels</th><th>Outliers</th><th>Est. $/month</th><th /></tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <td>
                  <a href="#" onClick={(e) => { e.preventDefault(); setOpen(open === t.id ? null : t.id); }}>{t.title}</a>
                  {t.lowSample && <span className="muted"> · thin data ({t.sample} videos)</span>}
                  {t.status === 'USED' && <span className="muted"> · used</span>}
                  <div className="muted">{t.rationale}</div>
                  {open === t.id && (
                    <ul className="muted">
                      {t.topVideos.map((v) => <li key={v.id}>{v.title} ({v.channelTitle}): about {v.viewsPerDay.toLocaleString()} views/day</li>)}
                      {t.topVideos.length === 0 && <li>No usable results were found for this phrase.</li>}
                    </ul>
                  )}
                </td>
                <td><strong>{t.score ?? '-'}</strong></td>
                <td>{Math.round(t.viewsPerDay).toLocaleString()}</td>
                <td>{pct(t.largeShare)}</td>
                <td>{t.virality != null ? `${Math.round(t.virality)}%` : 'n/a'}</td>
                <td>{t.revenue != null ? `$${t.revenue.toLocaleString()}` : '–'}</td>
                <td className="row">
                  {t.status === 'NEW' && canCreateVideo && <button disabled={Boolean(busy)} onClick={() => makeVideo(t.id)}>Make video</button>}
                  {t.status === 'NEW' && canRun && <button disabled={Boolean(busy)} onClick={() => dismiss(t.id)}>Dismiss</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
