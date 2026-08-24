# Carteira Digital

Front-end of the Digital Wallet API (OpenAPI 3.0.3): accounts, balances, deposits,
withdrawals, internal transfers, Pix, payment methods and statements.

The UI is written in Brazilian Portuguese; code, comments and docs are in English.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | TanStack Start + TanStack Router (file-based routes) |
| Data | TanStack Query over a typed `fetch` client |
| Validation | Zod schemas for both request payloads and API responses |
| Forms | React Hook Form with `@hookform/resolvers/zod` |
| UI | Tailwind CSS v4 + shadcn (`base-lyra` style, Base UI primitives, Tabler icons) |
| Tooling | Biome (lint + format), TypeScript strict |

## Getting started

```bash
pnpm install
pnpm dev
```

The app starts on <http://localhost:3000>. Sign in with the seeded demo user:

```
ana.souza@example.com
S3nh@ForteAqui
```

## Environment

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/v1` | Base URL of the wallet API |
| `VITE_ENABLE_MOCK_API` | `true` | Serve `VITE_API_URL` from the in-memory mock |

While the mock is enabled, `globalThis.fetch` is intercepted for requests that target
`VITE_API_URL` and answered by `src/api/mock`, which implements every operation in the
OpenAPI document — including idempotency replay, optimistic locking conflicts,
insufficient-funds errors and asynchronous settlement (deposits confirm after a few
seconds, Pix charges get paid, KYC is reviewed). State is persisted in `localStorage`,
so a page reload keeps the data; clear the `carteira-digital:mock-db` key to reseed.

Set `VITE_ENABLE_MOCK_API=false` to talk to the real API. No other change is needed —
every screen goes through the same endpoint modules.

## Screens

| Route | Screen |
| --- | --- |
| `/entrar` | Sign in |
| `/criar-conta` | Sign up (CPF/CNPJ, phone and password validation) |
| `/inicio` | Dashboard: aggregate balance, quick actions, wallets, recent activity |
| `/carteiras` | Wallet list |
| `/carteiras/nova` | Create wallet |
| `/carteiras/$walletId` | Wallet detail, balances, edit and close |
| `/carteiras/$walletId/extrato` | Statement with date range and running balance |
| `/transacoes` | Transactions with wallet, type, status and period filters |
| `/transacoes/$transactionId` | Transaction detail, Pix QR Code and reversal |
| `/transferir` | Transfer by wallet, e-mail or document, with scheduling |
| `/depositar` | Deposit via Pix, card or boleto |
| `/sacar` | Withdrawal to a verified bank account |
| `/pix` | Pix hub |
| `/pix/chaves` | Pix keys (create, list, delete) |
| `/pix/cobrar` | Create a Pix charge |
| `/pix/cobrancas/$chargeId` | Charge detail with QR Code, polling and cancel |
| `/pix/pagar` | Pay by key or copy-and-paste payload |
| `/metodos-pagamento` | Linked cards and bank accounts |
| `/metodos-pagamento/novo` | Link a bank account or a tokenized card |
| `/favorecidos` | Saved beneficiaries with search and favorites |
| `/webhooks` | Webhook subscriptions with one-time secret reveal |
| `/perfil` | Profile, e-mail, password, sessions and account closure |
| `/perfil/kyc` | KYC status, limits and document upload |

## Architecture

```
src/
  domain/        Money, Document and Phone value objects
  api/
    schemas/     Zod schemas: API entities and form payloads
    endpoints/   One module per API tag, typed request/response
    queries/     TanStack Query hooks and cache keys
    mock/        In-memory backend used in development
  auth/          Session store (localStorage) and auth mutations
  components/    Layout, form primitives and shared UI
  routes/        File-based routes (`_auth` public, `_app` authenticated)
```

The API contract's conventions are enforced by the layers above the screens:

- **Money is always integer cents.** `Money` is the only place that converts to and
  from a display string, so no screen ever multiplies or divides by 100 by hand.
- **Money-moving requests carry an `Idempotency-Key`.** It is generated inside the
  endpoint module, so no caller can forget it.
- **`PATCH` sends `If-Match` with the resource `version`,** turning a concurrent edit
  into a `409 version_conflict` instead of a silent overwrite.
- **Errors use a single envelope.** `ApiError` parses it and `reportApiError` maps
  `details[].field` back onto the matching form field.

## Scripts

```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm preview          # serve the production build
pnpm generate-routes  # regenerate src/routeTree.gen.ts
pnpm check            # Biome lint + format
```
