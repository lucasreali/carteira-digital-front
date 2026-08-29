# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install
pnpm dev              # Vite dev server on http://localhost:3001
pnpm build            # production build into dist/ (client + prerendered SPA shell)
pnpm preview          # serve the production build
pnpm check            # Biome lint + format (the check to run before committing)
pnpm lint             # Biome lint only
pnpm format           # Biome format only
pnpm generate-routes  # regenerate src/routeTree.gen.ts (the Vite plugin does it while `dev` runs)
pnpm exec tsc --noEmit  # type check; there is no `typecheck` script
```

There is no test runner configured — no test framework, no test files. Verification is
`pnpm check` plus `tsc --noEmit`.

## Architecture

React 19 SPA on TanStack Start (SSR disabled per route), TanStack Router file-based
routing, TanStack Query over a typed `fetch` client, Zod for every boundary, shadcn
(`base-lyra` style, Base UI primitives, Tabler icons) on Tailwind v4.

The app is a front-end for the *Digital Wallet API* (OpenAPI 3.0.3, contract in
`docs/openapi.yaml`, full spec also embedded in `PROMPT.md`). The contract's rules —
money as integer cents, idempotency keys, optimistic locking, cursor pagination, a single
error envelope — are enforced by the layers below the screens, never by screens.

### The API stack (`src/api`), strictly layered

```
schemas/    Zod: API entity schemas AND the form payload schemas for the screens
endpoints/  one module per API tag; each exports a frozen object of typed calls
queries/    TanStack Query hooks + queryOptions; keys/invalidation roots in queries/keys.ts
mock/       in-memory backend that answers the same URLs (dev only)
http.ts     the only place that calls fetch for the wallet API
config.ts   base URL + feature flags
```

Screens import from `queries/` only. Never call `request()` or `fetch` from a route
component, and never add a query key inline — add it to `queryKeys` in
`src/api/queries/keys.ts` and invalidate through `invalidationRoots`.

`request()` in `src/api/http.ts` owns: auth header injection, `Idempotency-Key`,
`If-Match`, response validation against the passed Zod schema, `ApiError` construction
from the error envelope, and a single-flight 401 → `/auth/refresh` → retry.

### Invariants to preserve when adding features

- **Money is integer cents.** `Money` (`src/domain/money.ts`) is the only place that
  converts to or from a display string. No screen multiplies or divides by 100. Form
  amount fields use `centsField()` from `src/api/schemas/common.ts`, which parses the
  pt-BR masked string into cents inside the Zod schema.
- **`Idempotency-Key` is generated inside the endpoint module**, not by the caller —
  see `newIdempotencyKey("trf")` in `src/api/endpoints/transactions.ts`. Any new
  money-moving endpoint must do the same.
- **`PATCH` passes the resource `version` as `ifMatch`**, so a concurrent edit surfaces
  as `409 version_conflict` instead of a silent overwrite.
- **Errors go through `reportApiError`** (`src/lib/form.ts`), which maps
  `error.details[].field` onto React Hook Form fields via `setError` and toasts the rest.
  `describeError` is the read-only counterpart used by `ErrorState`.
- **Every API response is parsed by a Zod schema.** Adding a field means adding it to
  the schema first; `pageOf`/`listOf` wrap the contract's envelope shapes.
- **`Document`, `Phone`, `Money`** in `src/domain/` are value objects with no getters —
  keep validation and formatting inside them rather than in components.

### Routing and auth

Routes live in `src/routes` and use Brazilian-Portuguese URLs (`/entrar`, `/carteiras`,
`/transferir`). `src/routeTree.gen.ts` is generated — never edit it.

Two layout routes guard the app, both with `ssr: false` because the session lives in
`localStorage`:

- `_auth.tsx` — public shell; redirects to `/inicio` when a session exists.
- `_app.tsx` — authenticated shell (sidebar, header, theme toggle); `beforeLoad`
  redirects to `/entrar` when `sessionStore.read()` is empty.

`src/auth/session.ts` is a hand-rolled external store (subscribe/read/save/clear) read
synchronously in `beforeLoad` and through `useSession`/`useCurrentUser` in components.

Form screens follow one shape: `useForm` with `zodResolver(<x>FormSchema)`, `z.input` for
the form type and `z.output` for the payload type, submit via a mutation hook from
`queries/`, `reportApiError` in the catch, `toast` + `navigate` on success. Copy the
structure of `src/routes/_app/transferir.tsx` when adding a screen.

### The mock backend

`VITE_ENABLE_MOCK_API=true` makes `installMockApi()` (called from `getRouter()`) replace
`globalThis.fetch`, intercepting only requests to `apiBaseUrl` and answering them from
`src/api/mock`. The handlers are behind a dynamic `import("./handlers")` on purpose: with
the flag off, the import is unreachable and the bundler drops the whole mock and its seed
data from the production bundle. Keep `mockApiEnabled` read as a static
`import.meta.env.VITE_ENABLE_MOCK_API` access so Vite can inline it.

The mock implements the full contract, including idempotency replay, version conflicts,
insufficient funds and delayed settlement (`shared.ts` timers). State persists under the
`carteira-digital:mock-db` localStorage key — clear it to reseed. `db.ts` holds the
tables and seed, `ledger.ts` the balance movements, `support.ts` the response/auth
helpers, `router.ts` a small method+pattern matcher.

With the flag off (the default) requests go to the Apidog mock server of the published
contract, hardcoded in `src/api/config.ts`; it serves the OpenAPI routes at its root
without the `/v1` prefix. The dashboard additionally calls a standalone Azure Function
(`statusFunctionUrl`, plain text, no auth) outside the `request` client — it needs the
app origin allowed in the Function App's CORS settings.

## Conventions

- Import alias is `@/` → `src/` (both `@/*` and `#/*` are mapped, but the codebase uses
  `@/` exclusively).
- Biome, tab indentation, double quotes, organize-imports on. It ignores
  `src/routeTree.gen.ts`, `src/styles.css` and `src/components/ui/**` (generated shadcn
  components) — do not hand-format those.
- All user-facing copy is Brazilian Portuguese; enum labels are centralized in
  `src/lib/labels.ts` rather than inlined in JSX. Markdown docs are written in English.
- Shared UI states (`LoadingRows`, `ErrorState`, `EmptyState`, `PageHeader`,
  `StatusBadge`, `ButtonLink`) live in `src/components/common/` — reuse them instead of
  re-implementing loading/error/empty branches per screen.

## Deployment

Pushes to `main` deploy to Azure Static Web Apps via
`.github/workflows/azure-static-web-apps-black-pond-0b0651a10.yml`. The workflow builds
with `pnpm build` in the runner and uploads `dist/client` with `skip_app_build: true` —
Oryx cannot run the SPA prerender step, which crawls a local server. `public/staticwebapp.config.json`
provides the SPA navigation fallback.
