import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Inscription' };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Créer votre compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gratuit. Démarrez en mode simulation, sans carte bancaire.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-xs text-muted-foreground">
        En créant un compte, vous acceptez nos{' '}
        <a href="/legal/terms" className="underline">CGU</a> et notre{' '}
        <a href="/legal/privacy" className="underline">politique de confidentialité</a>.
      </p>
    </div>
  );
}
