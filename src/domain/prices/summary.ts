/**
 * Pure helpers that summarize raw price observations for display.
 * (Deal *judgement* lives in domain/deal-score — Phase 2.)
 */

export interface Observation {
  listingId: string;
  priceCents: number;
  inStock: boolean;
  observedAt: Date;
}

export interface DailyPoint {
  /** UTC day, YYYY-MM-DD */
  day: string;
  priceCents: number;
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** The most recent observation for each listing. */
export function latestByListing<T extends Observation>(points: T[]): Map<string, T> {
  const latest = new Map<string, T>();
  for (const p of points) {
    const cur = latest.get(p.listingId);
    if (!cur || p.observedAt > cur.observedAt) latest.set(p.listingId, p);
  }
  return latest;
}

/** Cheapest in-stock current offer across listings, or null if nothing is in stock. */
export function bestCurrentOffer<T extends Observation>(points: T[]): T | null {
  let best: T | null = null;
  for (const p of latestByListing(points).values()) {
    if (p.inStock && (!best || p.priceCents < best.priceCents)) best = p;
  }
  return best;
}

/**
 * For each UTC day since `since`, the lowest in-stock price observed at any listing that day.
 * Days with no in-stock observation are omitted.
 */
export function dailyMinSeries(points: Observation[], since?: Date): DailyPoint[] {
  const byDay = new Map<string, number>();
  for (const p of points) {
    if (!p.inStock || (since && p.observedAt < since)) continue;
    const k = dayKey(p.observedAt);
    const cur = byDay.get(k);
    if (cur === undefined || p.priceCents < cur) byDay.set(k, p.priceCents);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, priceCents]) => ({ day, priceCents }));
}

/** Lowest in-stock price ever observed (earliest occurrence wins ties). */
export function allTimeLow<T extends Observation>(points: T[]): T | null {
  let low: T | null = null;
  for (const p of points) {
    if (!p.inStock) continue;
    if (
      !low ||
      p.priceCents < low.priceCents ||
      (p.priceCents === low.priceCents && p.observedAt < low.observedAt)
    )
      low = p;
  }
  return low;
}
