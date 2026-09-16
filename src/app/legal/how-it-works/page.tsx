import type { Metadata } from 'next';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Fonctionnement & cadre' };

export default function HowItWorksPage() {
  return (
    <>
      <h1>Parkmind : fonctionnement et cadre</h1>
      <Alert tone="info" className="mt-4">
        Cette page explique clairement ce que fait Parkmind — et ce qu'il ne fait pas.
      </Alert>

      <h2>Un intermédiaire logiciel</h2>
      <p>
        Parkmind est un <strong>intermédiaire logiciel</strong> qui vous aide à ne pas
        oublier de payer votre stationnement récurrent. Il ne remplace ni la
        municipalité, ni l'opérateur de stationnement : il orchestre, au bon moment,
        une action que vous auriez faite vous-même.
      </p>

      <h2>Les règles municipales et opérateurs font foi</h2>
      <p>
        Parkmind s'appuie sur des règles configurées par ville (jours et horaires
        payants, jours fériés, zones, tarifs, droits résident/professionnel). Ces
        règles sont des approximations destinées à automatiser une décision ; elles ne
        sont pas contractuelles. En cas de divergence, <strong>les règles officielles
        de la municipalité et de l'opérateur prévalent toujours</strong>.
      </p>

      <h2>Aucune technique interdite</h2>
      <p>
        Parkmind ne contourne aucune sécurité et n'utilise aucune API non autorisée.
        Tant qu'une intégration officielle avec un opérateur (PayByPhone, EasyPark,
        Indigo Neo, Flowbird, apps municipales) n'est pas disponible, l'opérateur
        correspondant fonctionne en <strong>mode simulation</strong> : les décisions
        sont prises et affichées, mais aucun paiement réel n'est effectué.
      </p>

      <h2>Vous gardez le contrôle</h2>
      <ul>
        <li>Mode simulation pour tester sans dépenser.</li>
        <li>Plafonds journalier et mensuel, seuil de confirmation.</li>
        <li>Mise en pause instantanée et kill switch.</li>
        <li>Chaque décision est explicable et journalisée.</li>
      </ul>

      <h2>Le moteur, en une ligne</h2>
      <p>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
          user + véhicule + droit + zone + calendrier + règles ville + opérateur → action
        </code>
      </p>
      <p>
        Le moteur produit toujours l'une de ces décisions : ne rien faire, démarrer une
        session, prolonger, arrêter, demander votre confirmation, ou signaler une
        erreur — avec les raisons associées.
      </p>
    </>
  );
}
