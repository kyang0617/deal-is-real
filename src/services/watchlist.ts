import "server-only";
import { db } from "@/lib/db";
import { bestCurrentOffer, dailyMinSeries, type DailyPoint } from "@/domain/prices/summary";

const DAY_MS = 86_400_000;

export interface WatchlistRow {
  id: string;
  targetPriceCents: number | null;
  product: { id: string; name: string; brand: string | null; category: string | null };
  retailerCount: number;
  best: { priceCents: number; currency: string; retailerName: string; observedAt: Date } | null;
  sparkline: DailyPoint[];
}

/** Watchlist with each product's best current in-stock price and a 90-day daily-low series. */
export async function getWatchlist(userId: string, now: Date): Promise<WatchlistRow[]> {
  const since = new Date(now.getTime() - 90 * DAY_MS);
  const items = await db.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: {
          listings: {
            where: { status: "ACTIVE" },
            include: {
              retailer: true,
              prices: { where: { observedAt: { gte: since } }, orderBy: { observedAt: "asc" } },
            },
          },
        },
      },
    },
  });

  return items.map((item) => {
    const { product } = item;
    const points = product.listings.flatMap((l) =>
      l.prices.map((p) => ({ ...p, retailerName: l.retailer.name })),
    );
    const best = bestCurrentOffer(points);
    return {
      id: item.id,
      targetPriceCents: item.targetPriceCents,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
      },
      retailerCount: product.listings.length,
      best: best && {
        priceCents: best.priceCents,
        currency: best.currency,
        retailerName: best.retailerName,
        observedAt: best.observedAt,
      },
      sparkline: dailyMinSeries(points),
    };
  });
}
