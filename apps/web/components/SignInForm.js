'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';

export default function SignInForm({ googleEnabled, next }) {
  const router = useRouter();
  const [mode, setMode] = useState('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    if (mode === 'sign-up') {
      const { data, error } = await authClient.signUp.email({ name, email, password, callbackURL: next });
      setBusy(false);
      if (error) return setError(error.message ?? 'Could not create the account');
      if (data?.token) {
        router.push(next);
        router.refresh();
      } else {
        setNotice('Account created. Check your email for the verification link, then sign in.');
        setMode('sign-in');
      }
      return;
    }

    const { error } = await authClient.signIn.email({ email, password, callbackURL: next });
    setBusy(false);
    if (error) {
      return setError(
        error.status === 403
          ? 'Please verify your email first. We sent you a new link.'
          : (error.message ?? 'Sign-in failed'),
      );
    }
    router.push(next);
    router.refresh();
  }

  async function google() {
    setError('');
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: next });
    if (error) setError(error.message ?? 'Google sign-in failed');
  }

  const signingUp = mode === 'sign-up';

  return (
    <>
      <h2>{signingUp ? 'Create your account' : 'Sign in'}</h2>
      <form onSubmit={submit} className="card">
        {signingUp && (
          <p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
          </p>
        )}
        <p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" required />
        </p>
        <p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={signingUp ? 'Password (10+ characters)' : 'Password'}
            minLength={signingUp ? 10 : undefined}
            maxLength={128}
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            required
          />
        </p>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
        {error && <p className="error">{error}</p>}
        {notice && <p>{notice}</p>}
      </form>

      {googleEnabled && (
        <p>
          <button onClick={google}>Continue with Google</button>
        </p>
      )}

      <p className="muted">
        {signingUp ? 'Already have an account? ' : 'New here? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(signingUp ? 'sign-in' : 'sign-up'); setError(''); }}>
          {signingUp ? 'Sign in' : 'Create an account'}
        </a>
        {!signingUp && (
          <>
            {' · '}
            <Link href="/forgot-password">Forgot password?</Link>
          </>
        )}
      </p>
    </>
  );
}
