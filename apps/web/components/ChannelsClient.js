'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChannelsClient({ configured, canConnect, canSync, canDisconnect, quota, channels }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({ title: '', niche: '', language: 'en' });

  async function act(id, action) {
    if (action === 'disconnect' && !window.confirm('Disconnect this channel? Stored data is kept, but syncing stops.')) return;
    setBusy(`${id}:${action}`);
    setMessage('');
    const res = await fetch(`/api/youtube/channels/${id}/${action}`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setMessage(body?.error?.message ?? 'Request failed');
    setMessage(action === 'sync' ? 'Sync queued. Refresh in a minute.' : 'Disconnected.');
    router.refresh();
  }

  async function createProfile(e) {
    e.preventDefault();
    setBusy('profile');
    setMessage('');
    const res = await fetch('/api/channels', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(profile) });
    const body = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setMessage(body?.error?.message ?? 'Could not create the profile');
    setProfile({ title: '', niche: '', language: 'en' });
    router.refresh();
  }

  const connectUrl = (c) =>
    `/api/youtube/connect?niche=${encodeURIComponent(c.niche)}&language=${encodeURIComponent(c.language)}${c.isLocal ? `&attach=${c.id}` : ''}`;

  return (
    <>
      {canConnect && (
        <form className="card row" onSubmit={createProfile}>
          <input value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} placeholder="Channel name" required maxLength={100} />
          <input value={profile.niche} onChange={(e) => setProfile({ ...profile, niche: e.target.value })} placeholder="Niche (e.g. personal finance)" required maxLength={80} />
          <input value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} placeholder="Language" size={6} />
          <button type="submit" disabled={busy === 'profile'}>Add channel profile (no YouTube needed)</button>
        </form>
      )}

      {canConnect && configured && (
        <form className="card row" method="GET" action="/api/youtube/connect">
          <input name="niche" placeholder="Channel niche (e.g. personal finance)" required maxLength={80} />
          <input name="language" placeholder="Language" defaultValue="en" size={6} />
          <button className="primary" type="submit">Connect a YouTube channel</button>
        </form>
      )}
      {!configured && (
        <p className="muted">
          YouTube is not configured (<code>YOUTUBE_CLIENT_ID</code> / <code>YOUTUBE_CLIENT_SECRET</code>), so channels stay as profiles. You can still write scripts.
        </p>
      )}
      {message && <p className="muted">{message}</p>}

      {channels.length === 0 ? (
        <p className="muted">No channels yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Channel</th><th>Status</th><th>Videos</th><th>Last sync</th><th /></tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>{c.title}<div className="muted">{c.niche} · {c.language}</div></td>
                <td>
                  {c.isLocal ? 'PROFILE (not on YouTube)' : c.status}
                  {c.lastSyncError && <div className="error muted">{c.lastSyncError}</div>}
                </td>
                <td>{c.videos}</td>
                <td className="muted">{c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : 'never'}</td>
                <td className="row">
                  {c.status === 'CONNECTED' && canSync && (
                    <button disabled={Boolean(busy)} onClick={() => act(c.id, 'sync')}>Sync now</button>
                  )}
                  {configured && canConnect && (c.isLocal || c.status === 'NEEDS_RECONNECT' || c.status === 'DISCONNECTED') && (
                    <a href={connectUrl(c)}>{c.isLocal ? 'Connect to YouTube' : 'Reconnect'}</a>
                  )}
                  {!c.isLocal && c.status !== 'DISCONNECTED' && canDisconnect && (
                    <button disabled={Boolean(busy)} onClick={() => act(c.id, 'disconnect')}>Disconnect</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {quota && (
        <div className="card">
          <h3>YouTube quota today (Pacific day {quota.date})</h3>
          <table>
            <tbody>
              {Object.entries(quota.buckets).map(([name, b]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{b.used} / {b.limit}{b.exhausted ? ' (YouTube reports exhausted)' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Shared by every workspace. Resets at midnight Pacific Time.</p>
        </div>
      )}
    </>
  );
}
