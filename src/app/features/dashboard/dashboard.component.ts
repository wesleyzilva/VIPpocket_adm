import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProviderSession } from '../../auth/provider-session';
import { LoyaltyStore, buildWhatsAppUrl } from '../../shared/loyalty.store';
import { LoyaltyCard } from '../../shared/loyalty.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (provider(); as p) {
      <section class="panel">
        <header class="head">
          <div>
            <h2>{{ p.name }}</h2>
            <p class="sub">
              {{ p.segment }} · regra: <strong>{{ p.ruleSize }}</strong> atendimentos →
              {{ p.bonusDescription }}
            </p>
          </div>
          <a routerLink="/stamp" class="cta">+ Carimbar selo</a>
        </header>

        <div class="kpis">
          <div class="kpi">
            <span class="num">{{ totalCards() }}</span
            ><span class="lbl">Cartões emitidos</span>
          </div>
          <div class="kpi">
            <span class="num">{{ pendingCards() }}</span
            ><span class="lbl">Em andamento</span>
          </div>
          <div class="kpi">
            <span class="num">{{ completedCards() }}</span
            ><span class="lbl">Completos</span>
          </div>
          <div class="kpi">
            <span class="num">{{ redeemedCards() }}</span
            ><span class="lbl">Bônus resgatados</span>
          </div>
        </div>

        <h3>Cartões dos clientes</h3>
        @if (cards().length === 0) {
          <p class="empty">Nenhum cartão ainda. Carimbe um cliente para começar.</p>
        } @else {
          <table class="cards">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Ciclo</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (c of cards(); track c.id) {
                <tr>
                  <td>{{ customerName(c.customerId) }}</td>
                  <td>#{{ c.cycleNumber }}</td>
                  <td>
                    <div class="bar"><span [style.width.%]="progress(c)"></span></div>
                    {{ stamped(c) }} / {{ c.ruleSize }}
                  </td>
                  <td>
                    @if (c.bonusRedeemed) {
                      <span class="tag redeemed">resgatado</span>
                    } @else if (c.completedAt) {
                      <span class="tag complete">completo</span>
                    } @else {
                      <span class="tag pending">em andamento</span>
                    }
                  </td>
                  <td>
                    {{
                      c.completedAt || c.stamps[stamped(c) - 1]?.stampedAt || c.createdAt
                        | date: 'short'
                    }}
                  </td>
                  <td>
                    @if (waUrl(c); as url) {
                      <a [href]="url" target="_blank" class="wa-btn" title="Enviar WhatsApp">
                        💬
                      </a>
                    } @else {
                      <span class="wa-empty" title="Cliente sem telefone">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    } @else {
      <p class="empty">Você não está autenticado. <a routerLink="/login">Entrar</a></p>
    }
  `,
  styles: [
    `
      .panel {
        background: #2c2c2c;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #444;
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      h2 {
        color: #d4af37;
        margin: 0;
      }
      .sub {
        color: #b0b0b0;
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
      }
      .sub strong {
        color: #d4af37;
      }
      .cta {
        background: #d4af37;
        color: #2c2c2c;
        padding: 0.6rem 1rem;
        border-radius: 6px;
        font-weight: bold;
        text-decoration: none;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .kpi {
        background: #1a1a1a;
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-left: 3px solid #d4af37;
      }
      .kpi .num {
        font-size: 1.8rem;
        font-weight: bold;
        color: #d4af37;
      }
      .kpi .lbl {
        font-size: 0.75rem;
        color: #b0b0b0;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 0.25rem;
      }
      h3 {
        color: #f0f0f0;
        margin-bottom: 0.75rem;
      }
      .empty {
        color: #b0b0b0;
        font-style: italic;
      }
      table.cards {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      table.cards th,
      table.cards td {
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #444;
        text-align: left;
      }
      table.cards th {
        color: #b0b0b0;
        font-weight: 500;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .bar {
        display: inline-block;
        width: 100px;
        height: 6px;
        background: #1a1a1a;
        border-radius: 3px;
        overflow: hidden;
        vertical-align: middle;
        margin-right: 0.5rem;
      }
      .bar span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #d4af37, #9acd32);
      }
      .tag {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tag.pending {
        background: rgba(212, 175, 55, 0.2);
        color: #d4af37;
      }
      .tag.complete {
        background: rgba(154, 205, 50, 0.2);
        color: #9acd32;
      }
      .tag.redeemed {
        background: rgba(40, 167, 69, 0.2);
        color: #28a745;
      }
      .wa-btn {
        display: inline-block;
        background: #25d366;
        color: #fff;
        padding: 4px 10px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .wa-btn:hover {
        background: #1ebd5a;
      }
      .wa-empty {
        color: #555;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly store = inject(LoyaltyStore);
  private readonly session = inject(ProviderSession);
  private readonly router = inject(Router);

  provider = this.session.current;
  cards = computed(() => {
    const p = this.provider();
    if (!p) return [];
    return [...this.store.listCardsByProvider(p.id)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  });

  totalCards = computed(() => this.cards().length);
  pendingCards = computed(() => this.cards().filter((c) => !c.completedAt).length);
  completedCards = computed(
    () => this.cards().filter((c) => !!c.completedAt && !c.bonusRedeemed).length,
  );
  redeemedCards = computed(() => this.cards().filter((c) => c.bonusRedeemed).length);

  constructor() {
    if (!this.session.isAuthenticated()) this.router.navigate(['/login']);
  }

  stamped(c: { stamps: { stamped: boolean }[] }): number {
    return c.stamps.filter((s) => s.stamped).length;
  }
  progress(c: { stamps: { stamped: boolean }[]; ruleSize: number }): number {
    return Math.round((this.stamped(c) / c.ruleSize) * 100);
  }
  customerName(id: string): string {
    return this.store.getCustomer(id)?.name ?? id;
  }

  /** Gera link wa.me com mensagem contextualizada pelo status do cartão. */
  waUrl(c: LoyaltyCard): string | null {
    const customer = this.store.getCustomer(c.customerId);
    const provider = this.provider();
    if (!customer?.phone || !provider) return null;
    const firstName = customer.name.split(' ')[0];
    const stampedNow = this.stamped(c);
    const remaining = c.ruleSize - stampedNow;
    let message: string;
    if (c.bonusRedeemed) {
      message =
        `Olá ${firstName}! Faz tempo que você não aparece na ${provider.name}. ` +
        `Que tal começar um novo cartão fidelidade hoje? ` +
        `A cada ${provider.ruleSize} atendimentos você ganha: ${provider.bonusDescription}.`;
    } else if (c.completedAt) {
      message =
        `Olá ${firstName}! 🎉 Seu cartão fidelidade na ${provider.name} está completo! ` +
        `Seu bônus está liberado: ${provider.bonusDescription}. ` +
        `Te esperamos para resgatar!`;
    } else if (remaining <= 2 && remaining > 0) {
      message =
        `Olá ${firstName}! Faltam apenas ${remaining} atendimento${remaining === 1 ? '' : 's'} ` +
        `para você ganhar: ${provider.bonusDescription} na ${provider.name}. ` +
        `Vamos agendar?`;
    } else {
      message =
        `Olá ${firstName}! Tudo bem? Aqui é da ${provider.name}. ` +
        `Você tem ${stampedNow}/${c.ruleSize} selos no seu cartão fidelidade. ` +
        `Quando quiser agendar seu próximo atendimento é só chamar!`;
    }
    return buildWhatsAppUrl(customer.phone, message);
  }
}
