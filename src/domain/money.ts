/** Money is always stored as integer minor units (cents) + ISO 4217 currency code. */

export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

/** Parse a human/structured-data price ("$1,299.99", "1299.99", 1299.99) into cents. */
export function toCents(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) : null;
  const cleaned = value.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return null;
  // Treat a trailing ",dd" as a decimal comma (e.g. "12,99"), otherwise commas are thousands separators.
  const normalized =
    /,\d{2}$/.test(cleaned) && !cleaned.includes(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
