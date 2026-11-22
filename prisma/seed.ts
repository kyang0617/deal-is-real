/**
 * Seeds the database with a demo user, retailers, ~12 products and ~1 year of fake daily
 * price history per listing. Idempotent: wipes all app data first.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_USER_EMAIL } from "../src/lib/demoUser";
import { PRODUCTS, RETAILERS, listingUrl, productGtin, retailerProductId } from "./seed/catalog";
import { DAY_MS, createRng, generatePriceSeries, startOfUtcDay } from "./seed/priceGen";

const HISTORY_DAYS = 386; // a full year plus the run-up to last year's Black Friday

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const end = startOfUtcDay(new Date());
  const start = new Date(end.getTime() - (HISTORY_DAYS - 1) * DAY_MS);

  await db.$transaction([
    db.pricePoint.deleteMany(),
    db.watchlistItem.deleteMany(),
    db.listing.deleteMany(),
    db.product.deleteMany(),
    db.retailer.deleteMany(),
    db.user.deleteMany(),
  ]);

  const user = await db.user.create({ data: { email: DEMO_USER_EMAIL, name: "Demo User" } });

  const retailerIds = new Map<string, string>();
  for (const r of RETAILERS) {
    const created = await db.retailer.create({
      data: { slug: r.slug, name: r.name, domain: r.domain },
    });
    retailerIds.set(r.slug, created.id);
  }

  let pointCount = 0;
  for (const p of PRODUCTS) {
    const product = await db.product.create({
      data: {
        gtin: productGtin(p),
        mpn: p.mpn,
        brand: p.brand,
        name: p.name,
        category: p.category,
        variantGroupKey: p.variantGroupKey,
        variantAttributes: p.variantAttributes,
      },
    });

    for (const slug of p.retailers) {
      const retailer = RETAILERS.find((r) => r.slug === slug)!;
      const idRng = createRng(`${p.key}:${slug}:id`);
      const rid = retailerProductId(slug, idRng);
      const series = generatePriceSeries({
        seed: `${p.key}:${slug}`,
        basePriceCents: p.basePriceCents,
        maxEventDiscount: p.maxEventDiscount,
        volatility: p.volatility,
        markdowns: p.markdowns,
        retailer: retailer.profile,
        start,
        end,
      });
      const last = series.at(-1)!;

      const listing = await db.listing.create({
        data: {
          productId: product.id,
          retailerId: retailerIds.get(slug)!,
          url: listingUrl(slug, p.slug, rid),
          retailerProductId: rid,
          title: p.name,
          matchMethod: "GTIN",
          lastCheckedAt: last.observedAt,
        },
      });

      await db.pricePoint.createMany({
        data: series.map((pt) => ({
          listingId: listing.id,
          priceCents: pt.priceCents,
          currency: "USD",
          inStock: pt.inStock,
          listPriceCents: pt.listPriceCents,
          source: "seed",
          // Spread observations through the day so timestamps look like real checks.
          observedAt: new Date(pt.observedAt.getTime() + 14 * 3_600_000),
        })),
      });
      pointCount += series.length;
    }

    if (p.watch) {
      await db.watchlistItem.create({
        data: {
          userId: user.id,
          productId: product.id,
          targetPriceCents: p.watch.targetPriceCents,
        },
      });
    }
  }

  const watched = PRODUCTS.filter((p) => p.watch).length;
  console.log(
    `Seeded ${PRODUCTS.length} products, ${RETAILERS.length} retailers, ${pointCount} price points ` +
      `(${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}); ` +
      `${watched} on ${DEMO_USER_EMAIL}'s watchlist.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
