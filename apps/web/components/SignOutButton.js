'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@tubepilot/auth/client';

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/sign-in') } })}
    >
      Sign out
    </button>
  );
}
