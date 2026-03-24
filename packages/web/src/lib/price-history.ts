/**
 * Fetch price history from the AVL Oracle Pool Supabase.
 * Uses the oracle_events table (medians JSON per epoch).
 *
 * Provides sparkline data (last ~36 epochs) and 24h change for asset cards.
 */
import { supabase } from "./supabase";

const PRICE_SCALE = 1_000_000;

// Map our oracle feed index → Supabase median ticker key
// The medians JSON uses keys like "ETH_USD", "BTC_USD", etc.
// ERG and XAU use "Reserved_17" and "Reserved_18" in the medians
// Primary ticker key in medians JSON, plus fallback aliases
// The daemon uses "Reserved_N" for feeds added after the initial set (indices 17+)
const INDEX_TO_TICKERS: Record<number, string[]> = {
  0: ["ETH_USD"],
  1: ["BTC_USD"],
  2: ["BNB_USD"],
  3: ["DOGE_USD"],
  4: ["ADA_USD"],
  5: ["HNS_USD"],
  6: ["CKB_USD"],
  7: ["ATOM_USD"],
  8: ["RON_USD"],
  9: ["SPX"],
  10: ["DJI"],
  11: ["XAG_USD"],
  12: ["XCU_USD"],
  13: ["BRENT_USD"],
  14: ["WTI_USD"],
  15: ["NGAS_USD"],
  16: ["LITHIUM_USD"],
  17: ["Reserved_17", "RESERVED_17", "ERG_USD"],
  18: ["Reserved_18", "RESERVED_18", "XAU_USD"],
  19: ["Reserved_19", "RESERVED_19", "FIRO_USD"],
};

export interface PriceHistoryPoint {
  price: number;   // USD
  epoch: number;
  timestamp: string;
}

export interface AssetPriceData {
  sparkline: number[];    // last N prices for sparkline SVG
  change24h: number;      // percentage change over ~24h
  currentPrice: number;   // latest price
}

// Cache with 60s TTL
let cache: { data: Map<number, AssetPriceData>; ts: number } | null = null;
const CACHE_TTL = 60_000;

/**
 * Fetch recent oracle refresh events to get price history for all feeds.
 * Returns sparkline data + 24h change for each oracle feed index.
 */
export async function fetchAllAssetPriceData(): Promise<Map<number, AssetPriceData>> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data;
  }

  const result = new Map<number, AssetPriceData>();

  try {
    // Fetch last ~200 refresh events (covers ~24h at 6-block epochs, ~12min each)
    const { data: events, error } = await supabase
      .from("oracle_events")
      .select("epoch, medians, created_at")
      .eq("event_type", "refresh")
      .order("epoch", { ascending: false })
      .limit(200);

    if (error || !events || events.length === 0) {
      return result;
    }

    // For each feed index, extract price history
    for (const [indexStr, tickerAliases] of Object.entries(INDEX_TO_TICKERS)) {
      const index = Number(indexStr);
      const prices: PriceHistoryPoint[] = [];

      for (const event of events) {
        const medians = event.medians as Record<string, number> | null;
        if (!medians) continue;

        // Try each alias until we find a match
        let rawPrice: number | undefined;
        for (const ticker of tickerAliases) {
          if (medians[ticker] !== undefined && medians[ticker] > 0) {
            rawPrice = medians[ticker];
            break;
          }
        }
        if (rawPrice === undefined || rawPrice <= 0) continue;

        prices.push({
          price: rawPrice / PRICE_SCALE,
          epoch: event.epoch,
          timestamp: event.created_at,
        });
      }

      if (prices.length < 2) continue;

      // Prices are newest-first from the query
      const currentPrice = prices[0].price;

      // Find 24h-ago price (~120 epochs back at 12min/epoch)
      const now = new Date(prices[0].timestamp).getTime();
      const target24h = now - 24 * 60 * 60 * 1000;
      let price24hAgo = prices[prices.length - 1].price; // fallback to oldest

      for (const p of prices) {
        const t = new Date(p.timestamp).getTime();
        if (t <= target24h) {
          price24hAgo = p.price;
          break;
        }
      }

      const change24h = price24hAgo > 0
        ? ((currentPrice - price24hAgo) / price24hAgo) * 100
        : 0;

      // Sparkline: all 24h of data points, reversed to chronological order
      // ~120 epochs at 12min each = 24h. Downsample to ~48 points for smooth rendering.
      const allPrices = prices.map(p => p.price).reverse();
      const step = Math.max(1, Math.floor(allPrices.length / 48));
      const sparkline = allPrices.filter((_, i) => i % step === 0);

      result.set(index, {
        sparkline,
        change24h,
        currentPrice,
      });
    }
  } catch (err) {
    console.error("Failed to fetch price history from Supabase:", err);
  }

  cache = { data: result, ts: Date.now() };
  return result;
}

/**
 * Fetch price data for a single oracle feed index.
 */
export async function fetchAssetPriceData(index: number): Promise<AssetPriceData | undefined> {
  const all = await fetchAllAssetPriceData();
  return all.get(index);
}
