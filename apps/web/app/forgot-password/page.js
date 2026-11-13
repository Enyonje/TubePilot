'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@tubepilot/auth/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const request = authClient.requestPasswordReset ?? authClient.forgetPassword;
    await request({ email, redirectTo: '/reset-password' });
    // Always the same message, so the form cannot be used to discover which emails have accounts.
    setSent(true);
    setBusy(false);
  }

  return (
    <main>
      <h1>Reset your password</h1>
      {sent ? (
        <p>If an account exists for {email}, a reset link is on its way. It expires in 1 hour.</p>
      ) : (
        <form onSubmit={submit} className="card">
          <p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          </p>
          <button className="primary" type="submit" disabled={busy}>Send reset link</button>
        </form>
      )}
      <p className="muted"><Link href="/sign-in">Back to sign in</Link></p>
    </main>
  );
}
