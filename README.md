# Parkmind — le pilote automatique du stationnement urbain

Parkmind supprime la charge mentale du stationnement récurrent. Vous configurez
**une seule fois** (véhicule, ville, zone, droit, jours, horaires, opérateur) et
Parkmind décide ensuite automatiquement **s'il faut** activer un stationnement,
**dans quelle zone**, à **quel tarif**, pour **quelle durée** et **à quel moment** —
puis l'exécute quand c'est techniquement et juridiquement possible.

> Parkmind est un **intermédiaire logiciel**. Les règles des municipalités et des
> opérateurs restent applicables. Tant qu'une intégration opérateur officielle
> n'est pas disponible, Parkmind fonctionne en **mode simulation** (aucune dépense).

---

## Sommaire

- [Aperçu du produit](#aperçu-du-produit)
- [Architecture](#architecture)
- [Le moteur d'automatisation](#le-moteur-dautomatisation)
- [Villes & règles](#villes--règles)
- [Opérateurs (providers)](#opérateurs-providers)
- [Sécurité financière](#sécurité-financière)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données](#base-de-données)
- [Automatisations & cron](#automatisations--cron)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Compte de démonstration](#compte-de-démonstration)
- [Limitations actuelles](#limitations-actuelles)
- [Prochaines étapes](#prochaines-étapes)

---

## Aperçu du produit

| Domaine | Ce qui est livré |
| --- | --- |
| Landing | Page premium (problème, fonctionnement, villes, économie de FPS, sécurité, tarifs, FAQ). |
| Auth | Inscription, connexion, **magic link**, vérification e-mail, mot de passe oublié/réinitialisation. |
| Onboarding | Assistant en 5 étapes → « Parkmind est activé ». |
| Dashboard | Statut actif/pause, session en cours, coûts jour/mois, FPS évités, **décision du moteur en direct**, historique, alertes. |
| Gestion | Véhicules, droits de stationnement, automatisations (CRUD), historique, notifications, réglages. |
| Moteur | `decide(context) → decision` pur, explicable, testé. |
| Providers | Abstraction `ParkingProvider` + `MockParkingProvider` fonctionnel + adapters stub documentés. |
| Sécurité | Plafonds jour/mois, seuil de confirmation, idempotence, kill switch, mode simulation, audit. |
| Admin | `/admin` : métriques, contrôles système, santé opérateurs, villes, utilisateurs, journaux. |
| RGPD | Consentement tracé, export JSON, suppression de compte. |

---

## Architecture

**Stack** : Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind ·
auth maison (JWT `jose` + `bcryptjs`) · Vitest.

Principe directeur : **le moteur, les règles de ville et les opérateurs sont
découplés de l'interface** et testables sans base de données.

```
src/
  engine/         # Moteur d'automatisation PUR (aucune dépendance DB/UI)
    decide.ts     #   pipeline de décision explicable
    pricing.ts    #   calcul des montants
    types.ts      #   ParkingContext / ParkingDecision
  cities/         # Règles PAR VILLE (source de vérité) — jamais dans le frontend
    paris.ts, bordeaux.ts, ...  holidays.ts (jours fériés FR)
  providers/      # Abstraction opérateur + Mock + stubs (PayByPhone, EasyPark, …)
  domain/         # Enums de domaine partagés
  lib/            # db, auth, env, time, utils, display, schedule
  server/         # Couche serveur : executor, context-builder, notifications,
                  # audit, consent, settings, billing, catalog, actions/*
  components/     # UI (design system), app, marketing, auth, onboarding
  app/            # Routes Next.js (landing, auth, onboarding, app, admin, api)
prisma/           # schema.prisma, migrations, seed.ts
tests/            # tests du moteur, providers, villes
```

Le flux d'une décision :

```
user + vehicle + parking_right + location + calendar + city_rules + operator
      → ParkingContext → decide() → ParkingDecision → executor → session/paiement/notif/audit
```

---

## Le moteur d'automatisation

`src/engine/decide.ts` est une **fonction pure**. Il reçoit un `ParkingContext`
et renvoie une décision typée :

- `NO_ACTION` — rien à faire (jour gratuit, hors horaires, session déjà active…)
- `START_SESSION` — démarrer une session
- `EXTEND_SESSION` — prolonger une session horaire qui expire bientôt
- `STOP_SESSION` — arrêter (exposé pour usage manuel)
- `REQUIRE_USER_CONFIRMATION` — droit expiré, zone inconnue, dépassement de plafond…
- `ERROR` — contexte/config invalide

Chaque décision est **explicable** (liste de raisons) et **journalisée** :

```
Decision: START_SESSION
Reason:
- véhicule AA-123-AA présent dans Paris 16e
- droit Résident valide
- stationnement payant actif aujourd'hui (mardi)
- aucune session active
- tarif applicable : PAR-RES-DAY — 1,50 € pour 660 min
- mode simulation : aucun paiement réel
```

Ordre des garde-fous : kill switch → automatisations globales → ville → opérateur →
pause utilisateur → règle → consentement → zone → calendrier (fériés, jours/horaires
payants, gratuité résident) → planning → présence véhicule → validité du droit →
session existante → **plafonds & seuil** → démarrage.

---

## Villes & règles

Les règles sont déclarées **par ville** dans `src/cities/` (jamais dans le frontend).
Ajouter une ville = ajouter un objet de configuration.

- **Paris** — LIVE (20 arrondissements, lun–sam 9 h–20 h, gratuité résident en août).
- **Bordeaux, Lyon, Marseille, Lille, Toulouse** — BETA.

Chaque ville définit : opérateurs, zones, jours/horaires payants, jours fériés (calcul
automatique des fêtes mobiles), durée max, tarifs, droits résident/pro/visiteur,
contraintes. Les rangées `City`/`ParkingZone` en base **reflètent** cette config
(pour l'intégrité référentielle et les bascules admin) ; le code reste la source de
vérité.

> Les tarifs et règles fournis sont des **approximations configurables** à but de
> démonstration. Les règles municipales/opérateurs font foi.

---

## Opérateurs (providers)

Interface unique `ParkingProvider` :
`startSession` · `extendSession` · `stopSession` · `getSession` · `getTariffs` · `validateVehicle`.

- `MockParkingProvider` — **pleinement fonctionnel** (idempotent, échecs simulables),
  utilisé pour l'MVP, les tests, les démos et le mode simulation.
- `PayByPhoneProvider`, `EasyParkProvider`, `IndigoProvider`, `FlowbirdProvider` —
  **stubs** qui renvoient toujours `NOT_IMPLEMENTED`. Ils **ne simulent jamais** une
  intégration réelle. Chaque fichier documente l'API officielle requise.

> ⚠️ Aucune sécurité n'est contournée et aucune API non autorisée n'est utilisée.
> Une intégration réelle se branche dans `src/providers/*` sans toucher au reste de
> l'application.

---

## Sécurité financière

- Plafond **journalier** et **mensuel** (utilisateur) + plafonds **plateforme** (env).
- **Seuil de confirmation** au-delà d'un montant.
- **Idempotence** : une seule session par règle et par jour (clé unique en base) —
  jamais de double achat.
- **Kill switch** global (admin) + **pause** instantanée (utilisateur).
- **Mode simulation** : décisions réelles, dépenses nulles.
- **Journal d'audit** complet de chaque décision et action.

---

## Installation locale

Prérequis : Node ≥ 20, PostgreSQL ≥ 14.

```bash
git clone <repo> && cd parkmind
cp .env.example .env          # puis éditez DATABASE_URL et les secrets
npm install                   # installe + prisma generate

# Base de données locale
createdb parkmind             # ou via psql
npx prisma migrate deploy     # applique les migrations
npm run db:seed               # données de démo (Amine / Paris 16e)

npm run dev                   # http://localhost:3000
```

---

## Variables d'environnement

Voir [`.env.example`](./.env.example). Les principales :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL (Prisma). |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens e-mail, cron). |
| `AUTH_SECRET` | Signature des sessions JWT et tokens (≥ 32 caractères). |
| `CRON_SECRET` | Jeton requis pour appeler `/api/cron/automation`. |
| `DEFAULT_SIMULATION_MODE` | Simulation par défaut (recommandé `true`). |
| `PARKMIND_KILL_SWITCH` | Kill switch bootstrap (surchargé en base par l'admin). |
| `PLATFORM_DAILY_CAP_EUR` / `PLATFORM_MONTHLY_CAP_EUR` | Plafonds plateforme. |
| `MAIL_DRIVER` | `console` (défaut) · `smtp` · `resend`. |
| `STRIPE_SECRET_KEY` | Optionnel — active la facturation quand présent. |
| `ADMIN_EMAILS` | E-mails promus ADMIN à l'inscription. |

---

## Base de données

Modèle Prisma complet (`prisma/schema.prisma`) :
`users`, `user_preferences`, `auth_tokens`, `consent_logs`, `cities`, `parking_zones`,
`parking_providers`, `provider_connections`, `vehicles`, `parking_rights`,
`automation_rules`, `parking_sessions`, `payments`, `notifications`, `audit_logs`,
`system_settings`.

Montants stockés en **centimes entiers**. Aucune donnée bancaire sensible : seules une
référence opaque et un libellé d'affichage sont conservés.

Scripts : `npm run db:migrate` (dev) · `npm run db:deploy` (prod) · `npm run db:seed` ·
`npm run db:reset`.

---

## Automatisations & cron

Le moteur est déclenché par un endpoint sécurisé :

```
GET/POST /api/cron/automation
Authorization: Bearer $CRON_SECRET
```

Il exécute `runDueAutomations()` sur toutes les règles actives. Planifiez-le toutes
les 10–15 min (voir [Déploiement](#déploiement)). En local :

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/automation
# ou, sans serveur web :
npm run worker
```

Healthcheck : `GET /api/health` → `{ status, db }` (200/503).

---

## Tests

Le **moteur** est bien plus testé que le frontend (cœur du produit). Aucun accès DB
requis — les tests sont purs et rapides.

```bash
npm test           # Vitest (moteur, providers, villes)
npm run typecheck  # tsc --noEmit
npm run lint
```

Couverture des cas clés : jour férié → `NO_ACTION`, droit expiré → confirmation,
session déjà active → `NO_ACTION`, paiement refusé → erreur, mauvaise zone → pas
d'achat, dépassement de plafond → confirmation, automatisation désactivée →
`NO_ACTION`, parking gratuit → `NO_ACTION`, prolongation, etc.

---

## Déploiement

Le dépôt cible une base **PostgreSQL managée** (ex. Render) via `DATABASE_URL`.

### Render (blueprint fourni : `render.yaml`)

- Service **web** : build `npm ci && npx prisma migrate deploy && npm run build`,
  start `npm run start`, healthcheck `/api/health`.
- Service **cron** `parkmind-automation` : appelle l'endpoint toutes les 15 min.
- Renseignez `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`, et le **même**
  `CRON_SECRET` sur les deux services. `AUTH_SECRET` est généré automatiquement.
- Lancez le seed une fois (shell Render) : `npm run db:seed` (optionnel).

### Vercel (`vercel.json` fourni)

- Déployez le projet, ajoutez une base Postgres, définissez les variables.
- Le cron Vercel appelle `/api/cron/automation` (Vercel ajoute automatiquement
  l'en-tête `Authorization: Bearer $CRON_SECRET` si `CRON_SECRET` est défini).

### Docker (`Dockerfile` fourni)

```bash
docker build -t parkmind .
docker run -p 3000:3000 --env-file .env parkmind
```

---

## Compte de démonstration

Après `npm run db:seed` :

```
E-mail   : demo@parkmind.app
Mot de passe : parkmind
Rôle     : ADMIN (accès /admin)
```

Scénario : **Amine**, Peugeot 208 **AA-123-AA**, **Paris 16e**, résident, lun–ven,
avec un historique réaliste (sessions simulées, un paiement refusé, une confirmation
en attente) et une session active du jour.

---

## Limitations actuelles

- **Aucune intégration opérateur réelle** : seul le Mock est fonctionnel ; les
  opérateurs réels restent en simulation (par conception).
- **Localisation** : la présence du véhicule est déclarée par l'utilisateur (pas
  encore de GPS/géofencing).
- **E-mail** : driver `console` par défaut (les liens magiques s'affichent en dev).
- **Facturation** : structure de plans prête ; Stripe désactivé sans clés.
- Règles de ville = approximations configurables, non contractuelles.

---

## Prochaines étapes

1. Intégrations opérateurs officielles (PayByPhone/EasyPark/…) via `src/providers/*`.
2. Localisation : GPS mobile, géofencing, véhicule connecté, CarPlay/Android Auto.
3. Notifications SMS/push (architecture déjà prévue via `NotificationChannel`).
4. Facturation Stripe (abonnements, webhooks).
5. Nouvelles villes/pays (ajout de configs dans `src/cities/`).
6. Vérification des justificatifs de droits (upload + validation).

---

_Parkmind — configurez une fois, ne pensez plus jamais à votre ticket._
