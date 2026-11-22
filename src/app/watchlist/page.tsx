import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProductThumb } from "@/components/ProductThumb";
import { Sparkline } from "@/components/Sparkline";
import { formatMoney } from "@/domain/money";
import { getCurrentUser } from "@/lib/currentUser";
import { getWatchlist, type WatchlistRow } from "@/services/watchlist";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-sm text-muted">Best current in-stock price across retailers.</p>
      </div>
      <Suspense fallback={<WatchlistSkeleton />}>
        <WatchlistItems />
      </Suspense>
    </div>
  );
}

async function WatchlistItems() {
  await connection();
  const user = await getCurrentUser();
  const rows = await getWatchlist(user.id, new Date());

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
        Your watchlist is empty.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {rows.map((row) => (
        <WatchlistRowItem key={row.id} row={row} />
      ))}
    </ul>
  );
}

function WatchlistRowItem({ row }: { row: WatchlistRow }) {
  const { product, best, targetPriceCents } = row;
  const hitTarget = best && targetPriceCents !== null && best.priceCents <= targetPriceCents;

  return (
    <li>
      <Link
        href={`/products/${product.id}`}
        className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 transition-colors hover:bg-foreground/[0.03]"
      >
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-3">
          <ProductThumb brand={product.brand} />
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="text-xs text-muted">
              {[product.brand, product.category].filter(Boolean).join(" · ")} · {row.retailerCount}{" "}
              {row.retailerCount === 1 ? "retailer" : "retailers"}
            </p>
          </div>
        </div>

        <div className="hidden sm:block">
          <Sparkline points={row.sparkline} />
        </div>

        <div className="w-36 text-right">
          {best ? (
            <>
              <p className="text-lg font-semibold tabular-nums">
                {formatMoney(best.priceCents, best.currency)}
              </p>
              <p className="text-xs text-muted">at {best.retailerName}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Out of stock everywhere</p>
          )}
        </div>

        <div className="w-36 text-right text-xs whitespace-nowrap">
          {targetPriceCents !== null ? (
            <span
              className={
                hitTarget
                  ? "rounded-full bg-accent/15 px-2 py-1 font-medium text-accent"
                  : "text-muted"
              }
            >
              {hitTarget ? "Target hit · " : "Target "}
              {formatMoney(targetPriceCents)}
            </span>
          ) : (
            <span className="text-muted">No target</span>
          )}
        </div>
      </Link>
    </li>
  );
}

function WatchlistSkeleton() {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface" aria-busy>
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-4">
          <div className="size-12 animate-pulse rounded-lg bg-foreground/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
        </li>
      ))}
    </ul>
  );
}
