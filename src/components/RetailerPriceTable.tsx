import { formatMoney } from "@/domain/money";
import { retailerColor } from "@/components/retailerColors";
import type { RetailerOffer } from "@/services/products";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Current offer per retailer. Doubles as the accessible table view of the chart. */
export function RetailerPriceTable({ offers }: { offers: RetailerOffer[] }) {
  const inStock = offers.filter((o) => o.latest?.inStock);
  const bestCents = inStock.length ? Math.min(...inStock.map((o) => o.latest!.priceCents)) : null;
  const sorted = [...offers].sort(
    (a, b) =>
      Number(b.latest?.inStock ?? false) - Number(a.latest?.inStock ?? false) ||
      (a.latest?.priceCents ?? Infinity) - (b.latest?.priceCents ?? Infinity),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-2 pr-4 font-medium">Retailer</th>
            <th className="py-2 pr-4 text-right font-medium">Price</th>
            <th className="py-2 pr-4 text-right font-medium">
              <span title="The retailer's own 'was' / list price. Shown for reference only; never used to judge deals.">
                Retailer&apos;s &ldquo;was&rdquo; price*
              </span>
            </th>
            <th className="py-2 pr-4 font-medium">Stock</th>
            <th className="py-2 font-medium">Checked</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const l = o.latest;
            const isBest = l?.inStock && l.priceCents === bestCents;
            return (
              <tr key={o.listingId} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4">
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-full"
                      style={{ background: retailerColor(o.retailerSlug) }}
                    />
                    {o.retailerName}
                  </a>
                  {o.retailerProductId && (
                    <span className="ml-4.5 font-mono text-[11px] text-muted">
                      {o.retailerProductId}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {l ? (
                    <span className={isBest ? "font-semibold" : undefined}>
                      {formatMoney(l.priceCents, l.currency)}
                      {isBest && (
                        <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                          Best
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-right text-muted tabular-nums line-through decoration-muted/60">
                  {l?.listPriceCents ? formatMoney(l.listPriceCents, l.currency) : ""}
                </td>
                <td className="py-2.5 pr-4">
                  {l?.inStock ? (
                    <span>In stock</span>
                  ) : (
                    <span className="text-muted">Out of stock</span>
                  )}
                </td>
                <td className="py-2.5 text-muted">{l ? fmtDate(l.observedAt) : "Never"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        * &ldquo;Was&rdquo; prices are the retailer&apos;s own claim and are often inflated. Deal
        ratings use only prices we&apos;ve actually observed.
      </p>
    </div>
  );
}
