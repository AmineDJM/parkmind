import type { ProviderKey } from '@/domain/enums';
import {
  fail,
  type ExtendSessionInput,
  type ParkingProvider,
  type ProviderResult,
  type ProviderSession,
  type StartSessionInput,
  type Tariff,
} from './types';

/**
 * Base for operator adapters whose official API is not yet integrated.
 *
 * IMPORTANT — by design, these adapters NEVER pretend to work. Every method
 * returns a NOT_IMPLEMENTED error so no code path can silently believe a real
 * ticket was purchased. The complete interface is present so a real integration
 * can be dropped in without touching the rest of the app. Each concrete adapter
 * documents the exact official API surface required to implement it.
 */
export abstract class NotImplementedProvider implements ParkingProvider {
  abstract readonly key: ProviderKey;
  abstract readonly name: string;
  readonly isImplemented = false;

  protected notImplemented<T>(): Promise<ProviderResult<T>> {
    return Promise.resolve(
      fail<T>(
        'NOT_IMPLEMENTED',
        `L'intégration officielle ${this.name} n'est pas encore disponible. Utilisez le mode simulation ou l'opérateur Mock.`,
        false,
      ),
    );
  }

  startSession(_i: StartSessionInput): Promise<ProviderResult<ProviderSession>> {
    return this.notImplemented();
  }
  extendSession(
    _id: string,
    _i: ExtendSessionInput,
  ): Promise<ProviderResult<ProviderSession>> {
    return this.notImplemented();
  }
  stopSession(_id: string): Promise<ProviderResult<ProviderSession>> {
    return this.notImplemented();
  }
  getSession(_id: string): Promise<ProviderResult<ProviderSession>> {
    return this.notImplemented();
  }
  getTariffs(_zone: string): Promise<ProviderResult<Tariff[]>> {
    return this.notImplemented();
  }
  validateVehicle(
    _plate: string,
  ): Promise<ProviderResult<{ plate: string; valid: boolean }>> {
    return this.notImplemented();
  }
}
