/**
 * Navigation data — a plain (non-client) module so it can be imported as real
 * data by both the server layout and the client nav components. Importing these
 * values directly from a 'use client' module would yield client references, not
 * the array itself.
 */
export type NavIconKey =
  | 'dashboard'
  | 'car'
  | 'rights'
  | 'automations'
  | 'history'
  | 'bell'
  | 'settings'
  | 'admin';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  badge?: number;
  admin?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { href: '/vehicles', label: 'Véhicules', icon: 'car' },
  { href: '/rights', label: 'Droits', icon: 'rights' },
  { href: '/automations', label: 'Automatisations', icon: 'automations' },
  { href: '/history', label: 'Historique', icon: 'history' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/settings', label: 'Réglages', icon: 'settings' },
];
