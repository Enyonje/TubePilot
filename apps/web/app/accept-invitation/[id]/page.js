'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';

export default function AcceptInvitationPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setError('');
    const { data, error } = await authClient.organization.acceptInvitation({ invitationId: id });
    if (error) {
      setError(error.message ?? 'Could not accept invitation');
      setBusy(false);
      return;
    }
    const organizationId = data?.invitation?.organizationId ?? data?.member?.organizationId;
    if (organizationId) await authClient.organization.setActive({ organizationId });
    router.push('/dashboard');
    router.refresh();
  }

  if (isPending) return <main><p>Loading…</p></main>;

  return (
    <main>
      <h1>Workspace invitation</h1>
      {session ? (
        <>
          <p>Signed in as {session.user.email}. The invitation must have been sent to this address.</p>
          <button className="primary" onClick={accept} disabled={busy}>Accept invitation</button>
        </>
      ) : (
        <>
          <p>Sign in, or create an account, using the email address that received the invitation.</p>
          <Link href={`/sign-in?next=/accept-invitation/${id}`}>
            <button className="primary">Sign in or create an account</button>
          </Link>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
