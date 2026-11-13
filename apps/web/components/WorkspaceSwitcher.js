'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'workspace';

export default function WorkspaceSwitcher({ workspaces, activeId }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function switchTo(organizationId) {
    const { error } = await authClient.organization.setActive({ organizationId });
    if (error) setError(error.message ?? 'Could not switch');
    else router.refresh();
  }

  async function create(e) {
    e.preventDefault();
    setError('');
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await authClient.organization.create({ name, slug });
    if (error) return setError(error.message ?? 'Could not create workspace');
    setName('');
    await authClient.organization.setActive({ organizationId: data.id });
    router.refresh();
  }

  return (
    <div className="card">
      <h3>Workspaces</h3>
      <div className="row">
        {workspaces.map((w) => (
          <button key={w.id} className={w.id === activeId ? 'primary' : ''} onClick={() => switchTo(w.id)}>
            {w.name} <span className="muted">({w.role})</span>
          </button>
        ))}
      </div>
      <form className="row" onSubmit={create} style={{ marginTop: '1rem' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New workspace name" required />
        <button type="submit">Create</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
