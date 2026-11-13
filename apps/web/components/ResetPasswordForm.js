'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!token || params.get('error')) {
    return (
      <p className="error">
        This reset link is invalid or has expired. <Link href="/forgot-password">Request a new one</Link>.
      </p>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) return setError(error.message ?? 'Could not reset the password');
    router.push('/sign-in');
  }

  return (
    <form onSubmit={submit} className="card">
      <p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (10+ characters)"
          minLength={10}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </p>
      <button className="primary" type="submit" disabled={busy}>Set new password</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
