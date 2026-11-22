import { describe, expect, it } from "vitest";
import {
  blackFriday,
  eventIntensity,
  generatePriceSeries,
  primeDay,
  retailRound,
  utcDate,
  type PriceSeriesInput,
  type RetailerProfile,
} from "./priceGen";

const amazon: RetailerProfile = {
  priceFactor: 1,
  eventDepth: 1,
  flashSalesPerYear: 3,
  primeDay: true,
  fakeSaleChance: 0,
  stockoutChance: 0,
};

const input: PriceSeriesInput = {
  seed: "test-listing",
  basePriceCents: 32999,
  maxEventDiscount: 0.3,
  volatility: 0.01,
  retailer: amazon,
  start: utcDate("2025-11-01"),
  end: utcDate("2026-11-22"),
};

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const between = (from: string, to: string) => (p: { observedAt: Date }) =>
  p.observedAt >= utcDate(from) && p.observedAt <= utcDate(to);

describe("calendar", () => {
  it("finds Black Friday and Prime Day", () => {
    expect(blackFriday(2025).toISOString().slice(0, 10)).toBe("2025-11-28");
    expect(blackFriday(2026).toISOString().slice(0, 10)).toBe("2026-11-27");
    expect(primeDay(2026).toISOString().slice(0, 10)).toBe("2026-07-14");
  });

  it("gives Black Friday full intensity and ordinary days none", () => {
    expect(eventIntensity(utcDate("2025-11-28"), amazon)).toBe(1);
    expect(eventIntensity(utcDate("2026-03-10"), amazon)).toBe(0);
  });
});

describe("retailRound", () => {
  it("produces .99 endings", () => {
    expect(retailRound(32950)).toBe(32999);
    expect(retailRound(1234)).toBe(1249);
  });
});

describe("generatePriceSeries", () => {
  const series = generatePriceSeries(input);

  it("is deterministic for a given seed", () => {
    expect(generatePriceSeries(input)).toEqual(series);
    expect(generatePriceSeries({ ...input, seed: "other" })).not.toEqual(series);
  });

  it("covers the date range at daily granularity with a few missed days", () => {
    expect(series.length).toBeGreaterThan(370);
    expect(series.length).toBeLessThanOrEqual(387);
    expect(series.at(-1)!.observedAt.toISOString().slice(0, 10)).toBe("2026-11-22");
  });

  it("dips hard over Black Friday 2025 relative to a normal month", () => {
    const bf = series.filter(between("2025-11-27", "2025-12-01")).map((p) => p.priceCents);
    const march = series.filter(between("2026-03-01", "2026-03-31")).map((p) => p.priceCents);
    expect(Math.min(...bf)).toBeLessThan(median(march) * 0.8);
  });

  it("dips on Prime Day for Amazon", () => {
    const pd = series.filter(between("2026-07-14", "2026-07-15")).map((p) => p.priceCents);
    const june = series.filter(between("2026-06-01", "2026-06-30")).map((p) => p.priceCents);
    expect(Math.min(...pd)).toBeLessThan(median(june) * 0.8);
  });

  it("keeps the claimed list price above every observed price", () => {
    for (const p of series) expect(p.listPriceCents).toBeGreaterThan(p.priceCents);
    expect(series[0].listPriceCents).toBeGreaterThan(median(series.map((p) => p.priceCents)) * 1.1);
  });

  it("applies permanent markdowns", () => {
    const marked = generatePriceSeries({
      ...input,
      retailer: { ...amazon, flashSalesPerYear: 0 },
      markdowns: [{ date: "2026-04-01", pct: 0.2 }],
    });
    const feb = marked.filter(between("2026-02-01", "2026-02-10")).map((p) => p.priceCents);
    const may = marked.filter(between("2026-05-01", "2026-05-10")).map((p) => p.priceCents);
    expect(median(may)).toBeLessThan(median(feb) * 0.85);
  });
});
