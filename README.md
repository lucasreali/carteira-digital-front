# Carteira Digital

Front-end of the Digital Wallet API (OpenAPI 3.0.3): accounts, balances, deposits,
withdrawals, internal transfers, Pix, payment methods and statements.

The UI is written in Brazilian Portuguese; code, comments and docs are in English.

## Live demo

<https://black-pond-0b0651a10.7.azurestaticapps.net>

The deployed build is a static SPA on Azure Static Web Apps with no backend attached, so
it runs entirely on the in-memory mock and the demo accounts below work as they are.

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

The app starts on <http://localhost:3001>. Every request goes to the mock server of
the published contract at <https://mock.apidog.com/m1/1365799-1370039-1426618>, so no
local API is needed.

## Demo accounts

| Name | E-mail | Password |
| --- | --- | --- |
| Ana Souza | `teste@mail.com` | `1234` |
| Bruno Lima | `bruno.lima@example.com` | `1234` |

Both start `active` with KYC approved and seeded wallets, so transfers between them
exercise the whole flow.

`teste@mail.com` is also the account the OpenAPI examples describe, so the same
credentials work against the Apidog mock server and against the in-memory mock
(`VITE_ENABLE_MOCK_API=true`). Bruno only exists in the in-memory mock — in the
contract he appears solely as a counterparty, never as the authenticated user.

## API contract

`Digital Wallet API.openapi.json` is the source of truth for the mock server. Every
example in it is derived from one seeded dataset, so the responses reconcile with each
other rather than being independently plausible:

- `POST /auth/login`, `POST /auth/register` and `GET /users/me` return the same
  `user.id`, and the `sub`/`email` claims of the example JWT match it.
- `total_balance` equals `available_balance + blocked_balance`, and the statement's
  `closing_balance` equals the wallet's `total_balance`.
- Replaying the statement entries from `opening_balance` reproduces every
  `balance_after` and lands on the closing balance.
- `blocked_balance` is the sum of the withdrawals still `processing`, and
  `pending_credits` the sum of the deposits still `pending`; neither appears in the
  statement, which only lists settled movements.
- Each money-moving route's `Idempotency-Key` example matches the `idempotency_key`
  in the response body it documents.
- Every transaction referenced from a statement entry, a Pix charge, a reversal or a
  `409` error exists in `GET /transactions` with the same body.

`info.description` carries the timeline those examples are cut from, so a reader can
see the order events happened in.

## Environment

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_ENABLE_MOCK_API` | `false` | Serve the API from the in-memory mock instead |

The base URL is fixed in `src/api/config.ts`, pointing at the Apidog mock server of the
contract — it answers the OpenAPI routes at its root, without the `/v1` prefix the real
servers use.

With `VITE_ENABLE_MOCK_API=true`, `globalThis.fetch` is intercepted for requests that
target that base URL and answered by `src/api/mock`, which implements every operation in the
OpenAPI document — including idempotency replay, optimistic locking conflicts,
insufficient-funds errors and asynchronous settlement (deposits confirm after a few
seconds, Pix charges get paid, KYC is reviewed). State is persisted in `localStorage`,
so a page reload keeps the data; clear the `carteira-digital:mock-db` key to reseed.

With the mock off — the default — every screen goes through the same endpoint modules
against the remote base URL. Any API put behind it must allow the app's origin via CORS
(including the `Authorization`, `Idempotency-Key` and `If-Match` request headers).

## Cloud function status

The dashboard also calls a standalone Azure Function — `GET /api/getstatus?name=`, URL in
`src/api/config.ts` — and renders its plain-text answer in the "Status do serviço" card.
The function must allow the app's origin under **Function App → API → CORS**
(`http://localhost:3001` for development and the Static Web Apps domain for the deployed
build); without it the browser blocks the response and the card reports the function as
unreachable.

## Users API on Azure Functions

`/usuarios` is a front end for a second, independent service: the *Carteira Digital -
Users API*, a users CRUD running on Azure Functions over MongoDB Atlas (contract in
`docs/users-function-openapi.json`, base URL in `src/api/config.ts`). It has its own contract — `nome`/`email` documents keyed by
MongoDB `ObjectId`, and a single-field `{ "error": "..." }` failure envelope — so it goes
through `src/api/function-http.ts` instead of the wallet client, and the screen exercises
every operation in the document: `POST /users`, `GET`, `PUT`, `PATCH` and `DELETE` on
`/users/{id}`.

The contract has no list operation, so the screen keeps the ObjectIds it created or looked
up in `localStorage` (`carteira-digital:function-user-ids`) and reads each one back with a
`GET`. A side panel logs the last calls to the function — method, path, status and
duration — as evidence of where the data comes from.

This Function App needs the same **Function App → API → CORS** entries as the status
function (`http://localhost:3001` and the Static Web Apps domain), plus a working MongoDB
Atlas connection; without either, every card reports the function as unreachable or
answers `500 Erro interno.`

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
| `/usuarios` | Users CRUD on Azure Functions with the call log |
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
