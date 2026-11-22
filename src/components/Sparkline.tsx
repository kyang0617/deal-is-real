import type { DailyPoint } from "@/domain/prices/summary";

/** Tiny server-rendered SVG line of daily lows. */
export function Sparkline({
  points,
  width = 120,
  height = 32,
}: {
  points: DailyPoint[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return <div style={{ width, height }} aria-hidden />;
  const prices = points.map((p) => p.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const pad = 2;
  const path = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (p.priceCents - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = path.split(" ").at(-1)!.slice(1).split(",");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`90-day price trend, ${points.length} days`}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-muted" />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-accent" />
    </svg>
  );
}
