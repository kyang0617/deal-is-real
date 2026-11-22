/**
 * Fake seed catalog. Product names are real-world-style for realism, but GTINs, retailer IDs,
 * URLs and prices are generated — they do not correspond to real listings.
 */
import { withCheckDigit } from "../../src/domain/gtin";
import type { Markdown, RetailerProfile } from "./priceGen";

export interface SeedRetailer {
  slug: string;
  name: string;
  domain: string;
  profile: RetailerProfile;
}

export const RETAILERS: SeedRetailer[] = [
  {
    slug: "amazon",
    name: "Amazon",
    domain: "amazon.com",
    profile: {
      priceFactor: 0.98,
      eventDepth: 1,
      flashSalesPerYear: 4,
      primeDay: true,
      fakeSaleChance: 0.3,
      stockoutChance: 0.2,
    },
  },
  {
    slug: "walmart",
    name: "Walmart",
    domain: "walmart.com",
    profile: {
      priceFactor: 0.99,
      eventDepth: 0.9,
      flashSalesPerYear: 2,
      primeDay: false,
      fakeSaleChance: 0.5,
      stockoutChance: 0.4,
    },
  },
  {
    slug: "target",
    name: "Target",
    domain: "target.com",
    profile: {
      priceFactor: 1.01,
      eventDepth: 0.85,
      flashSalesPerYear: 3,
      primeDay: false,
      fakeSaleChance: 0.3,
      stockoutChance: 0.5,
    },
  },
  {
    slug: "bestbuy",
    name: "Best Buy",
    domain: "bestbuy.com",
    profile: {
      priceFactor: 1.0,
      eventDepth: 0.95,
      flashSalesPerYear: 3,
      primeDay: false,
      fakeSaleChance: 0.4,
      stockoutChance: 0.3,
    },
  },
  {
    slug: "shop:allbirds.com",
    name: "Allbirds",
    domain: "allbirds.com",
    profile: {
      priceFactor: 1.0,
      eventDepth: 0.6,
      flashSalesPerYear: 1,
      primeDay: false,
      fakeSaleChance: 0,
      stockoutChance: 0.6,
    },
  },
];

export interface SeedProduct {
  key: string;
  name: string;
  brand: string;
  mpn: string;
  /** UPC body without check digit; the check digit is appended. */
  upcBody: string;
  category: string;
  basePriceCents: number;
  maxEventDiscount: number;
  volatility: number;
  markdowns?: Markdown[];
  variantGroupKey?: string;
  variantAttributes?: Record<string, string>;
  retailers: string[];
  /** URL slug used to build retailer URLs. */
  slug: string;
  watch?: { targetPriceCents?: number };
}

