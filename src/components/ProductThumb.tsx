/** Placeholder thumbnail until products have images: brand initial on a tinted tile. */
export function ProductThumb({ brand, size = 48 }: { brand: string | null; size?: number }) {
  const label = (brand ?? "?").slice(0, 1).toUpperCase();
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-lg bg-accent/10 font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {label}
    </div>
  );
}
