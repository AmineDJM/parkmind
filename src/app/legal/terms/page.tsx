import type { Metadata } from 'next';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'CGU' };

export default function TermsPage() {
  return (
    <>
      <h1>Conditions Générales d'Utilisation</h1>
      <Alert tone="warning" className="mt-4">
        Modèle indicatif à faire valider juridiquement. Ce texte ne constitue pas un
        conseil juridique.
      </Alert>

      <h2>1. Objet</h2>
      <p>
        Les présentes CGU régissent l'utilisation de Parkmind, service logiciel
        d'automatisation du stationnement urbain récurrent (« le Service »).
      </p>

      <h2>2. Description du service</h2>
      <p>
        Parkmind est un intermédiaire logiciel. Il évalue, selon des règles configurées
        par ville et vos paramètres, s'il convient d'activer une session de
        stationnement, puis exécute cette action via un opérateur — ou en mode
        simulation. Parkmind ne se substitue ni aux municipalités ni aux opérateurs.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        Vous êtes responsable de l'exactitude des informations fournies (véhicule,
        plaque, droit, zone, horaires) et de la confidentialité de vos identifiants.
      </p>

      <h2>4. Consentement aux automatisations</h2>
      <p>
        L'activation des paiements réels requiert votre consentement explicite, tracé
        et révocable à tout moment depuis vos réglages. En l'absence de consentement,
        le Service reste en mode simulation.
      </p>

      <h2>5. Sécurité financière</h2>
      <p>
        Vous définissez des plafonds journalier et mensuel ainsi qu'un seuil de
        confirmation. Le Service ne dépasse pas ces limites sans votre accord et
        applique des mécanismes anti-doublon (idempotence).
      </p>

      <h2>6. Responsabilités</h2>
      <ul>
        <li>
          Vous restez responsable du respect des règles de stationnement applicables.
        </li>
        <li>
          Parkmind ne saurait être tenu responsable d'un Forfait Post-Stationnement ou
          d'une amende résultant d'informations erronées que vous avez fournies, d'une
          indisponibilité d'un opérateur, ou de circonstances hors de son contrôle.
        </li>
        <li>
          Le Service est fourni « en l'état » ; sa disponibilité n'est pas garantie sans
          interruption.
        </li>
      </ul>

      <h2>7. Abonnement et résiliation</h2>
      <p>
        Certaines fonctionnalités relèvent d'une offre payante. Vous pouvez résilier à
        tout moment ; la résiliation prend effet à la fin de la période en cours.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans notre{' '}
        <a href="/legal/privacy">politique de confidentialité</a>.
      </p>

      <h2>9. Limitation de responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi, la responsabilité de Parkmind est
        limitée aux montants effectivement payés pour le Service au cours des douze
        derniers mois.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. Tout litige relève des
        tribunaux compétents.
      </p>

      <p className="mt-6 text-sm">Dernière mise à jour : 2026.</p>
    </>
  );
}
