import { NotImplementedProvider } from './stub-base';

/**
 * EasyPark adapter — STUB (awaiting official API access).
 *
 * Required to implement a real integration:
 *  • EasyPark Group partner API access (B2B / mobility partner program).
 *  • API credentials (client id/secret) + per-user account authorization.
 *  • Endpoints needed (indicative):
 *      - start/stop/extend parking session
 *      - session status lookup
 *      - price/tariff lookup for an area code
 *      - vehicle registration validation
 *  • Tokenized payment handled by EasyPark; Parkmind stores only an opaque ref.
 *  • Idempotency support for retries.
 *
 * DO NOT reverse-engineer private endpoints. Keep as a stub until an official
 * integration is available.
 */
export class EasyParkProvider extends NotImplementedProvider {
  readonly key = 'EASYPARK' as const;
  readonly name = 'EasyPark';
}
