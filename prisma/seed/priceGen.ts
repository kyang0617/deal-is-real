/**
 * Deterministic fake price-history generator for seed data.
 *
 * Produces one observation per day per listing with:
 *  - a slowly mean-reverting random walk around the street price (+ per-retailer offset)
 *  - permanent markdowns (e.g. when a successor model launches)
 *  - Black Friday / Cyber Monday dips each year (with an "early deals" ramp beforehand)
 *  - Prime Day in July (Amazon deepest; other retailers run competing sales)
 *  - smaller holiday-weekend and random flash sales
 *  - occasional "fake sales": price is raised for a couple of weeks before a "sale" back to normal
 *  - out-of-stock stretches and randomly missed observations
 *  - an inflated retailer "list price" ("was" price) that is never actually charged
 *
 * Pure: same inputs → same output. No Date.now(), no Math.random().
 */

export const DAY_MS = 86_400_000;

export type RetailerSlug = string;

export interface RetailerProfile {
  /** Multiplier on the product's street price (0.98 = typically 2% cheaper). */
  priceFactor: number;
  /** 0–1: how deep this retailer discounts during shared sale events, relative to the product's max. */
  eventDepth: number;
  /** Expected number of random flash sales per year. */
  flashSalesPerYear: number;
  /** Whether this retailer runs Prime Day itself (vs. a competing event). */
  primeDay: boolean;
  /** 0–1 probability this listing runs one fake sale per year. */
  fakeSaleChance: number;
  /** Chance per year of an out-of-stock stretch. */
  stockoutChance: number;
}

export interface Markdown {
  /** UTC date (YYYY-MM-DD) the permanent price cut takes effect. */
  date: string;
  /** Fractional cut, e.g. 0.12 for 12% off going forward. */
  pct: number;
}

export interface PriceSeriesInput {
  seed: string;
  /** Typical street price at the start of history, in cents. */
  basePriceCents: number;
  /** Max discount for this product at the deepest event (Black Friday), e.g. 0.3. */
  maxEventDiscount: number;
  /** Daily noise scale (fraction of price), e.g. 0.01. */
  volatility: number;
  markdowns?: Markdown[];
  retailer: RetailerProfile;
  /** Inclusive UTC midnight start / end. */
  start: Date;
  end: Date;
  /** Probability an individual day is not observed. */
  missingDayRate?: number;
}

export interface GeneratedPoint {
  observedAt: Date;
  priceCents: number;
  inStock: boolean;
  listPriceCents: number;
}

// ---------------------------------------------------------------------------
// Seeded RNG

function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 */
export function createRng(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Calendar helpers (all UTC)

export function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7));
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, month, last.getUTCDate() - offset));
}

/** US Thanksgiving is the 4th Thursday of November; Black Friday is the next day. */
export function blackFriday(year: number): Date {
  const thanksgiving = nthWeekdayOfMonth(year, 10, 4, 4);
  return new Date(thanksgiving.getTime() + DAY_MS);
}

/** Prime Day: approximated as the 2nd Tuesday of July + the following Wednesday. */
export function primeDay(year: number): Date {
  return nthWeekdayOfMonth(year, 6, 2, 2);
}

const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

/**
 * Event discount multiplier (0 = none, 1 = the product's full max discount) for a given day,
 * before applying the retailer's eventDepth.
 */
export function eventIntensity(day: Date, retailer: RetailerProfile): number {
  const year = day.getUTCFullYear();
  let intensity = 0;

  // Black Friday → Cyber Monday at full depth; "early Black Friday" deals ramp up two weeks before;
  // a lighter tail of holiday sales into mid December.
  for (const y of [year - 1, year]) {
    const bf = blackFriday(y);
    const d = daysBetween(bf, day);
    if (d >= -1 && d <= 3) intensity = Math.max(intensity, 1);
    else if (d >= -16 && d < -1) intensity = Math.max(intensity, 0.45 + 0.4 * ((d + 16) / 15));
    else if (d > 3 && d <= 20) intensity = Math.max(intensity, 0.35);
  }

  // Prime Day (2 days). Competing retailers run their own events at the same time, slightly wider.
  const pd = primeDay(year);
  const pdDelta = daysBetween(pd, day);
  if (retailer.primeDay ? pdDelta >= 0 && pdDelta <= 1 : pdDelta >= -1 && pdDelta <= 2) {
    intensity = Math.max(intensity, retailer.primeDay ? 0.9 : 0.55);
  }

  // Holiday weekends: Presidents Day (3rd Mon Feb), Memorial Day (last Mon May), Labor Day (1st Mon Sep).
  for (const monday of [
    nthWeekdayOfMonth(year, 1, 1, 3),
    lastWeekdayOfMonth(year, 4, 1),
    nthWeekdayOfMonth(year, 8, 1, 1),
  ]) {
    const d = daysBetween(monday, day);
    if (d >= -3 && d <= 0) intensity = Math.max(intensity, 0.3);
  }

  return intensity;
}

