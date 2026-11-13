import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>TubePilot AI</h1>
      <p>
        <Link href="/sign-in">Sign in or create an account</Link>
      </p>
      <p className="muted">
        <Link href="/dashboard">Dashboard</Link> · <a href="/api/health">System health</a>
      </p>
    </main>
  );
}
