import { getEnv } from '@tubepilot/config';
import { safeRedirectPath } from '@tubepilot/auth/redirect';
import SignInForm from '../../components/SignInForm';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }) {
  const { next } = await searchParams;
  const env = getEnv();
  return (
    <main>
      <h1>TubePilot AI</h1>
      <SignInForm
        googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
        next={safeRedirectPath(next)}
      />
    </main>
  );
}
