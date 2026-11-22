"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatMoney } from "@/domain/money";
import { retailerColor } from "@/components/retailerColors";
import { priceDomain, spreadLabels } from "@/components/chartLayout";
import type { ChartRow } from "@/services/products";

const RANGES = [
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "all", label: "All", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

interface Props {
  data: ChartRow[];
  series: { slug: string; name: string }[];
  currency: string;
  allTimeLow: { priceCents: number; day: string; retailerSlug: string } | null;
}

const DAY_MS = 86_400_000;
// Plot geometry, needed to place end labels: h-80 container (320px), top margin, default x-axis height.
const CHART_HEIGHT = 320;
const MARGIN_TOP = 16;
const X_AXIS_HEIGHT = 30;
const PLOT_BOTTOM = CHART_HEIGHT - X_AXIS_HEIGHT;
const monthDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const shortDate = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
const longDate = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export function PriceHistoryChart({ data, series, currency, allTimeLow }: Props) {
  const [range, setRange] = useState<RangeKey>("1y");

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days;
    if (!Number.isFinite(days) || data.length === 0) return data;
    const lastDay = new Date(`${data.at(-1)!.day}T00:00:00Z`).getTime();
    const cutoff = new Date(lastDay - (days - 1) * DAY_MS).toISOString().slice(0, 10);
    return data.filter((r) => r.day >= cutoff);
  }, [data, range]);

  const domain = useMemo(
    () =>
      priceDomain(
        visible.flatMap((r) =>
          series.map((s) => r[s.slug]).filter((v): v is number => typeof v === "number"),
        ),
      ),
    [visible, series],
  );

  // Direct end-of-line labels, nudged apart so close prices don't overlap.
  const endLabelY = useMemo(() => {
    const last = visible.at(-1);
    const withValue = series.filter((s) => typeof last?.[s.slug] === "number");
    const [lo, hi] = domain;
    const toY = (v: number) => MARGIN_TOP + (1 - (v - lo) / (hi - lo)) * (PLOT_BOTTOM - MARGIN_TOP);
    const ys = spreadLabels(
      withValue.map((s) => toY(last![s.slug] as number)),
      13,
      MARGIN_TOP,
      PLOT_BOTTOM,
    );
    return new Map(withValue.map((s, i) => [s.slug, ys[i]]));
  }, [visible, series, domain]);

  const lowVisible = allTimeLow && visible.some((r) => r.day === allTimeLow.day);
  const fmt = (cents: number) => formatMoney(cents, currency);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legend">
          {series.map((s) => (
            <li key={s.slug} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: retailerColor(s.slug) }}
              />
              {s.name}
            </li>
          ))}
        </ul>
        <div
          role="group"
          aria-label="Time range"
          className="flex rounded-lg border border-border p-0.5"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                range === r.key
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 16, right: 72, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={range === "30d" || range === "90d" ? monthDay : shortDate}
              minTickGap={40}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--axis)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatMoney(v, currency).replace(/\.00$/, "")}
              domain={domain}
              allowDataOverflow
              width={72}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} series={series} fmt={fmt} />}
              cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            />
            {series.map((s) => (
              <Line
                key={s.slug}
                dataKey={s.slug}
                name={s.name}
                type="stepAfter"
                stroke={retailerColor(s.slug)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
                label={(props: { index?: number; x?: number | string; y?: number | string }) =>
                  props.index === visible.length - 1 && endLabelY.has(s.slug) ? (
                    <text
                      key={`${s.slug}-end`}
                      x={Number(props.x) + 6}
                      y={endLabelY.get(s.slug)}
                      dy={4}
                      fontSize={11}
                      fill="var(--muted)"
                    >
                      {s.name}
                    </text>
                  ) : (
                    <g key={`${s.slug}-${props.index}`} />
                  )
                }
              />
            ))}
            {lowVisible && (
              <ReferenceDot
                x={allTimeLow.day}
                y={allTimeLow.priceCents}
                r={5}
                fill={retailerColor(allTimeLow.retailerSlug)}
                stroke="var(--surface)"
                strokeWidth={2}
                label={{
                  value: `Low ${fmt(allTimeLow.priceCents)}`,
                  position: "bottom",
                  fill: "var(--foreground)",
                  fontSize: 11,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Observed prices only. Gaps mean the item was out of stock or not checked that day.
      </p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  fmt,
}: TooltipContentProps & {
  series: Props["series"];
  fmt: (c: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ChartRow;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">{longDate(String(label))}</p>
      <ul className="space-y-0.5">
        {series.map((s) => {
          const v = row[s.slug];
          return (
            <li key={s.slug} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{ background: retailerColor(s.slug) }}
                />
                {s.name}
              </span>
              <span className="tabular-nums">
                {typeof v === "number" ? fmt(v) : <span className="text-muted">—</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