export const PRODUCTS: SeedProduct[] = [
  {
    key: "sony-xm5",
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    brand: "Sony",
    mpn: "WH1000XM5/B",
    upcBody: "02724292345",
    category: "Headphones",
    basePriceCents: 37999,
    maxEventDiscount: 0.3,
    volatility: 0.012,
    markdowns: [{ date: "2026-05-20", pct: 0.1 }],
    variantGroupKey: "sony-wh1000xm5",
    variantAttributes: { color: "Black" },
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "sony-wh-1000xm5-wireless-headphones-black",
    watch: { targetPriceCents: 27999 },
  },
  {
    key: "airpods-pro-2",
    name: "Apple AirPods Pro 2 with USB-C Charging Case",
    brand: "Apple",
    mpn: "MTJV3AM/A",
    upcBody: "19594985423",
    category: "Headphones",
    basePriceCents: 22999,
    maxEventDiscount: 0.28,
    volatility: 0.015,
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "apple-airpods-pro-2-usb-c",
    watch: { targetPriceCents: 16999 },
  },
  {
    key: "lg-c4-65",
    name: 'LG 65" Class C4 Series OLED evo 4K Smart TV',
    brand: "LG",
    mpn: "OLED65C4PUA",
    upcBody: "19563800512",
    category: "TVs",
    basePriceCents: 219999,
    maxEventDiscount: 0.3,
    volatility: 0.008,
    markdowns: [
      { date: "2026-03-15", pct: 0.15 },
      { date: "2026-08-01", pct: 0.1 },
    ],
    retailers: ["amazon", "walmart", "bestbuy"],
    slug: "lg-65-class-c4-oled-4k-tv",
    watch: {},
  },
  {
    key: "switch-oled",
    name: "Nintendo Switch – OLED Model with White Joy-Con",
    brand: "Nintendo",
    mpn: "HEGSKAAAA",
    upcBody: "04549699659",
    category: "Gaming",
    basePriceCents: 34999,
    maxEventDiscount: 0.1,
    volatility: 0.004,
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "nintendo-switch-oled-white",
    watch: { targetPriceCents: 29999 },
  },
  {
    key: "macbook-air-m4",
    name: 'Apple MacBook Air 13" M4 chip, 16GB, 256GB SSD – Midnight',
    brand: "Apple",
    mpn: "MW123LL/A",
    upcBody: "19594997811",
    category: "Laptops",
    basePriceCents: 99999,
    maxEventDiscount: 0.22,
    volatility: 0.01,
    markdowns: [{ date: "2026-10-20", pct: 0.08 }],
    variantGroupKey: "macbook-air-13-m4",
    variantAttributes: { color: "Midnight", memory: "16GB", storage: "256GB" },
    retailers: ["amazon", "bestbuy"],
    slug: "apple-macbook-air-13-m4-16gb-256gb-midnight",
    watch: {},
  },
  {
    key: "dyson-v15",
    name: "Dyson V15 Detect Cordless Vacuum",
    brand: "Dyson",
    mpn: "447929-01",
    upcBody: "88560910834",
    category: "Home",
    basePriceCents: 74999,
    maxEventDiscount: 0.33,
    volatility: 0.01,
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "dyson-v15-detect-cordless-vacuum",
    watch: { targetPriceCents: 54999 },
  },
  {
    key: "breville-bambino",
    name: "Breville Bambino Plus Espresso Machine – Brushed Stainless Steel",
    brand: "Breville",
    mpn: "BES500BSS",
    upcBody: "02185636220",
    category: "Kitchen",
    basePriceCents: 49995,
    maxEventDiscount: 0.25,
    volatility: 0.012,
    retailers: ["amazon", "walmart", "target"],
    slug: "breville-bambino-plus-espresso-machine",
  },
  {
    key: "kitchenaid-artisan",
    name: "KitchenAid Artisan Series 5 Quart Tilt-Head Stand Mixer – Empire Red",
    brand: "KitchenAid",
    mpn: "KSM150PSER",
    upcBody: "88332810523",
    category: "Kitchen",
    basePriceCents: 44999,
    maxEventDiscount: 0.35,
    volatility: 0.015,
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "kitchenaid-artisan-5qt-stand-mixer-empire-red",
    watch: {},
  },
  {
    key: "kindle-paperwhite",
    name: "Amazon Kindle Paperwhite (16 GB) – Black",
    brand: "Amazon",
    mpn: "PW-16GB-BLK",
    upcBody: "84099113204",
    category: "E-readers",
    basePriceCents: 15999,
    maxEventDiscount: 0.3,
    volatility: 0.006,
    retailers: ["amazon", "target", "bestbuy"],
    slug: "kindle-paperwhite-16gb-black",
  },
  {
    key: "otterbox-defender",
    name: "OtterBox Defender Series Case for iPhone 16 Pro – Black",
    brand: "OtterBox",
    mpn: "77-95562",
    upcBody: "84099121045",
    category: "Accessories",
    basePriceCents: 6495,
    maxEventDiscount: 0.35,
    volatility: 0.03,
    retailers: ["amazon", "walmart", "target", "bestbuy"],
    slug: "otterbox-defender-iphone-16-pro-black",
  },
  {
    key: "allbirds-runner-10",
    name: "Allbirds Men's Wool Runner – Natural Black, Size 10",
    brand: "Allbirds",
    mpn: "WR-M-NBLK-10",
    upcBody: "81007123510",
    category: "Shoes",
    basePriceCents: 9800,
    maxEventDiscount: 0.25,
    volatility: 0.002,
    variantGroupKey: "allbirds-mens-wool-runner-natural-black",
    variantAttributes: { color: "Natural Black", size: "10" },
    retailers: ["shop:allbirds.com", "amazon"],
    slug: "mens-wool-runners-natural-black",
    watch: { targetPriceCents: 7500 },
  },
  {
    key: "allbirds-runner-11",
    name: "Allbirds Men's Wool Runner – Natural Black, Size 11",
    brand: "Allbirds",
    mpn: "WR-M-NBLK-11",
    upcBody: "81007123511",
    category: "Shoes",
    basePriceCents: 9800,
    maxEventDiscount: 0.25,
    volatility: 0.002,
    variantGroupKey: "allbirds-mens-wool-runner-natural-black",
    variantAttributes: { color: "Natural Black", size: "11" },
    retailers: ["shop:allbirds.com", "amazon"],
    slug: "mens-wool-runners-natural-black",
  },
];

export function productGtin(p: SeedProduct): string {
  return withCheckDigit(p.upcBody).padStart(14, "0");
}

/** Deterministic retailer-specific ID in each retailer's real-world format. */
export function retailerProductId(retailerSlug: string, rng: () => number): string {
  const digits = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      i === 0 ? 1 + Math.floor(rng() * 9) : Math.floor(rng() * 10),
    ).join("");
  switch (retailerSlug) {
    case "amazon": {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
      return (
        "B0" + Array.from({ length: 8 }, () => chars[Math.floor(rng() * chars.length)]).join("")
      );
    }
    case "walmart":
      return digits(9);
    case "target":
      return digits(8);
    case "bestbuy":
      return digits(7);
    default:
      return digits(14); // Shopify variant id
  }
}

export function listingUrl(retailerSlug: string, slug: string, id: string): string {
  switch (retailerSlug) {
    case "amazon":
      return `https://www.amazon.com/dp/${id}`;
    case "walmart":
      return `https://www.walmart.com/ip/${slug}/${id}`;
    case "target":
      return `https://www.target.com/p/${slug}/-/A-${id}`;
    case "bestbuy":
      return `https://www.bestbuy.com/site/${slug}/${id}.p?skuId=${id}`;
    default: {
      const domain = retailerSlug.replace(/^shop:/, "");
      return `https://www.${domain}/products/${slug}?variant=${id}`;
    }
  }
}
