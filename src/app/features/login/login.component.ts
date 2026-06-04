import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProviderSession } from '../../auth/provider-session';
import { LoyaltyStore } from '../../shared/loyalty.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="login">
      <h2>Acesso do Prestador</h2>
      <p class="hint">Selecione um prestador cadastrado para entrar.</p>

      <label for="prov">Prestador</label>
      <select id="prov" [(ngModel)]="selectedId">
        @for (p of providers(); track p.id) {
          <option [value]="p.id">{{ p.name }} — regra {{ p.ruleSize }}</option>
        }
      </select>

      <button class="primary" (click)="enter()" [disabled]="!selectedId">Entrar</button>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <hr />
      <p class="hint">
        Sem prestador? Adicione manualmente em <code>localStorage</code> chave
        <code>vippocket:db:v1</code> → <code>providers[]</code>.
      </p>
    </section>
  `,
  styles: [
    `
      .login {
        max-width: 420px;
        margin: 2rem auto;
        background: #2c2c2c;
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid #d4af37;
      }
      h2 {
        color: #d4af37;
        margin-top: 0;
      }
      .hint {
        color: #b0b0b0;
        font-size: 0.85rem;
      }
      label {
        display: block;
        margin: 1rem 0 0.25rem;
        font-size: 0.85rem;
        color: #b0b0b0;
      }
      select {
        width: 100%;
        padding: 0.6rem;
        background: #1a1a1a;
        color: #f0f0f0;
        border: 1px solid #444;
        border-radius: 6px;
      }
      button.primary {
        margin-top: 1.25rem;
        width: 100%;
        padding: 0.75rem;
        background: #d4af37;
        color: #2c2c2c;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
      }
      button.primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .error {
        color: #ff6b6b;
        margin-top: 0.5rem;
      }
      hr {
        border: none;
        border-top: 1px solid #444;
        margin: 1.5rem 0 1rem;
      }
      code {
        background: #1a1a1a;
        padding: 1px 5px;
        border-radius: 3px;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly store = inject(LoyaltyStore);
  private readonly session = inject(ProviderSession);
  private readonly router = inject(Router);

  selectedId = '';
  error = signal('');
  providers = computed(() => this.store.db().providers);

  constructor() {
    this.selectedId = this.providers()[0]?.id ?? '';
  }

  enter(): void {
    const ok = this.session.login(this.selectedId);
    if (!ok) {
      this.error.set('Prestador inválido.');
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
