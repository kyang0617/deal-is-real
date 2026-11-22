# Deal Is Real

Price tracker that watches products across retailers, records price history, and tells you whether
today's price is actually a good deal, judged against prices it has **observed**, not the retailer's
"was" price.

> Status: Phase 1 (schema, fake seed data, watchlist and product pages). See `CLAUDE.md` for the
> architecture and roadmap.

## Getting started

Requirements: Node 20+, Docker.

```bash
cp .env.example .env
npm install            # also generates the Prisma client
npm run db:up          # Postgres (localhost:5433) + Mailpit (http://localhost:8025)
npm run db:migrate     # apply migrations
npm run db:seed        # demo user, 12 products, ~1 year of fake daily prices
npm run dev            # http://localhost:3000
```

The seed data is generated (deterministically) and ends on the day you run it. Re-run
`npm run db:seed` any time to reset it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm test` | Vitest unit tests |
| `npm run check` | lint + typecheck + tests |
| `npm run build` | production build |
| `npm run db:reset` | drop, re-migrate and re-seed the database |

## Where real prices come from

There are no paid price-data API keys, so the app records prices **forward**: it fetches public product
pages on a schedule and reads their structured data. It never bypasses bot protection; if a retailer
blocks the request, the app reports that. A best-effort Wayback Machine backfill is planned.
