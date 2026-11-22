import "server-only";
import { db } from "@/lib/db";
import { allTimeLow, dayKey, latestByListing } from "@/domain/prices/summary";

export interface RetailerOffer {
  listingId: string;
  retailerSlug: string;
  retailerName: string;
  url: string;
  retailerProductId: string | null;
  matchMethod: string;
  latest: {
    priceCents: number;
    currency: string;
    inStock: boolean;
    listPriceCents: number | null;
    observedAt: Date;
  } | null;
}

/** One row per day; each retailer slug maps to that day's price, or null if not observed / out of stock. */
export type ChartRow = { day: string } & Record<string, number | null | string>;

export async function getProductDetail(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        include: { retailer: true, prices: { orderBy: { observedAt: "asc" } } },
        orderBy: { retailer: { name: "asc" } },
      },
      watchers: true,
    },
  });
  if (!product) return null;

  const points = product.listings.flatMap((l) =>
    l.prices.map((p) => ({ ...p, retailerSlug: l.retailer.slug, retailerName: l.retailer.name })),
  );
  const latest = latestByListing(points);

  const offers: RetailerOffer[] = product.listings.map((l) => {
    const p = latest.get(l.id);
    return {
      listingId: l.id,
      retailerSlug: l.retailer.slug,
      retailerName: l.retailer.name,
      url: l.url,
      retailerProductId: l.retailerProductId,
      matchMethod: l.matchMethod,
      latest: p
        ? {
            priceCents: p.priceCents,
            currency: p.currency,
            inStock: p.inStock,
            listPriceCents: p.listPriceCents,
            observedAt: p.observedAt,
          }
        : null,
    };
  });

  // Pivot to one row per day for the chart. Out-of-stock days are null so the line shows a gap.
  const rows = new Map<string, ChartRow>();
  for (const p of points) {
    const day = dayKey(p.observedAt);
    const row = rows.get(day) ?? ({ day } as ChartRow);
    row[p.retailerSlug] = p.inStock ? p.priceCents : null;
    rows.set(day, row);
  }
  const chart = [...rows.values()].sort((a, b) => (a.day < b.day ? -1 : 1));

  const low = allTimeLow(points);

  return {
    product,
    offers,
    chart,
    series: product.listings.map((l) => ({ slug: l.retailer.slug, name: l.retailer.name })),
    allTimeLow: low && {
      priceCents: low.priceCents,
      currency: low.currency,
      day: dayKey(low.observedAt),
      retailerSlug: low.retailerSlug,
      retailerName: low.retailerName,
    },
    watch: product.watchers[0] ?? null,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;
