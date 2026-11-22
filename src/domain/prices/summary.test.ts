import { describe, expect, it } from "vitest";
import {
  allTimeLow,
  bestCurrentOffer,
  dailyMinSeries,
  latestByListing,
  type Observation,
} from "./summary";

const at = (iso: string) => new Date(iso);
const obs = (listingId: string, priceCents: number, iso: string, inStock = true): Observation => ({
  listingId,
  priceCents,
  inStock,
  observedAt: at(iso),
});

const points = [
  obs("a", 1000, "2026-01-01T10:00:00Z"),
  obs("a", 900, "2026-01-02T10:00:00Z"),
  obs("b", 950, "2026-01-01T12:00:00Z"),
  obs("b", 800, "2026-01-02T09:00:00Z", false),
  obs("c", 700, "2025-12-01T10:00:00Z"),
  obs("c", 1200, "2026-01-02T08:00:00Z"),
];

describe("latestByListing", () => {
  it("keeps the newest observation per listing", () => {
    const latest = latestByListing(points);
    expect(latest.get("a")!.priceCents).toBe(900);
    expect(latest.get("b")!.priceCents).toBe(800);
    expect(latest.get("c")!.priceCents).toBe(1200);
  });
});

describe("bestCurrentOffer", () => {
  it("ignores out-of-stock listings", () => {
    expect(bestCurrentOffer(points)!.listingId).toBe("a");
  });
  it("returns null when nothing is in stock", () => {
    expect(bestCurrentOffer([obs("a", 1, "2026-01-01T00:00:00Z", false)])).toBeNull();
  });
});

describe("dailyMinSeries", () => {
  it("takes the cheapest in-stock price per day, sorted", () => {
    expect(dailyMinSeries(points)).toEqual([
      { day: "2025-12-01", priceCents: 700 },
      { day: "2026-01-01", priceCents: 950 },
      { day: "2026-01-02", priceCents: 900 },
    ]);
  });
  it("respects the since cutoff", () => {
    expect(dailyMinSeries(points, at("2026-01-02T00:00:00Z"))).toEqual([
      { day: "2026-01-02", priceCents: 900 },
    ]);
  });
});

describe("allTimeLow", () => {
  it("finds the lowest in-stock price", () => {
    expect(allTimeLow(points)!.priceCents).toBe(700);
  });
});
