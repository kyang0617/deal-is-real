/**
 * GTIN helpers. UPC-A (12), EAN-13, GTIN-8 and GTIN-14 are all normalized to GTIN-14
 * (left-padded with zeros) so the same item compares equal regardless of source format.
 */

/** GS1 mod-10 check digit for the given digits (without check digit). */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  // Weights alternate 3,1,3,1... starting from the rightmost body digit.
  for (let i = 0; i < body.length; i++) {
    const digit = body.charCodeAt(body.length - 1 - i) - 48;
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code.at(-1));
}

/** Strip formatting, validate, and pad to 14 digits. Returns null for anything that isn't a valid GTIN. */
export function normalizeGtin(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const digits = String(raw).replace(/[\s-]/g, "");
  if (!isValidGtin(digits)) return null;
  return digits.padStart(14, "0");
}

/** Append a check digit to a body of digits (useful for fixtures/seed data). */
export function withCheckDigit(body: string): string {
  return body + gtinCheckDigit(body);
}
