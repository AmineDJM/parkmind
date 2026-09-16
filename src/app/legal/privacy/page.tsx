import type { Metadata } from 'next';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Confidentialité' };

export default function PrivacyPage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <Alert tone="warning" className="mt-4">
        Modèle indicatif à faire valider juridiquement. Ce texte ne constitue pas un
        conseil juridique.
      </Alert>

      <h2>Responsable de traitement</h2>
      <p>
        Parkmind est responsable du traitement des données collectées via le Service.
        Contact : <a href="mailto:privacy@parkmind.app">privacy@parkmind.app</a>.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Compte : nom, e-mail, préférences, journaux de consentement.</li>
        <li>Stationnement : véhicules, plaques, droits, zones, sessions, décisions.</li>
        <li>Techniques : journaux d'audit, adresse IP, agent utilisateur (sécurité).</li>
      </ul>
      <p>
        Nous appliquons le principe de <strong>minimisation</strong> : seules les données
        nécessaires au fonctionnement du Service sont collectées.
      </p>

      <h2>Aucune donnée bancaire sensible</h2>
      <p>
        Parkmind <strong>ne stocke pas</strong> vos données bancaires. Les paiements
        sont tokenisés côté opérateur ou prestataire de paiement ; nous ne conservons
        qu'une référence opaque et, le cas échéant, un libellé d'affichage (ex.
        « Visa •• 4242 »).
      </p>

      <h2>Finalités et base légale</h2>
      <ul>
        <li>Exécution du contrat : fournir le Service que vous demandez.</li>
        <li>Consentement : déclenchement des automatisations et paiements réels.</li>
        <li>Intérêt légitime : sécurité, prévention de la fraude, journalisation.</li>
      </ul>

      <h2>Durées de conservation</h2>
      <p>
        Les données sont conservées le temps de la relation contractuelle, puis
        archivées ou supprimées conformément aux obligations légales. La suppression de
        votre compte entraîne l'effacement de vos données personnelles.
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Hébergement (fournisseur cloud) et opérateurs de stationnement, dans la stricte
        mesure nécessaire à l'exécution du Service.
      </p>

      <h2>Vos droits (RGPD)</h2>
      <ul>
        <li>Accès, rectification, effacement de vos données.</li>
        <li>Portabilité : export de vos données au format JSON depuis vos réglages.</li>
        <li>Opposition et retrait du consentement à tout moment.</li>
      </ul>
      <p>
        L'export et la suppression du compte sont disponibles directement dans{' '}
        <a href="/settings">vos réglages</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        Parkmind n'utilise qu'un cookie strictement nécessaire : le cookie de session
        d'authentification. Aucun cookie publicitaire.
      </p>

      <p className="mt-6 text-sm">Dernière mise à jour : 2026.</p>
    </>
  );
}
