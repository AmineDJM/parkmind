import type { ProviderKey } from '@/domain/enums';
import type { ParkingProvider } from './types';
import { MockParkingProvider } from './mock';
import { PayByPhoneProvider } from './paybyphone';
import { EasyParkProvider } from './easypark';
import { IndigoProvider } from './indigo';
import { FlowbirdProvider } from './flowbird';

/** Singleton adapter instances, keyed by operator. */
const instances: Record<ProviderKey, ParkingProvider> = {
  MOCK: new MockParkingProvider(),
  PAYBYPHONE: new PayByPhoneProvider(),
  EASYPARK: new EasyParkProvider(),
  INDIGO_NEO: new IndigoProvider(),
  FLOWBIRD: new FlowbirdProvider(),
};

export function getProvider(key: ProviderKey): ParkingProvider {
  return instances[key];
}

export interface ProviderCatalogEntry {
  key: ProviderKey;
  name: string;
  isImplemented: boolean;
  health: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'NOT_IMPLEMENTED';
  website?: string;
  notes?: string;
}

/** Static catalog used to seed the `parking_providers` table. */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    key: 'MOCK',
    name: 'Parkmind Mock',
    isImplemented: true,
    health: 'OPERATIONAL',
    notes: 'Opérateur simulé, pleinement fonctionnel, sans dépense réelle.',
  },
  {
    key: 'PAYBYPHONE',
    name: 'PayByPhone',
    isImplemented: false,
    health: 'NOT_IMPLEMENTED',
    website: 'https://www.paybyphone.fr',
    notes: 'En attente d’un accès API officiel / partenaire.',
  },
  {
    key: 'EASYPARK',
    name: 'EasyPark',
    isImplemented: false,
    health: 'NOT_IMPLEMENTED',
    website: 'https://www.easypark.com',
    notes: 'En attente d’un accès API partenaire.',
  },
  {
    key: 'INDIGO_NEO',
    name: 'Indigo Neo',
    isImplemented: false,
    health: 'NOT_IMPLEMENTED',
    website: 'https://www.indigoneo.com',
    notes: 'En attente d’un accès API partenaire.',
  },
  {
    key: 'FLOWBIRD',
    name: 'Flowbird',
    isImplemented: false,
    health: 'NOT_IMPLEMENTED',
    website: 'https://www.flowbird.group',
    notes: 'En attente d’un accès API / contrat municipal.',
  },
];
