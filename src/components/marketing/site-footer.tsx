import Link from 'next/link';
import { LogoMark } from '@/components/ui/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-lg font-bold tracking-tight">Parkmind</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Le pilote automatique du stationnement urbain.
            </p>
          </div>
          <FooterCol
            title="Produit"
            links={[
              { href: '/#fonctionnement', label: 'Fonctionnement' },
              { href: '/#villes', label: 'Villes' },
              { href: '/#tarifs', label: 'Tarifs' },
            ]}
          />
          <FooterCol
            title="Légal"
            links={[
              { href: '/legal/how-it-works', label: 'Cadre & fonctionnement' },
              { href: '/legal/terms', label: 'CGU' },
              { href: '/legal/privacy', label: 'Confidentialité' },
            ]}
          />
          <FooterCol
            title="Compte"
            links={[
              { href: '/login', label: 'Se connecter' },
              { href: '/signup', label: 'Créer un compte' },
            ]}
          />
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Parkmind — Le pilote automatique du stationnement urbain.</p>
          <p>
            Parkmind est un intermédiaire logiciel. Les règles des municipalités et
            opérateurs restent applicables.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
