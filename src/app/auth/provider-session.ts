// Sessão simples do prestador autenticado (mock).
import { Injectable, inject, signal } from '@angular/core';
import { LoyaltyStore } from '../shared/loyalty.store';
import { Provider } from '../shared/loyalty.types';

const SESSION_KEY = 'vippocket:adm:session';

@Injectable({ providedIn: 'root' })
export class ProviderSession {
  private readonly store = inject(LoyaltyStore);
  private readonly _current = signal<Provider | undefined>(this.loadFromStorage());
  readonly current = this._current.asReadonly();

  private loadFromStorage(): Provider | undefined {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) return undefined;
      return this.store.getProvider(id);
    } catch {
      return undefined;
    }
  }

  login(providerId: string): Provider | undefined {
    const p = this.store.getProvider(providerId);
    if (!p) return undefined;
    localStorage.setItem(SESSION_KEY, providerId);
    this._current.set(p);
    return p;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._current.set(undefined);
  }

  isAuthenticated(): boolean {
    return !!this._current();
  }
}
