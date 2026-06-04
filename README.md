<h1 align="center">VIPocket Admin — Loyalty Analytics Dashboard</h1>

<p align="center">
  <em>Providing small-business owners with the financial evidence to validate whether their loyalty programme is generating a measurable return</em>
</p>

> **Quickstart de sinergia com VIPpocket (cliente)**
>
> Os dois apps compartilham um "banco" mock via `localStorage` (chave `vippocket:db:v1`). Rodando no mesmo browser, **o que o adm carimba aparece imediatamente no cartão do cliente**.
>
> ```bash
> # terminal 1 — cliente (porta 4200)
> cd VIPpocket && npm install && npm start
>
> # terminal 2 — prestador (porta 4300)
> cd VIPpocket_adm && npm install && npm start
> ```
>
> 1. Abra `http://localhost:4200/qr-loyalty` (cliente) — copie o JSON exibido sob o QR.
> 2. Abra `http://localhost:4300/login` (adm) → escolha o prestador demo → vá em **Carimbar** → cole o JSON → confirme.
> 3. Volte à aba do cliente: o selo aparece automaticamente.
>
> Em produção, troque `LoyaltyStore` por um service HTTP que aponte para a mesma API REST nos dois repos.

---


<p align="center">
  <img src="https://img.shields.io/badge/Angular-20+-DD0031?style=for-the-badge&logo=angular&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Analytics-ROI%20Dashboard-4285F4?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Companion-VIPocket-27AE60?style=for-the-badge"/>
</p>

---

> Administrative analytics dashboard for the VIPpocket loyalty platform. Surfaces per-customer LTV, visit frequency, average ticket, cumulative discounts, and programme ROI — providing small-business owners with the financial evidence to validate whether their loyalty investment actually pays off.

---

## The Problem

Loyalty programme operators have no visibility into whether the programme is profitable. They know they are giving discounts but cannot answer the fundamental question: are the customers who receive discounts spending more, visiting more frequently, and generating net positive revenue compared to the cost of the rewards? Without this data, the programme is an expense with an unknown return.

---

## The Solution

An analytics dashboard that turns the visit and discount data collected by VIPpocket into actionable financial metrics. For each customer, the owner can see exactly how much revenue they generate, how often they visit, what the average ticket looks like, what the loyalty programme costs per customer, and — critically — whether the cost of the discount is justified by the revenue it drives.

---

## Methodology

```
VIPpocket (customer app)
    └─► Records every visit + discount event per customer

VIPpocket_adm (this repository)
    └─► Aggregates visit history per customer
             └─► Calculates financial metrics:
                      ├─► LTV — total revenue from customer since registration
                      ├─► Visit frequency — average days between visits
                      ├─► Average ticket — revenue per visit
                      ├─► Total discounts — cumulative rewards granted
                      ├─► Opportunity cost — revenue "foregone" in discounts
                      └─► Retention rate — % of customers who completed multiple cycles
                               └─► Owner decision: continue, adjust, or discontinue programme
```

**Key metrics per customer:**

| Metric | Description |
|--------|-------------|
| LTV | Total revenue generated since registration |
| Visit frequency | Average days between visits |
| Average ticket | Revenue per visit cycle |
| Total discounts | Cumulative discount value granted |
| Opportunity cost | Cost of the loyalty programme per customer |
| Retention rate | Cycle completion rate — the loyalty signal |

---

## Results

- Converts VIPpocket's visit data into a per-customer ROI model
- Identifies high-value customers (frequent, high-ticket) vs. discount-only customers
- Gives programme operators a data-driven basis to adjust discount thresholds or reward structures

---

## Tradeoffs

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|----------|
| Data architecture | Per-device (reads VIPpocket local data) | Centralised backend with multi-device sync | No backend eliminates infrastructure cost and privacy risk; the tradeoff is that analytics are scoped to a single device — acceptable for a single-store operator |
| Dashboard scope | 6 focused KPIs | Full BI dashboard (charts, cohorts, funnels) | A focused KPI set is immediately actionable for a small-business owner making daily pricing decisions; a full BI dashboard would overwhelm the target user and increase time-to-insight |
| Update frequency | On-demand calculation | Real-time reactive updates | On-demand calculation is sufficient for a daily management review; real-time would require WebSocket infrastructure and drain battery on a mobile device used as the store's POS |
| Data visualisation | Tables with exact numbers | Chart-first (bar, line, pie) | Shop owners need exact currency values to make discount threshold decisions — charts communicate trends but obscure the precise figures needed for ROI judgment |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 20+, TypeScript, SCSS |
| Architecture | Standalone components, OnPush, Signals |
| Data source | VIPpocket (companion app) |
| Deployment | GitHub Pages |

---

## Getting Started

```bash
npm install
ng serve          # → http://localhost:4200/VIPpocket_adm
```

**Related repository:** [`VIPpocket`](https://github.com/wesleyzilva/VIPpocket) — the customer-facing loyalty card app
Este projeto é a área administrativa do VIPpocket, focada em fornecer análises de viabilidade financeira para os estabelecimentos que utilizam a aplicação.

## Objetivo do Projeto

O painel administrativo `VIPpocket_adm` foi projetado para responder a perguntas cruciais sobre o comportamento e o valor de seus clientes, ajudando você a tomar decisões estratégicas. Com ele, você poderá obter respostas para:

*   **Frequência:** Quantas vezes um cliente específico visita sua loja?
*   **Gasto Anual:** Quanto esse cliente gasta em seu estabelecimento por ano?
*   **Gasto por Visita:** Qual o valor médio que o cliente gasta a cada nova visita?
*   **Descontos Concedidos:** Qual o valor total que o cliente já recebeu em descontos?
*   **Custo de Oportunidade:** Qual o valor que você "deixou de ganhar" ao conceder os descontos (custo do programa de fidelidade)?
*   **Taxa de Retorno:** Qual é a taxa de retorno (fidelização) deste cliente?

Essas métricas fornecem uma visão clara sobre a eficácia do programa de fidelidade VIPpocket e o retorno sobre o investimento (ROI) para o seu negócio.

---

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/VIPpocket_adm`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
