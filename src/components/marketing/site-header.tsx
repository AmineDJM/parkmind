import Link from 'next/link';
import { LogoMark } from '@/components/ui/logo';
import { buttonVariants } from '@/components/ui';

const NAV = [
  { href: '#fonctionnement', label: 'Fonctionnement' },
  { href: '#villes', label: 'Villes' },
  { href: '#securite', label: 'Sécurité' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">Parkmind</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}>
            Se connecter
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: 'brand', size: 'sm' })}>
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}
