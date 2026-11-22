import { describe, expect, it } from "vitest";
import { formatMoney, toCents } from "./money";

describe("toCents", () => {
  it.each([
    ["$1,299.99", 129999],
    ["1299.99", 129999],
    ["12,99", 1299],
    ["  $5 ", 500],
    [19.99, 1999],
    ["", null],
    ["free", null],
  ])("%s -> %s", (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });
});

describe("formatMoney", () => {
  it("formats USD cents", () => {
    expect(formatMoney(129999)).toBe("$1,299.99");
  });
});
