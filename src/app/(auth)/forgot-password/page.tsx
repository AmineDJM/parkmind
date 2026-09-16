import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez votre e-mail, nous vous enverrons un lien de réinitialisation.
        </p>
      </div>
      <ForgotForm />
    </div>
  );
}
