@AGENTS.md

# Deal Is Real — project guide

Price tracker: users watch products (by URL or name), the app finds the same product at other
retailers, records price history, and judges whether today's price is a real deal **using only
observed history** (retailer "was"/list prices are displayed but never used for scoring).

## Commands
| Task | Command |
|---|---|
| Start Postgres + Mailpit | `npm run db:up` (docker compose; Postgres on host port **5433**) |
| Apply migrations | `npm run db:migrate` |
| Seed fake data | `npm run db:seed` (idempotent: wipes and reseeds) |
| Dev server | `npm run dev` → http://localhost:3000 |
| Tests | `npm test` (Vitest) |
| Lint + types + tests | `npm run check` |

## Stack
Next.js 16 App Router (Cache Components **on** — see below), TypeScript strict, Tailwind v4,
Postgres 16 + Prisma 7 (driver adapter `@prisma/adapter-pg`, client generated to `src/generated/prisma`),
pg-boss for background jobs (Phase 4+), Recharts, Zod, Vitest.

## Architecture (dependencies point downward only)
```
app/  (routes, server actions, UI)  ─┐
jobs/ (pg-boss worker + handlers)   ─┼─> services/   orchestration: DB + domain + providers
                                     │     ├─> domain/     PURE functions, no I/O (deal scoring, matching, URL parsing, money, GTIN)
                                     │     ├─> resolver/   fetch a public page → extract product data
                                     │     ├─> providers/  PriceProvider interface + implementations
                                     │     └─> lib/db.ts   Prisma client singleton
```
- `src/domain/**` must not import Prisma, `fetch`, `process.env`, or Next APIs. Everything there is unit-tested.
- Provider-specific code lives only under `src/providers/<name>/`; the rest of the app talks to `PriceProvider`.
- Only `src/services/**` (and seed/jobs) combine DB access with domain logic.
- Env vars are read through `env()` in `src/lib/env.ts` (Zod-validated). Add new vars there **and** to `.env.example`.

## Data model (prisma/schema.prisma)
- **Product** – canonical, variant-specific item (GTIN normalized to GTIN-14, MPN, brand, name, `variantAttributes`).
- **Retailer** – `slug` (`amazon`, `walmart`, `target`, `bestbuy`, `shop:<domain>`), `domain`.
- **Listing** – product at a retailer (`url`, `retailerProductId` = ASIN/SKU/TCIN…, match method + confidence, status).
- **PricePoint** – append-only time series per listing: `priceCents`, `currency`, `inStock`, `listPriceCents` (display only), `source`, `observedAt`.
- **WatchlistItem** – user + product + optional `targetPriceCents`.

## Conventions
- Money: integer minor units (`priceCents: number`) + ISO currency. Never floats. Helpers in `src/domain/money.ts`.
- Time: store UTC `DateTime`; pure functions take `now` as a parameter instead of calling `new Date()`.
- Tests live next to code as `*.test.ts`. Domain logic needs tests before it's merged.
- Next.js Cache Components: uncached DB reads happen in async server components wrapped in `<Suspense>`
  and call `await connection()` first. Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs.
- Mutations go through Server Actions that call `services/`, then `revalidatePath`/`refresh`.
- Current user: always via `getCurrentUser()` in `src/lib/currentUser.ts` (seeded demo user until auth lands).
- Fetching external pages: public pages only, honest User-Agent, timeouts; never bypass bot protection or CAPTCHAs.
  A block (403/429/captcha) is reported to the user, not worked around.

## Git workflow
- Never commit to `main` directly. One feature branch per logical change: `feat/pN-<topic>`, `fix/...`, `docs/...`.
- Small conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Before opening a PR: `npm run check && npm run build`. Open with `gh pr create`.
- **Never merge PRs** — the user reads and merges them. When new work depends on an unmerged branch,
  branch from it and open a stacked PR (`gh pr create --base <previous-branch>`).
- Stop for user review at the end of each phase.

## Phase status
- [ ] Phase 1 – schema, seed with ~1 year of fake history, watchlist + product detail pages
- [ ] Phase 2 – deal scoring
- [ ] Phase 3 – link resolver
- [ ] Phase 4 – cross-retailer matching + providers
- [ ] Phase 5 – text search + alerts

## Data sources (decided 2026-11-22)
- No paid API keys are available, so real data is **forward pricing only**: after the Phase 3 resolver
  exists, a scheduled job re-fetches each watched listing's public page and appends a `PricePoint`.
  History accumulates from the day a product is first watched.
- Big retailers (Amazon/Walmart/Target/Best Buy) often block plain requests. A block is recorded and shown
  to the user ("couldn't check this retailer"), never worked around.
- **Later feature – Wayback Machine backfill:** best-effort, when a listing is added, look up archived
  captures via the Internet Archive CDX API, run the resolver's extractors on each snapshot, and save
  results as `PricePoint`s with `source: "wayback"`. Always report the outcome to the user
  ("found N archived prices since <date>" or "no archived history"). Polite rate limit (~1 req/s).
- Seed data (`prisma/seed/`) is fake and exists only for development and tests.
