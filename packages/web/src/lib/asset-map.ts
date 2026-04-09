/**
 * Shared asset-slug → oracle-index mapping.
 * Single source of truth for URL slugs, oracle indices, display names, and units.
 */

export type AssetCategory = "crypto" | "index" | "commodity";

export interface AssetInfo {
  name: string;
  displayName: string;
  index: number;
  pair: string;
  unit: string;
  category: AssetCategory;
  oracleUnit?: string;
}

export const ASSET_MAP: Record<string, AssetInfo> = {
  // Crypto — ERG first (home chain)
  erg:    { name: "ERG",     displayName: "Ergo",        index: 17, pair: "ERG/USD",   unit: "ERG",      category: "crypto" },
  // Crypto — Physical Delivery (Rosen Bridge)
  eth:    { name: "ETH",     displayName: "Ethereum",    index: 0,  pair: "ETH/USD",   unit: "rsETH",    category: "crypto" },
  btc:    { name: "BTC",     displayName: "Bitcoin",     index: 1,  pair: "BTC/USD",   unit: "rsBTC",    category: "crypto" },
  bnb:    { name: "BNB",     displayName: "BNB",         index: 2,  pair: "BNB/USD",   unit: "rsBNB",    category: "crypto" },
  doge:   { name: "DOGE",    displayName: "Dogecoin",    index: 3,  pair: "DOGE/USD",  unit: "rsDOGE",   category: "crypto" },
  ada:    { name: "ADA",     displayName: "Cardano",     index: 4,  pair: "ADA/USD",   unit: "rsADA",    category: "crypto" },
  // Crypto — Cash Settlement only
  hns:    { name: "HNS",     displayName: "Handshake",   index: 5,  pair: "HNS/USD",   unit: "HNS",      category: "crypto" },
  ckb:    { name: "CKB",     displayName: "Nervos",      index: 6,  pair: "CKB/USD",   unit: "CKB",      category: "crypto" },
  atom:   { name: "ATOM",    displayName: "Cosmos",      index: 7,  pair: "ATOM/USD",  unit: "ATOM",     category: "crypto" },
  ron:    { name: "RON",     displayName: "Ronin",       index: 8,  pair: "RON/USD",   unit: "RON",      category: "crypto" },
  firo:   { name: "FIRO",    displayName: "Firo",        index: 19, pair: "FIRO/USD",  unit: "FIRO",     category: "crypto" },
  // Commodities & Metals
  gold:   { name: "Gold",    displayName: "Gold",        index: 18, pair: "XAU/USD",   unit: "DexyGold", category: "commodity", oracleUnit: "Troy Oz" },
  silver: { name: "Silver",  displayName: "Silver",      index: 11, pair: "XAG/USD",   unit: "Silver",   category: "commodity" },
  copper: { name: "Copper",  displayName: "Copper",      index: 12, pair: "XCU/USD",   unit: "Copper",   category: "commodity" },
  brent:  { name: "Brent",   displayName: "Brent Oil",   index: 13, pair: "BRENT/USD", unit: "Brent",    category: "commodity" },
  wti:    { name: "WTI",     displayName: "WTI Oil",     index: 14, pair: "WTI/USD",   unit: "WTI",      category: "commodity" },
  natgas: { name: "NatGas",  displayName: "Natural Gas",  index: 15, pair: "NGAS/USD",  unit: "NatGas",   category: "commodity" },
  // Indices
  spx:    { name: "S&P 500", displayName: "S&P 500",     index: 9,  pair: "SPX",       unit: "S&P 500",  category: "index" },
  dji:    { name: "DJI",     displayName: "Dow Jones",    index: 10, pair: "DJI",       unit: "DJI",      category: "index" },
};

/** Look up asset info by oracle index */
export function assetByIndex(index: number): { slug: string; info: AssetInfo } | undefined {
  for (const [slug, info] of Object.entries(ASSET_MAP)) {
    if (info.index === index) return { slug, info };
  }
  return undefined;
}

/* ── Derived: dashboard categories ────────────────────────────── */

export interface CategoryGroup {
  name: string;
  subtitle: string;
  assets: { name: string; slug: string; index: number; badge: string | undefined }[];
}

/**
 * Assets grouped into display categories for the dashboard.
 * Crypto is split into two sub-groups (physical delivery vs cash settlement).
 */
export const ASSET_CATEGORIES: CategoryGroup[] = [
  {
    name: "Crypto",
    subtitle: "Physical Delivery via Rosen Bridge",
    assets: [
      { name: "ERG", slug: "erg", index: 17, badge: "Native" },
      { name: "ETH", slug: "eth", index: 0, badge: "rsETH" },
      { name: "BTC", slug: "btc", index: 1, badge: "rsBTC" },
      { name: "BNB", slug: "bnb", index: 2, badge: "rsBNB" },
      { name: "DOGE", slug: "doge", index: 3, badge: "rsDOGE" },
      { name: "ADA", slug: "ada", index: 4, badge: "rsADA" },
    ],
  },
  {
    name: "Crypto",
    subtitle: "Cash Settlement Only",
    assets: [
      { name: "HNS", slug: "hns", index: 5, badge: undefined },
      { name: "CKB", slug: "ckb", index: 6, badge: undefined },
      { name: "ATOM", slug: "atom", index: 7, badge: undefined },
      { name: "RON", slug: "ron", index: 8, badge: undefined },
      { name: "FIRO", slug: "firo", index: 19, badge: undefined },
    ],
  },
  {
    name: "Commodities & Metals",
    subtitle: "Cash Settlement",
    assets: [
      { name: "Gold", slug: "gold", index: 18, badge: "DexyGold" },
      { name: "Silver", slug: "silver", index: 11, badge: undefined },
      { name: "Copper", slug: "copper", index: 12, badge: undefined },
      { name: "Brent", slug: "brent", index: 13, badge: undefined },
      { name: "WTI", slug: "wti", index: 14, badge: undefined },
      { name: "NatGas", slug: "natgas", index: 15, badge: undefined },
    ],
  },
  {
    name: "Indices",
    subtitle: "Cash Settlement",
    assets: [
      { name: "S&P 500", slug: "spx", index: 9, badge: undefined },
      { name: "DJI", slug: "dji", index: 10, badge: undefined },
    ],
  },
];

/* ── Derived: assetName → slug lookup (for MarketFilters) ──── */

/**
 * Maps asset display names (and common oracle aliases) to URL slugs.
 * Used by MarketFilters to navigate from a reserve's assetName to the trade page.
 */
export const ASSET_SLUG: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [slug, info] of Object.entries(ASSET_MAP)) {
    map[info.name] = slug;
  }
  // Oracle-style aliases that differ from display names
  map["XAU"] = "gold";
  map["XAG"] = "silver";
  map["XCU"] = "copper";
  map["BRENT"] = "brent";
  map["NGAS"] = "natgas";
  map["LITHIUM"] = "natgas";
  map["SPX"] = "spx";
  return map;
})();
