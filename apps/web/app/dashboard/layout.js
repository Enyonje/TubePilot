import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@tubepilot/auth';
import SignOutButton from '../../components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');

  return (
    <>
      <nav>
        <strong>TubePilot AI</strong>
        <Link href="/dashboard">Overview</Link>
        <Link href="/dashboard/channels">Channels</Link>
        <Link href="/dashboard/topics">Topics</Link>
        <Link href="/dashboard/videos">Videos</Link>
        <Link href="/dashboard/members">Members</Link>
        <span className="spacer" />
        <span className="muted">{ctx.user.email}</span>
        <SignOutButton />
      </nav>
      <main>{children}</main>
    </>
  );
}
