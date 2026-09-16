import { NotImplementedProvider } from './stub-base';

/**
 * PayByPhone adapter — STUB (awaiting official API access).
 *
 * Required to implement a real integration:
 *  • Official partner/B2B API access from PayByPhone (no public self-serve API).
 *  • OAuth2 client credentials or a partner API key + secret.
 *  • Account linking: OAuth authorization-code flow to obtain a per-user token
 *    stored as `ProviderConnection.externalAccountRef` (never raw credentials).
 *  • Endpoints needed (names indicative, to confirm with PayByPhone):
 *      - POST /parking-sessions            (start)
 *      - POST /parking-sessions/{id}/extend
 *      - POST /parking-sessions/{id}/stop
 *      - GET  /parking-sessions/{id}
 *      - GET  /locations/{code}/rate-options   (tariffs)
 *      - GET  /vehicles                         (validate plate)
 *  • A stored, tokenized payment method held on PayByPhone's side (PCI scope
 *    stays with the operator; Parkmind stores no card data).
 *  • Idempotency-Key header support for safe retries.
 *
 * DO NOT scrape, automate the mobile app, or bypass any authentication. Until an
 * official agreement exists, this adapter must remain a stub.
 */
export class PayByPhoneProvider extends NotImplementedProvider {
  readonly key = 'PAYBYPHONE' as const;
  readonly name = 'PayByPhone';
}
