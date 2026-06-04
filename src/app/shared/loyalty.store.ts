// ⚠️ Mantenha este arquivo SINCRONIZADO com VIPpocket_adm/src/app/shared/loyalty.store.ts
// "Banco de dados" mock compartilhado via localStorage (mesma chave nos dois apps).
// Em produção, substituir por chamadas HTTP a uma API REST.

import { Injectable, signal } from '@angular/core';
import { Customer, LoyaltyCard, Provider, QrPayload, Stamp, StampRuleSize } from './loyalty.types';

// v3: seed rico com múltiplos prestadores/clientes/cartões para navegação cíclica completa.
const DB_KEY = 'vippocket:db:v3';

interface Db {
  providers: Provider[];
  customers: Customer[];
  cards: LoyaltyCard[];
}

/** Gera array de selos: os primeiros `stamped` carimbados com datas decrescentes a partir de `anchorIso`. */
function mkStamps(
  ruleSize: StampRuleSize,
  stampedCount: number,
  providerId: string,
  anchorIso: string,
  notes: string[] = [],
): Stamp[] {
  const anchor = new Date(anchorIso).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Array.from({ length: ruleSize }, (_, i) => {
    const idx = i + 1;
    if (i < stampedCount) {
      return {
        index: idx,
        stamped: true,
        stampedAt: new Date(anchor - (stampedCount - 1 - i) * 3 * dayMs).toISOString(),
        providerId,
        note: notes[i],
      } as Stamp;
    }
    return { index: idx, stamped: false } as Stamp;
  });
}

function seededDb(): Db {
  const t = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const providers: Provider[] = [
    {
      id: 'prov-demo',
      name: 'Studio Demo',
      segment: 'Serviços',
      ruleSize: 5,
      bonusDescription: '1 serviço grátis',
    },
    {
      id: 'prov-cafe',
      name: 'Café Aurora',
      segment: 'Cafeteria',
      ruleSize: 10,
      bonusDescription: '1 café especial grátis',
    },
    {
      id: 'prov-barber',
      name: 'Barbearia Vintage',
      segment: 'Barbearia',
      ruleSize: 5,
      bonusDescription: 'Corte + barba gratátis',
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-demo',
      name: 'Wesley Zilva',
      phone: '+5511999998888',
      email: 'wesley@example.com',
      consentLgpd: true,
      consentMarketing: true,
      createdAt: t(120),
      lastVisitAt: t(2),
    },
    {
      id: 'cust-ana',
      name: 'Ana Souza',
      phone: '+5511988887777',
      email: 'ana.souza@example.com',
      googleSub: 'google-sub-ana-123',
      pictureUrl: 'https://i.pravatar.cc/120?img=47',
      consentLgpd: true,
      consentMarketing: true,
      createdAt: t(60),
      lastVisitAt: t(1),
    },
    {
      id: 'cust-bruno',
      name: 'Bruno Lima',
      phone: '+5511977776666',
      consentLgpd: true,
      consentMarketing: false,
      createdAt: t(30),
    },
    {
      id: 'cust-clara',
      name: 'Clara Rocha',
      phone: '+5511966665555',
      email: 'clara.rocha@example.com',
      googleSub: 'google-sub-clara-456',
      pictureUrl: 'https://i.pravatar.cc/120?img=32',
      consentLgpd: true,
      consentMarketing: true,
      createdAt: t(90),
      lastVisitAt: t(5),
    },
  ];

  const cards: LoyaltyCard[] = [
    // Wesley @ Studio Demo — ciclo 1 RESGATADO (histórico)
    {
      id: 'card-w-demo-1',
      customerId: 'cust-demo',
      providerId: 'prov-demo',
      ruleSize: 5,
      cycleNumber: 1,
      createdAt: t(100),
      completedAt: t(40),
      bonusRedeemed: true,
      stamps: mkStamps(5, 5, 'prov-demo', t(40), [
        'Corte de cabelo',
        'Hidratação',
        'Escova',
        'Coloration',
        'Selagem',
      ]),
    },
    // Wesley @ Studio Demo — ciclo 2 EM ANDAMENTO (3/5)
    {
      id: 'card-w-demo-2',
      customerId: 'cust-demo',
      providerId: 'prov-demo',
      ruleSize: 5,
      cycleNumber: 2,
      createdAt: t(35),
      bonusRedeemed: false,
      stamps: mkStamps(5, 3, 'prov-demo', t(2), ['Corte', 'Hidratação', 'Escova']),
    },
    // Wesley @ Café Aurora — COMPLETO (10/10) aguardando resgate
    {
      id: 'card-w-cafe-1',
      customerId: 'cust-demo',
      providerId: 'prov-cafe',
      ruleSize: 10,
      cycleNumber: 1,
      createdAt: t(70),
      completedAt: t(3),
      bonusRedeemed: false,
      stamps: mkStamps(10, 10, 'prov-cafe', t(3), [
        'Espresso',
        'Cappuccino',
        'Latte',
        'Mocha',
        'Espresso duplo',
        'Macchiato',
        'Cold brew',
        'Espresso',
        'Cappuccino',
        'Flat white',
      ]),
    },
    // Ana @ Studio Demo — 4/5 quase lá
    {
      id: 'card-a-demo-1',
      customerId: 'cust-ana',
      providerId: 'prov-demo',
      ruleSize: 5,
      cycleNumber: 1,
      createdAt: t(50),
      bonusRedeemed: false,
      stamps: mkStamps(5, 4, 'prov-demo', t(1), ['Corte', 'Escova', 'Hidratação', 'Manicure']),
    },
    // Ana @ Barbearia — 1/5 acabou de começar
    {
      id: 'card-a-barber-1',
      customerId: 'cust-ana',
      providerId: 'prov-barber',
      ruleSize: 5,
      cycleNumber: 1,
      createdAt: t(10),
      bonusRedeemed: false,
      stamps: mkStamps(5, 1, 'prov-barber', t(10), ['Sobrancelha']),
    },
    // Bruno @ Studio Demo — cartão ZERADO (0/5)
    {
      id: 'card-b-demo-1',
      customerId: 'cust-bruno',
      providerId: 'prov-demo',
      ruleSize: 5,
      cycleNumber: 1,
      createdAt: t(30),
      bonusRedeemed: false,
      stamps: mkStamps(5, 0, 'prov-demo', t(30)),
    },
    // Clara @ Café — 7/10
    {
      id: 'card-c-cafe-1',
      customerId: 'cust-clara',
      providerId: 'prov-cafe',
      ruleSize: 10,
      cycleNumber: 1,
      createdAt: t(80),
      bonusRedeemed: false,
      stamps: mkStamps(10, 7, 'prov-cafe', t(5), [
        'Espresso',
        'Cappuccino',
        'Mocha',
        'Latte',
        'Cold brew',
        'Espresso',
        'Cappuccino',
      ]),
    },
    // Clara @ Barbearia — ciclo 1 RESGATADO
    {
      id: 'card-c-barber-1',
      customerId: 'cust-clara',
      providerId: 'prov-barber',
      ruleSize: 5,
      cycleNumber: 1,
      createdAt: t(85),
      completedAt: t(20),
      bonusRedeemed: true,
      stamps: mkStamps(5, 5, 'prov-barber', t(20), [
        'Sobrancelha',
        'Corte',
        'Barba',
        'Hidratação',
        'Corte',
      ]),
    },
    // Clara @ Barbearia — ciclo 2 ativo começando (1/5)
    {
      id: 'card-c-barber-2',
      customerId: 'cust-clara',
      providerId: 'prov-barber',
      ruleSize: 5,
      cycleNumber: 2,
      createdAt: t(15),
      bonusRedeemed: false,
      stamps: mkStamps(5, 1, 'prov-barber', t(7), ['Corte']),
    },
  ];

  return { providers, customers, cards };
}

function readDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const db = seededDb();
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw) as Db;
  } catch {
    return seededDb();
  }
}

/** Reseta o banco mock para o seed inicial (útil para demos / testes). */
export function resetSeed(): void {
  const db = seededDb();
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function writeDb(db: Db): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Normaliza telefone para formato E.164 simples (+55 default Brasil se faltar DDI). */
export function normalizePhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (input.trim().startsWith('+')) return `+${digits}`;
  // Heurística BR: 10 ou 11 dígitos → prepend +55
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

/** Monta URL wa.me com mensagem pré-preenchida. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyStore {
  /** Signal reativo do "banco" — qualquer mudança notifica os componentes. */
  readonly db = signal<Db>(readDb());

  constructor() {
    // Sincroniza entre abas/apps (cliente e adm rodando no mesmo browser).
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY) this.db.set(readDb());
    });
  }

  // ─── Providers / Customers ──────────────────────────────────────────────
  getProvider(id: string): Provider | undefined {
    return this.db().providers.find((p) => p.id === id);
  }
  listProviders(): Provider[] {
    return this.db().providers;
  }
  getCustomer(id: string): Customer | undefined {
    return this.db().customers.find((c) => c.id === id);
  }

  /** Cria (ou retorna existente por telefone normalizado) um cliente. */
  addCustomer(input: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const db = this.db();
    const phone = normalizePhone(input.phone);
    const existing = db.customers.find((c) => normalizePhone(c.phone) === phone);
    if (existing) return existing;
    const customer: Customer = {
      id: `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...input,
      phone,
    };
    const next: Db = { ...db, customers: [...db.customers, customer] };
    writeDb(next);
    this.db.set(next);
    return customer;
  }

  /** Atualiza lastVisitAt do cliente (chamado quando recebe um selo). */
  private touchCustomer(customerId: string): void {
    const db = this.db();
    const next: Db = {
      ...db,
      customers: db.customers.map((c) =>
        c.id === customerId ? { ...c, lastVisitAt: new Date().toISOString() } : c,
      ),
    };
    writeDb(next);
    this.db.set(next);
  }

  // ─── Cards ──────────────────────────────────────────────────────────────
  getCard(cardId: string): LoyaltyCard | undefined {
    return this.db().cards.find((c) => c.id === cardId);
  }

  /** Retorna o cartão ativo (não completo ou não resgatado) de um cliente x prestador. */
  getActiveCard(customerId: string, providerId: string): LoyaltyCard | undefined {
    return this.db().cards.find(
      (c) => c.customerId === customerId && c.providerId === providerId && !c.bonusRedeemed,
    );
  }

  listCardsByProvider(providerId: string): LoyaltyCard[] {
    return this.db().cards.filter((c) => c.providerId === providerId);
  }

  /** Cria (ou retorna) um cartão ativo para o par cliente↔prestador. */
  ensureCard(customerId: string, providerId: string): LoyaltyCard {
    const existing = this.getActiveCard(customerId, providerId);
    if (existing) return existing;
    const provider = this.getProvider(providerId);
    if (!provider) throw new Error(`Prestador desconhecido: ${providerId}`);
    const ruleSize: StampRuleSize = provider.ruleSize;
    const card: LoyaltyCard = {
      id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      customerId,
      providerId,
      ruleSize,
      stamps: Array.from({ length: ruleSize }, (_, i) => ({ index: i + 1, stamped: false })),
      createdAt: new Date().toISOString(),
      bonusRedeemed: false,
      cycleNumber:
        this.db().cards.filter((c) => c.customerId === customerId && c.providerId === providerId)
          .length + 1,
    };
    const db = this.db();
    const next: Db = { ...db, cards: [...db.cards, card] };
    writeDb(next);
    this.db.set(next);
    return card;
  }

  /** Carimba o próximo selo livre. Idempotente por (cardId, index). */
  addStamp(cardId: string, note?: string): LoyaltyCard {
    const db = this.db();
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) throw new Error(`Cartão não encontrado: ${cardId}`);
    if (card.bonusRedeemed) throw new Error('Cartão já encerrado (bônus resgatado).');
    const nextFree = card.stamps.find((s) => !s.stamped);
    if (!nextFree) throw new Error('Cartão já está completo.');
    nextFree.stamped = true;
    nextFree.stampedAt = new Date().toISOString();
    nextFree.providerId = card.providerId;
    if (note) nextFree.note = note;
    const allStamped = card.stamps.every((s) => s.stamped);
    if (allStamped) card.completedAt = new Date().toISOString();
    const next: Db = { ...db, cards: db.cards.map((c) => (c.id === cardId ? { ...card } : c)) };
    writeDb(next);
    this.db.set(next);
    this.touchCustomer(card.customerId);
    return next.cards.find((c) => c.id === cardId)!;
  }

  /** Marca o bônus como resgatado e inicia um novo ciclo. */
  redeemBonus(cardId: string): LoyaltyCard {
    const db = this.db();
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) throw new Error(`Cartão não encontrado: ${cardId}`);
    if (!card.completedAt) throw new Error('Cartão ainda não está completo.');
    card.bonusRedeemed = true;
    const next: Db = { ...db, cards: db.cards.map((c) => (c.id === cardId ? { ...card } : c)) };
    writeDb(next);
    this.db.set(next);
    return card;
  }

  // ─── QR helpers ─────────────────────────────────────────────────────────
  /** QR perene do CLIENTE (v2): não muda entre ciclos. Recomendado para uso diário. */
  buildCustomerQrPayload(customerId: string): QrPayload {
    return { v: 2, type: 'customer', customerId, ts: Date.now() };
  }

  /** QR de um cartão específico (v1) — legado, ainda suportado. */
  buildQrPayload(card: LoyaltyCard): QrPayload {
    return {
      v: 1,
      cardId: card.id,
      customerId: card.customerId,
      providerId: card.providerId,
      ts: Date.now(),
    };
  }

  parseQrPayload(raw: string): QrPayload | null {
    try {
      const p = JSON.parse(raw);
      if (p?.v === 2 && p.type === 'customer' && typeof p.customerId === 'string') {
        return p as QrPayload;
      }
      if (p?.v === 1 && p.cardId && p.customerId && p.providerId) {
        return p as QrPayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}
