import { NotImplementedProvider } from './stub-base';

/**
 * Indigo Neo adapter — STUB (awaiting official API access).
 *
 * Required to implement a real integration:
 *  • Indigo (Group Indigo / Indigo Neo) partner API access.
 *  • Partner credentials + per-user account linking.
 *  • Endpoints needed (indicative): start/extend/stop on-street sessions,
 *    session status, tariff catalog per city/zone, vehicle validation.
 *  • Payment stays tokenized on Indigo's side; store only an opaque ref.
 *
 * Keep as a stub until an official integration is available.
 */
export class IndigoProvider extends NotImplementedProvider {
  readonly key = 'INDIGO_NEO' as const;
  readonly name = 'Indigo Neo';
}
