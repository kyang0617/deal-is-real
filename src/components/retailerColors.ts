/**
 * Fixed retailer → categorical slot mapping, so a retailer keeps its color on every chart
 * (color follows the entity, never its rank). Values are CSS variables defined in globals.css.
 */
const SLOTS: Record<string, number> = { amazon: 1, walmart: 2, target: 3, bestbuy: 4 };
const OTHER_SLOT = 5; // brand / Shopify stores

export function retailerColor(slug: string): string {
  return `var(--series-${SLOTS[slug] ?? OTHER_SLOT})`;
}
