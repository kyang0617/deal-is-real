/** Pure layout helpers for charts (no React), unit-tested. */

/** Padded, rounded y-axis domain for a set of prices in cents. */
export function priceDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, max * 0.05, 100);
  const step = span > 50_000 ? 10_000 : span > 10_000 ? 5_000 : span > 2_000 ? 1_000 : 100;
  return [
    Math.max(0, Math.floor((min - span * 0.08) / step) * step),
    Math.ceil((max + span * 0.08) / step) * step,
  ];
}

/**
 * Nudge label y positions apart so none are closer than `gap` px, keeping them inside
 * [top, bottom] and as close as possible to their anchors. Input order is preserved.
 */
export function spreadLabels(ys: number[], gap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => Math.min(Math.max(o.y, top), bottom));
  // Push down to enforce the gap, then pull back up from the bottom edge.
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  if (placed.length && placed.at(-1)! > bottom) {
    placed[placed.length - 1] = bottom;
    for (let k = placed.length - 2; k >= 0; k--)
      placed[k] = Math.min(placed[k], placed[k + 1] - gap);
  }
  const out = new Array<number>(ys.length);
  order.forEach((o, k) => (out[o.i] = placed[k]));
  return out;
}
