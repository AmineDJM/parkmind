import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck, Sparkles, Gauge } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { LogoMark } from '@/components/ui/logo';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? '/dashboard' : '/onboarding');

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[hsl(180_82%_20%)] to-[hsl(162_84%_16%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid absolute inset-0 opacity-20" />
        <Link href="/" className="relative z-10 inline-flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">Parkmind</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-balance">
            Ne pensez plus jamais à votre ticket de stationnement.
          </h2>
          <p className="mt-4 text-white/70">
            Configurez une fois. Parkmind décide, active et vous prévient — au
            bon moment, dans la bonne zone, au bon tarif.
          </p>
          <ul className="mt-8 space-y-3.5 text-sm text-white/90">
            <li className="flex items-center gap-3">
              <Gauge className="h-5 w-5 shrink-0 text-white/80" />
              Un moteur de décision explicable, testé et journalisé.
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-white/80" />
              Plafonds, confirmations et kill switch : zéro mauvaise surprise.
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-white/80" />
              Mode simulation : testez sans dépenser un centime.
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/50">
          Parkmind est un intermédiaire logiciel. Les règles des municipalités et
          des opérateurs restent applicables.
        </p>
      </aside>

      {/* Form area */}
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 lg:hidden"
          >
            <LogoMark />
            <span className="text-lg font-bold tracking-tight">Parkmind</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
