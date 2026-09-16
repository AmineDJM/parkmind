import Link from 'next/link';
import {
  ArrowRight,
  Car,
  ShieldCheck,
  Sparkles,
  Gauge,
  Clock,
  Bell,
  Check,
  Lock,
  CreditCard,
  Repeat,
  CircleSlash,
  ScanLine,
} from 'lucide-react';
import { listCityRules } from '@/cities';
import { PLANS } from '@/server/billing';
import { FPS_VALUE_EUR } from '@/lib/display';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Badge, Card, CardContent, StatusDot, buttonVariants } from '@/components/ui';

export default function LandingPage() {
  const cities = listCityRules();
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Cities cities={cities} />
        <Savings />
        <Security />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 md:py-28 ${className ?? ''}`}>
      <div className="container">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">{children}</p>
  );
}

function Hero() {
  return (
    <section className="bg-brand-radial relative overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-40" />
      <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <div className="animate-fade-in">
          <Badge variant="brand" className="mb-5">
            <StatusDot tone="success" /> Paris en direct · nouvelles villes en bêta
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
            Ne pensez plus jamais à votre ticket de stationnement.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Parkmind est le pilote automatique du stationnement urbain. Il décide
            <em> quand</em>, <em>où</em>, à <em>quel tarif</em> et pour <em>quelle durée</em>
            {' '}activer votre stationnement — puis s'en charge, au bon moment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className={buttonVariants({ variant: 'brand', size: 'lg' })}>
              Activer Parkmind <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#fonctionnement" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Voir le fonctionnement
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Gratuit en mode simulation · Sans carte bancaire.
          </p>
        </div>

        {/* Status card mock */}
        <div className="animate-fade-in lg:justify-self-end">
          <Card className="w-full max-w-sm shadow-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <StatusDot tone="success" pulse /> Actif
                </span>
                <Badge variant="info">Simulation</Badge>
              </div>
              <div className="mt-5 flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4" />
                <span className="font-medium text-foreground">Peugeot 208</span>
                <span className="font-mono text-sm">— AB-123-CD</span>
              </div>
              <p className="text-sm text-muted-foreground">Paris · Paris 16e</p>
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aujourd'hui
                </p>
                <p className="mt-1 text-lg font-semibold">Stationnement activé</p>
                <p className="mt-1 text-muted-foreground">09:00 → 19:00</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">1,50 €</p>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">Tout est sous contrôle.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    {
      icon: <Repeat className="h-5 w-5" />,
      title: 'La charge mentale',
      body: 'Résident ou pro sédentaire, vous devez sans cesse penser à payer ou renouveler via PayByPhone, EasyPark ou Indigo.',
    },
    {
      icon: <CircleSlash className="h-5 w-5" />,
      title: 'Le risque de FPS',
      body: `Un oubli = un Forfait Post-Stationnement (souvent ${FPS_VALUE_EUR} € à Paris). Cher, et évitable.`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Le temps perdu',
      body: "Chaque semaine, quelques minutes et beaucoup d'attention pour une tâche répétitive et sans valeur.",
    },
  ];
  return (
    <Section id="probleme">
      <Eyebrow>Le problème</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Le stationnement récurrent est une corvée invisible.
      </h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.title}>
            <CardContent className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
                {it.icon}
              </div>
              <h3 className="mt-4 font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: 'Configurez une fois',
      body: 'Véhicule, plaque, ville, zone, jours, horaires, opérateur. Deux minutes, une seule fois.',
    },
    {
      n: 2,
      title: 'Le moteur décide',
      body: 'Jours payants, jours fériés, droit valide, plafonds : chaque décision est vérifiée et explicable.',
    },
    {
      n: 3,
      title: 'La session s’active',
      body: 'Via votre opérateur — ou en mode simulation tant que l’intégration officielle n’est pas disponible.',
    },
    {
      n: 4,
      title: 'Vous êtes prévenu',
      body: 'Uniquement si c’est utile : confirmation, erreur de paiement, droit expiré ou action requise.',
    },
  ];
  return (
    <Section id="fonctionnement" className="bg-card">
      <Eyebrow>Comment ça marche</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Un pilote automatique, pas un simple rappel.
      </h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-border bg-background p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
              {s.n}
            </span>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-background p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Le moteur Parkmind, conceptuellement
        </p>
        <code className="font-mono text-sm text-foreground">
          user + véhicule + droit + zone + calendrier + règles ville + opérateur → action
        </code>
      </div>
    </Section>
  );
}

function Cities({ cities }: { cities: ReturnType<typeof listCityRules> }) {
  return (
    <Section id="villes">
      <Eyebrow>Couverture</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Conçu pour la France, pensé pour l’Europe.
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Architecture multi-villes et multi-opérateurs (PayByPhone, EasyPark, Indigo
        Neo, Flowbird, apps municipales). Les règles sont configurées par ville.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cities.map((c) => (
          <div key={c.slug} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <span className="font-medium">{c.name}</span>
            <Badge variant={c.status === 'LIVE' ? 'success' : 'warning'}>
              {c.status === 'LIVE' ? 'En direct' : 'Bêta'}
            </Badge>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4 text-muted-foreground">
          <span className="font-medium">Europe</span>
          <Badge variant="outline">Bientôt</Badge>
        </div>
      </div>
    </Section>
  );
}

function Savings() {
  return (
    <Section id="economie" className="bg-card">
      <Eyebrow>L’économie de FPS</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Un oubli coûte cher. Parkmind, non.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <StatBig value={`${FPS_VALUE_EUR} €`} label="Un FPS évité (Paris)" accent />
        <StatBig value="≈ 6,99 €/mois" label="Abonnement Parkmind" />
        <StatBig value="≈ 8 mois" label="couverts par 1 seul FPS évité" />
      </div>
      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        Estimation indicative. Le montant réellement économisé dépend de vos habitudes
        et des règles locales.
      </p>
    </Section>
  );
}

function StatBig({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-6 ${accent ? 'bg-brand-soft' : 'bg-background'}`}>
      <p className={`text-3xl font-bold tracking-tight md:text-4xl ${accent ? 'text-brand' : ''}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Security() {
  const items = [
    { icon: <Gauge className="h-5 w-5" />, title: 'Plafonds jour & mois', body: 'Des limites strictes que le moteur ne dépasse jamais sans votre accord.' },
    { icon: <Bell className="h-5 w-5" />, title: 'Confirmation au-delà d’un montant', body: 'Un seuil déclenche une demande de confirmation explicite.' },
    { icon: <ShieldCheck className="h-5 w-5" />, title: 'Aucune double session', body: 'Clés d’idempotence : jamais deux tickets pour la même période.' },
    { icon: <CircleSlash className="h-5 w-5" />, title: 'Kill switch instantané', body: 'Mise en pause immédiate, côté utilisateur comme administrateur.' },
    { icon: <Sparkles className="h-5 w-5" />, title: 'Mode simulation', body: 'Testez toutes les décisions sans dépenser un centime.' },
    { icon: <Lock className="h-5 w-5" />, title: 'Aucune donnée bancaire stockée', body: 'Les paiements restent tokenisés côté opérateur. Parkmind ne stocke pas votre carte.' },
    { icon: <ScanLine className="h-5 w-5" />, title: 'Journal d’audit complet', body: 'Chaque décision est explicable et tracée.' },
    { icon: <CreditCard className="h-5 w-5" />, title: 'Retry contrôlé', body: 'Les erreurs sont gérées proprement, sans emballement.' },
  ];
  return (
    <Section id="securite">
      <Eyebrow>Sécurité financière</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Sécurisé par conception.
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Une automatisation ne doit jamais pouvoir acheter 50 tickets à cause d’un bug.
        La sécurité financière est intégrée au cœur du moteur.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              {it.icon}
            </div>
            <h3 className="mt-3 text-sm font-semibold">{it.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Pricing() {
  return (
    <Section id="tarifs" className="bg-card">
      <Eyebrow>Tarifs</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        Des offres simples.
      </h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <div
            key={p.tier}
            className={`flex flex-col rounded-xl border bg-background p-6 ${p.highlighted ? 'border-brand ring-2 ring-brand shadow-glow' : 'border-border'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              {p.highlighted && <Badge variant="brand">Populaire</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <p className="mt-4 text-3xl font-bold tracking-tight">
              {p.priceEurMonth === null
                ? 'Sur devis'
                : p.priceEurMonth === 0
                  ? '0 €'
                  : `${p.priceEurMonth.toFixed(2)} €`}
              {p.priceEurMonth ? <span className="text-sm font-normal text-muted-foreground">/mois</span> : null}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {p.tier === 'FLEET' ? (
              <a href="mailto:contact@parkmind.app" className={buttonVariants({ variant: 'outline', className: 'mt-6 w-full' })}>
                Nous contacter
              </a>
            ) : (
              <Link href="/signup" className={buttonVariants({ variant: p.highlighted ? 'brand' : 'outline', className: 'mt-6 w-full' })}>
                Commencer
              </Link>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Faq() {
  const qa = [
    { q: 'Est-ce légal ?', a: "Parkmind est un intermédiaire logiciel qui vous aide à ne pas oublier de payer. Il respecte les règles municipales et opérateurs, et ne contourne aucune sécurité." },
    { q: 'Mes données bancaires sont-elles stockées ?', a: "Non. Les paiements restent tokenisés côté opérateur ou prestataire de paiement. Parkmind ne stocke jamais votre carte." },
    { q: 'Puis-je tester sans payer ?', a: "Oui. Le mode simulation prend toutes les décisions sans dépenser d’argent — idéal pour vérifier la fiabilité avant d’autoriser les paiements réels." },
    { q: 'Quels opérateurs sont pris en charge ?', a: "L’architecture supporte PayByPhone, EasyPark, Indigo Neo, Flowbird et les apps municipales. Tant qu’une intégration officielle n’est pas disponible, l’opérateur fonctionne en simulation." },
    { q: 'Quelles villes ?', a: "Paris est en direct ; Bordeaux, Lyon, Marseille, Lille et Toulouse sont en bêta. Les règles sont configurées par ville, l’extension est rapide." },
    { q: 'Puis-je mettre en pause ?', a: "Oui, instantanément, depuis votre tableau de bord. Un kill switch global existe également côté administrateur." },
  ];
  return (
    <Section id="faq">
      <Eyebrow>FAQ</Eyebrow>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Questions fréquentes</h2>
      <div className="mt-8 max-w-3xl divide-y divide-border rounded-xl border border-border bg-card">
        {qa.map((item) => (
          <details key={item.q} className="group px-5">
            <summary className="flex cursor-pointer items-center justify-between py-4 font-medium marker:content-['']">
              {item.q}
              <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(180_82%_20%)] to-[hsl(162_84%_16%)] p-10 text-white md:p-16">
        <div className="bg-grid absolute inset-0 opacity-20" />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Activez le pilote automatique.
          </h2>
          <p className="mt-3 text-white/80">
            Configurez une fois. Ne pensez plus jamais à votre ticket. Commencez
            gratuitement, en mode simulation.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-[hsl(162_84%_16%)] transition-colors hover:bg-white/90"
            >
              Créer mon compte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
