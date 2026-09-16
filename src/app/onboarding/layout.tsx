import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { LogoMark } from '@/components/ui/logo';
import { logoutAction } from '@/server/actions/auth';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.onboardedAt) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">Parkmind</span>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
