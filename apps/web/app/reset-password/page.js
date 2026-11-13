import { Suspense } from 'react';
import ResetPasswordForm from '../../components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <main>
      <h1>Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
