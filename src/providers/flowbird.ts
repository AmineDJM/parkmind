import { NotImplementedProvider } from './stub-base';

/**
 * Flowbird adapter — STUB (awaiting official API access).
 *
 * Flowbird operates on-street payment and the underlying platform for many
 * French municipal parking apps. A real integration likely goes through a
 * municipal contract or Flowbird's partner program.
 *
 * Required to implement a real integration:
 *  • Flowbird / municipal partner API access and credentials.
 *  • Per-user account linking + tokenized payment (opaque ref only).
 *  • Endpoints: start/extend/stop, status, tariffs per zone, plate validation.
 *
 * Keep as a stub until an official integration is available.
 */
export class FlowbirdProvider extends NotImplementedProvider {
  readonly key = 'FLOWBIRD' as const;
  readonly name = 'Flowbird';
}
