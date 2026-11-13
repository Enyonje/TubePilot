'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';
import { ASSIGNABLE_ROLES } from '@tubepilot/auth/permissions';

export default function MembersClient({ members, invitations, currentUserId, canInvite, canManage }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setBusy(true);
    setError('');
    const { error } = await fn();
    setBusy(false);
    if (error) setError(error.message ?? 'Request failed');
    else router.refresh();
  }

  const invite = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await authClient.organization.inviteMember({ email, role });
      if (!res.error) setEmail('');
      return res;
    });
  };

  return (
    <>
      {canInvite && (
        <form className="card row" onSubmit={invite}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" required />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="primary" type="submit" disabled={busy}>Send invite</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}

      <h3>Members</h3>
      <table>
        <tbody>
          {members.map((m) => {
            const locked = m.role === 'owner' || m.userId === currentUserId;
            return (
              <tr key={m.id}>
                <td>{m.name}<div className="muted">{m.email}</div></td>
                <td>
                  {canManage && !locked ? (
                    <select
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => run(() => authClient.organization.updateMemberRole({ memberId: m.id, role: e.target.value }))}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    m.role
                  )}
                </td>
                <td>
                  {canManage && !locked && (
                    <button disabled={busy} onClick={() => run(() => authClient.organization.removeMember({ memberIdOrEmail: m.id }))}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {invitations.length > 0 && (
        <>
          <h3>Pending invitations</h3>
          <table>
            <tbody>
              {invitations.map((i) => (
                <tr key={i.id}>
                  <td>{i.email}</td>
                  <td>{i.role}</td>
                  <td className="muted">expires {new Date(i.expiresAt).toLocaleString()}</td>
                  <td>
                    {canInvite && (
                      <button disabled={busy} onClick={() => run(() => authClient.organization.cancelInvitation({ invitationId: i.id }))}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
