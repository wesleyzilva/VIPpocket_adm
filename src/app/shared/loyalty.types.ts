// ⚠️ Mantenha este arquivo SINCRONIZADO com VIPpocket_adm/src/app/shared/loyalty.types.ts
// Tipos compartilhados entre o app do cliente (VIPpocket) e o app do prestador (VIPpocket_adm).

export type StampRuleSize = 5 | 10;

export interface Provider {
  id: string;
  name: string;
  segment: string; // ex.: "Salão", "Clínica", "Restaurante"
  ruleSize: StampRuleSize; // bônus ao completar 5 OU 10 atendimentos
  bonusDescription: string; // ex.: "1 serviço grátis", "20% desconto"
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // E.164 sem espaços: +5511999998888 (obrigatório para WhatsApp)
  email?: string;
  birthDate?: string; // ISO
  consentLgpd: boolean;
  consentMarketing: boolean;
  createdAt: string;
  lastVisitAt?: string;
  /** Identificador estável do Google Identity (sub do JWT) quando o cliente logou com Google. */
  googleSub?: string;
  /** URL da foto vinda do Google (opcional). */
  pictureUrl?: string;
}

export interface Stamp {
  index: number; // 1..ruleSize
  stamped: boolean;
  stampedAt?: string; // ISO
  providerId?: string;
  note?: string; // descrição do serviço/procedimento/contato
}

export interface LoyaltyCard {
  id: string;
  customerId: string;
  providerId: string;
  ruleSize: StampRuleSize;
  stamps: Stamp[];
  createdAt: string;
  completedAt?: string; // preenchido quando o último selo é dado
  bonusRedeemed: boolean;
  cycleNumber: number; // 1, 2, 3...
}

/**
 * Payload codificado no QR Code do cliente.
 *  - v=1 (legado): contém card+provider específicos.
 *  - v=2 'customer': QR exclusivo e perene do cliente; o prestador descobre o cartão ativo
 *    no seu próprio estabelecimento ao escanear.
 */
export type QrPayload =
  | { v: 1; cardId: string; customerId: string; providerId: string; ts: number }
  | { v: 2; type: 'customer'; customerId: string; ts: number };
