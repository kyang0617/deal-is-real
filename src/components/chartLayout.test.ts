import { describe, expect, it } from "vitest";
import { priceDomain, spreadLabels } from "./chartLayout";

describe("priceDomain", () => {
  it("pads and rounds around the data", () => {
    const [lo, hi] = priceDomain([24199, 38499]);
    expect(lo).toBeLessThan(24199);
    expect(hi).toBeGreaterThan(38499);
    expect(lo % 1000).toBe(0);
    expect(hi % 1000).toBe(0);
  });
  it("never goes below zero", () => {
    expect(priceDomain([500, 600])[0]).toBeGreaterThanOrEqual(0);
  });
});

describe("spreadLabels", () => {
  it("leaves well-separated labels alone", () => {
    expect(spreadLabels([10, 50, 90], 12, 0, 100)).toEqual([10, 50, 90]);
  });
  it("separates overlapping labels by at least the gap, preserving input order", () => {
    const out = spreadLabels([50, 49, 51, 50], 12, 0, 200);
    const sorted = [...out].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(12);
    expect(out[1]).toBe(Math.min(...out)); // the highest-on-screen anchor stays on top
  });
  it("keeps labels inside the bounds", () => {
    const out = spreadLabels([98, 99, 100], 10, 0, 100);
    expect(Math.max(...out)).toBeLessThanOrEqual(100);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });
});
