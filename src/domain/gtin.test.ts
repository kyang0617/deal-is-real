import { describe, expect, it } from "vitest";
import { gtinCheckDigit, isValidGtin, normalizeGtin, withCheckDigit } from "./gtin";

describe("gtin", () => {
  it("computes GS1 check digits", () => {
    expect(gtinCheckDigit("03600029145")).toBe(2); // UPC-A 036000291452
    expect(gtinCheckDigit("400638133393")).toBe(1); // EAN-13 4006381333931
  });

  it("validates known codes", () => {
    expect(isValidGtin("036000291452")).toBe(true);
    expect(isValidGtin("4006381333931")).toBe(true);
    expect(isValidGtin("036000291453")).toBe(false);
    expect(isValidGtin("12345")).toBe(false);
    expect(isValidGtin("abc")).toBe(false);
  });

  it("normalizes UPC and EAN forms of the same item to the same GTIN-14", () => {
    expect(normalizeGtin("036000291452")).toBe("00036000291452");
    expect(normalizeGtin("0036000291452")).toBe("00036000291452");
    expect(normalizeGtin("0 36000-29145 2")).toBe("00036000291452");
  });

  it("returns null for invalid or missing input", () => {
    expect(normalizeGtin("036000291453")).toBeNull();
    expect(normalizeGtin(undefined)).toBeNull();
    expect(normalizeGtin("")).toBeNull();
  });

  it("withCheckDigit produces valid codes", () => {
    expect(isValidGtin(withCheckDigit("02724292345"))).toBe(true);
  });
});
