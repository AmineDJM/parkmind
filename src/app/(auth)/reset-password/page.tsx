import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetForm } from '@/components/auth/forms';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Réinitialiser le mot de passe' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Alert tone="danger">
          Lien invalide.{' '}
          <Link href="/forgot-password" className="underline">
            Refaire une demande
          </Link>
          .
        </Alert>
      )}
    </div>
  );
}
