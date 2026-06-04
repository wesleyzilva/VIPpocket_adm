# Procedimentos de Login & Infraestrutura para Produção

> Este documento é compartilhado pelos dois apps do par (**VIPpocket** cliente + **VIPpocket_adm** prestador).
> No mock atual, tudo roda em `localStorage`. Esta é a receita para colocar de pé "de verdade".

---

## 1. Procedimentos de Login

### 1.1. Cliente (app **VIPpocket**, porta 4200)

**Fluxo atual (mock + Google opcional):**

1. Cliente abre o link `https://app.vippocket.com/?provider=prov-xxx`
   (QR físico colado na parede da loja já leva ao prestador correto).
2. Se já existe `vippocket:client:session` no localStorage → vai direto para `/qr-loyalty`.
3. Senão → tela `/onboarding`:
   - **Botão "Continuar com Google"** (aparece se `GOOGLE_CLIENT_ID` configurado em `src/app/shared/google-auth.ts`)
     → pré-preenche nome e e-mail
   - **WhatsApp** (obrigatório — usado para notificações)
   - **Checkbox LGPD** (obrigatório)
   - **Checkbox opt-in marketing** (opcional)
4. Submit → cria `Customer` no store → grava `customerId` em `localStorage['vippocket:client:session']`.
5. Cada cliente recebe um **QR Code perene** (`{v:2, type:'customer', customerId}`)
   exibido em `/qr-loyalty` — não muda entre ciclos nem entre prestadores.

**Para produção real precisa de:**

