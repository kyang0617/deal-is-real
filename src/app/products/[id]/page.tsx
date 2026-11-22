import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { ProductThumb } from "@/components/ProductThumb";
import { RetailerPriceTable } from "@/components/RetailerPriceTable";
import { formatMoney } from "@/domain/money";
import { getProductDetail } from "@/services/products";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/watchlist" className="text-sm text-muted hover:text-foreground">
        ← Watchlist
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-foreground/5" />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/products/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  const detail = await getProductDetail(id);
  if (!detail) notFound();

  const { product, offers, chart, series, allTimeLow, watch } = detail;
  const currency = offers.find((o) => o.latest)?.latest?.currency ?? "USD";
  const inStock = offers.filter((o) => o.latest?.inStock);
  const best = inStock.sort((a, b) => a.latest!.priceCents - b.latest!.priceCents)[0];
  const variant = (product.variantAttributes ?? {}) as Record<string, string>;

  return (
    <>
      <header className="flex items-start gap-4">
        <ProductThumb brand={product.brand} size={64} />
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {Object.entries(variant).map(([k, v]) => (
              <span key={k} className="rounded-full border border-border px-2 py-0.5">
                <span className="text-muted capitalize">{k}:</span> {v}
              </span>
            ))}
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            {[
              ["Brand", product.brand],
              ["MPN", product.mpn],
              ["GTIN", product.gtin],
              ["Category", product.category],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-1">
                  <dt>{k}</dt>
                  <dd className="font-mono text-foreground">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Price summary">
        <Stat
          label="Best price now"
          value={best ? formatMoney(best.latest!.priceCents, currency) : "Out of stock"}
          sub={best ? `at ${best.retailerName}` : "at every tracked retailer"}
        />
        <Stat
          label="Lowest observed"
          value={allTimeLow ? formatMoney(allTimeLow.priceCents, currency) : "—"}
          sub={
            allTimeLow
              ? `${allTimeLow.retailerName}, ${new Date(`${allTimeLow.day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`
              : undefined
          }
        />
        <Stat
          label="Your target"
          value={watch?.targetPriceCents ? formatMoney(watch.targetPriceCents, currency) : "—"}
          sub={
            watch ? (watch.targetPriceCents ? undefined : "No target set") : "Not on your watchlist"
          }
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Price history by retailer</h2>
        <PriceHistoryChart
          data={chart}
          series={series}
          currency={currency}
          allTimeLow={allTimeLow}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-2 font-medium">Current prices</h2>
        <RetailerPriceTable offers={offers} />
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
