/**
 * Domain enums as string-literal unions.
 *
 * These deliberately mirror the Prisma enum *values* one-for-one, but live
 * outside the generated client so the automation engine, city rules and
 * provider abstraction stay pure and testable without a database. The server
 * layer casts between Prisma enums and these unions (identical string values).
 */

export type RightType = 'RESIDENT' | 'PROFESSIONAL' | 'OTHER';

export type ProviderKey =
  | 'PAYBYPHONE'
  | 'EASYPARK'
  | 'INDIGO_NEO'
  | 'FLOWBIRD'
  | 'MOCK';

export type ZoneKind = 'RESIDENTIAL' | 'MIXED' | 'ROTATING' | 'PAID' | 'FREE';

export type DecisionType =
  | 'NO_ACTION'
  | 'START_SESSION'
  | 'EXTEND_SESSION'
  | 'STOP_SESSION'
  | 'REQUIRE_USER_CONFIRMATION'
  | 'ERROR';

export type RightStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PENDING_VERIFICATION'
  | 'REVOKED';

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  PAYBYPHONE: 'PayByPhone',
  EASYPARK: 'EasyPark',
  INDIGO_NEO: 'Indigo Neo',
  FLOWBIRD: 'Flowbird',
  MOCK: 'Parkmind Mock',
};

export const RIGHT_TYPE_LABELS: Record<RightType, string> = {
  RESIDENT: 'Résident',
  PROFESSIONAL: 'Professionnel',
  OTHER: 'Autre / Visiteur',
};