// ---------------------------------------------------------------------------

/** Round to a retail-looking price: $X.99 above $20, nearest $0.49/$0.99 below. */
export function retailRound(cents: number): number {
  if (cents >= 2000) return Math.max(99, Math.round(cents / 100) * 100 - 1);
  return Math.max(49, Math.round(cents / 50) * 50 - 1);
}

interface Window {
  start: number; // day index
  end: number; // inclusive
  value: number;
}

function randomWindows(
  rng: () => number,
  totalDays: number,
  expectedCount: number,
  minLen: number,
  maxLen: number,
  value: () => number,
): Window[] {
  const windows: Window[] = [];
  const count = Math.floor(expectedCount) + (rng() < expectedCount % 1 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const len = minLen + Math.floor(rng() * (maxLen - minLen + 1));
    const start = Math.floor(rng() * Math.max(1, totalDays - len));
    windows.push({ start, end: start + len - 1, value: value() });
  }
  return windows;
}

const inWindow = (ws: Window[], i: number) => ws.find((w) => i >= w.start && i <= w.end);

export function generatePriceSeries(input: PriceSeriesInput): GeneratedPoint[] {
  const rng = createRng(input.seed);
  const start = startOfUtcDay(input.start);
  const end = startOfUtcDay(input.end);
  const totalDays = daysBetween(start, end) + 1;
  const years = totalDays / 365;
  const { retailer } = input;
  const missingDayRate = input.missingDayRate ?? 0.03;

  // Pre-draw per-listing random events.
  const flashSales = randomWindows(
    rng,
    totalDays,
    retailer.flashSalesPerYear * years,
    3,
    7,
    () => 0.08 + rng() * 0.07,
  );
  const stockouts = randomWindows(rng, totalDays, retailer.stockoutChance * years, 3, 10, () => 1);
  // Fake sale: +10–18% for ~2 weeks, followed by a week-long "sale" at roughly the normal price.
  const fakeSales = randomWindows(
    rng,
    totalDays - 21,
    retailer.fakeSaleChance * years,
    12,
    16,
    () => 0.1 + rng() * 0.08,
  );

  // The "was" price is a fixed, inflated anchor that the listing never actually charges.
  const listPriceCents = retailRound(
    input.basePriceCents * retailer.priceFactor * (1.15 + rng() * 0.25),
  );

  const markdowns = (input.markdowns ?? [])
    .map((m) => ({ day: daysBetween(start, utcDate(m.date)), pct: m.pct }))
    .sort((a, b) => a.day - b.day);

  const points: GeneratedPoint[] = [];
  let walk = 0; // mean-reverting noise, as a fraction of price

  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start.getTime() + i * DAY_MS);
    walk = walk * 0.85 + (rng() - 0.5) * 2 * input.volatility;

    let price = input.basePriceCents * retailer.priceFactor;
    for (const m of markdowns) if (i >= m.day) price *= 1 - m.pct;
    const street = price;

    price *= 1 + walk;

    // Event discount: take the deepest of scheduled events and random flash sales.
    const scheduled = eventIntensity(day, retailer) * retailer.eventDepth * input.maxEventDiscount;
    const flash = inWindow(flashSales, i)?.value ?? 0;
    // Jitter event depth per day slightly so retailers don't move in perfect lockstep.
    const discount = Math.max(scheduled * (0.93 + rng() * 0.14), flash);
    price *= 1 - discount;

    const fake = fakeSales.find((w) => i >= w.start && i <= w.end + 7);
    if (fake && discount === 0) {
      // Inflated for the window, then a "sale" that lands back near the normal street price.
      price = i <= fake.end ? street * (1 + fake.value) : street * (0.99 + rng() * 0.02);
    }

    const observed = rng() >= missingDayRate || i === totalDays - 1; // always observe "today"
    if (!observed) continue;

    points.push({
      observedAt: day,
      priceCents: retailRound(price),
      inStock: !inWindow(stockouts, i),
      listPriceCents: Math.max(listPriceCents, retailRound(price * 1.05)),
    });
  }

  return points;
}
