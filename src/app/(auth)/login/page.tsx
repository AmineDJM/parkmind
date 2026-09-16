import type { Metadata } from 'next';
import { LoginForm, MagicLinkForm } from '@/components/auth/forms';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bon retour</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous pour piloter votre stationnement.
        </p>
      </div>

      {sp.reset && (
        <Alert tone="success">Mot de passe mis à jour. Vous pouvez vous connecter.</Alert>
      )}
      {sp.error === 'magic' && (
        <Alert tone="danger">Lien de connexion invalide ou expiré.</Alert>
      )}
      {sp.error === 'verify' && (
        <Alert tone="danger">Lien de vérification invalide ou expiré.</Alert>
      )}

      <LoginForm />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          ou sans mot de passe
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <MagicLinkForm />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <a href="/signup" className="font-semibold text-brand hover:underline">
          Créer un compte
        </a>
      </p>
    </div>
  );
}