- **Google OAuth Client ID** (ver §2.1)
- **Backend de cadastro** que persista `Customer` + valide telefone com OTP via WhatsApp
  (recomendado: [Twilio Verify](https://www.twilio.com/docs/verify) ou
  [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api))
- **Auth provider** que emita JWT de sessão (Firebase Auth, Auth0, Supabase Auth ou Cognito)

### 1.2. Prestador (app **VIPpocket_adm**, porta 4300)

**Fluxo atual (mock):** dropdown de prestador na tela `/login` → grava sessão em `vippocket:adm:session`.

**Para produção precisa de:**

- **Login com e-mail + senha** OU **Google Workspace** (mesmo OAuth Client ID, mas com
  `hd: 'seudominio.com'` para restringir a usuários corporativos)
- **Magic link** via e-mail (mais simples para donos de pequenos negócios)
- **MFA opcional** para administradores
- **RBAC**: papéis `owner`, `operator`, `viewer` no token JWT

---

## 2. Infraestrutura Mínima para Rodar "De Verdade"

### 2.1. Identidade & Autenticação

| Componente | Opção recomendada | Custo |
|---|---|---|
| OAuth Google (cliente) | [Google Cloud Console → OAuth Client ID](https://console.cloud.google.com/apis/credentials) | grátis |
| Auth backend (JWT, refresh, MFA) | **Firebase Auth** ou **Supabase Auth** | grátis até 50k MAU |
| Verificação WhatsApp/SMS | Twilio Verify | ~$0.05/OTP |

**Setup OAuth Google em 5 passos:**

1. https://console.cloud.google.com → criar projeto "vippocket"
2. **APIs & Services → OAuth consent screen** → External → preencher app name, suporte e-mail, domínios autorizados
3. **Credentials → Create credentials → OAuth client ID → Web application**
4. **Authorized JavaScript origins:** `http://localhost:4200`, `https://app.vippocket.com`
5. Copiar o **Client ID** para `VIPpocket/src/app/shared/google-auth.ts` → constante `GOOGLE_CLIENT_ID`

### 2.2. Persistência de Dados

| Necessidade | Opção recomendada | Por quê |
|---|---|---|
| DB transacional (Customer, Card, Stamp) | **PostgreSQL** (Supabase / Neon / RDS) | ACID, baixo custo, SQL maduro |
| Cache de sessão | Redis (Upstash free tier) | refresh tokens, rate-limit |
| Storage de fotos (opcional) | Cloudflare R2 ou AWS S3 | foto Google + recibos |

**Schema mínimo (PostgreSQL):**

```sql
CREATE TABLE providers (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  segment       text,
  rule_size     int  CHECK (rule_size IN (5,10)),
  bonus_desc    text,
  owner_user_id uuid REFERENCES users(id)
);

CREATE TABLE customers (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  phone_e164          text NOT NULL UNIQUE,
  email               text,
  google_sub          text UNIQUE,
  picture_url         text,
  consent_lgpd        bool NOT NULL DEFAULT false,
  consent_marketing   bool NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  last_visit_at       timestamptz
);

CREATE TABLE cards (
  id              text PRIMARY KEY,
  customer_id     text REFERENCES customers(id) ON DELETE CASCADE,
  provider_id     text REFERENCES providers(id),
  cycle_number    int NOT NULL,
  rule_size       int NOT NULL,
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz,
  bonus_redeemed  bool DEFAULT false,
  UNIQUE (customer_id, provider_id, cycle_number)
);

CREATE TABLE stamps (
  card_id     text REFERENCES cards(id) ON DELETE CASCADE,
  idx         int NOT NULL,
  stamped_at  timestamptz NOT NULL,
  note        text,
  operator_id uuid,
  PRIMARY KEY (card_id, idx)
);

CREATE INDEX idx_cards_active ON cards (provider_id, customer_id) WHERE bonus_redeemed = false;
```

### 2.3. API Backend

| Tipo | Opção | Latência | Custo |
|---|---|---|---|
| **Serverless** (recomendado p/ MVP) | Supabase Edge Functions / Vercel Functions / AWS Lambda | <100ms | grátis até 1M req/mês |
| **Container** | Fly.io / Render / Cloud Run | <50ms | $5–10/mês |

**Endpoints essenciais (REST):**

```
POST   /api/v1/customers                  # cadastro (Google ou manual)
POST   /api/v1/customers/verify-phone     # OTP WhatsApp
GET    /api/v1/customers/me               # perfil + cards ativos
POST   /api/v1/providers/:id/stamp        # adm carimba via QR (idempotente)
POST   /api/v1/cards/:id/redeem           # adm libera bônus
GET    /api/v1/providers/:id/dashboard    # KPIs + lista de cards
```

**Substituir `LoyaltyStore`:** trocar o `signal` em memória por chamadas HTTP usando `HttpClient` + interceptor que injeta o JWT. Manter mesma interface pública → componentes não precisam mudar.

### 2.4. Hosting Frontend

| App | Hospedagem | URL produção sugerida |
|---|---|---|
| VIPpocket (cliente) | **Vercel** / Netlify / Cloudflare Pages | `app.vippocket.com` |
| VIPpocket_adm (prestador) | mesmo | `adm.vippocket.com` |

Build: `ng build --configuration production` → publica `dist/`.

### 2.5. WhatsApp para Notificações Automáticas

O botão 💬 no dashboard usa `wa.me` (link de iniciar conversa). Para **mensagens automáticas em massa** (ex.: lembrete de bônus disponível), precisa de:

- **WhatsApp Business Cloud API** (Meta) — gratuita até 1k conversas/mês
- Templates pré-aprovados (HSM) para mensagens proativas
- Webhook para receber respostas

### 2.6. Observabilidade & Compliance

- **Logs**: Logflare / Axiom / Datadog
- **Erros frontend**: Sentry (free tier)
- **LGPD**: endpoint `DELETE /api/v1/customers/me` (direito ao esquecimento) + export JSON dos dados
- **Auditoria**: tabela `audit_log` com `(actor_id, action, entity, ts, ip)`

---

## 3. Roadmap de Migração Mock → Produção

| Fase | Mudança | Esforço |
|---|---|---|
| **1. Auth real** | Configurar Google OAuth + Firebase Auth; substituir `ClientSession` por `AuthService` que valida JWT | 2–3 dias |
| **2. API + DB** | Criar schema PostgreSQL + endpoints CRUD; substituir `LoyaltyStore` por chamadas HTTP | 5–7 dias |
| **3. OTP WhatsApp** | Twilio Verify no fluxo de cadastro | 1 dia |
| **4. Hosting** | Deploy Vercel (2 apps) + apontar DNS | 1 dia |
| **5. WhatsApp automation** | Meta Cloud API + worker que dispara mensagens em eventos (`card.completed`, `card.expired`) | 3–5 dias |
| **6. Multi-tenant** | RBAC para prestador ver só seus dados; admin SaaS para onboarding de novos prestadores | 5–10 dias |

---

## 4. Custo Mensal Estimado (1k clientes, 5k carimbos/mês)

| Item | Custo |
|---|---|
| Vercel (2 apps) | grátis (hobby) |
| Supabase (DB + Auth + Edge Functions) | grátis (free tier) |
| Twilio Verify (OTP) | ~$5 |
| WhatsApp Cloud API | grátis (até 1k conversas) |
| Sentry | grátis |
| **Total** | **~$5/mês** |

A partir de 10k clientes ativos, prever ~$50/mês (Supabase Pro + Twilio scaling).
