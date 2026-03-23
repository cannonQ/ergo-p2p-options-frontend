import { NextResponse } from "next/server";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

// Contract addresses to monitor for activity
// Will be populated when production contracts are deployed
const MONITORED_ADDRESSES: string[] = [];

interface ActivityItem {
  type: "BUY" | "WRITE" | "EXERCISE" | "SELL" | "CLOSE";
  timestamp: string;
  description: string;
  amount?: string;
  txId?: string;
}

// Simple cache
let cache: { items: ActivityItem[]; ts: number } | null = null;
const CACHE_TTL = 15_000; // 15 seconds

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json({ items: cache.items });
    }

    // When contract addresses are configured, scan recent transactions
    // For now, return empty
    if (MONITORED_ADDRESSES.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items: ActivityItem[] = [];

    // Scan recent transactions at each contract address
    for (const addr of MONITORED_ADDRESSES) {
      try {
        const res = await fetch(
          `${NODE_URL}/blockchain/transaction/byAddress/${addr}?offset=0&limit=10`,
        );
        if (!res.ok) continue;
        const txs = await res.json();

        for (const tx of txs.items ?? txs ?? []) {
          const item = classifyTransaction(tx, addr);
          if (item) items.push(item);
        }
      } catch {
        // Skip failed addresses
      }
    }

    // Sort by recency and limit
    items.sort((a, b) => {
      // Parse relative times for sorting (approximate)
      const parseTime = (t: string) => {
        const n = parseInt(t);
        if (t.includes("h")) return n * 60;
        if (t.includes("d")) return n * 1440;
        return n; // minutes
      };
      return parseTime(a.timestamp) - parseTime(b.timestamp);
    });

    const result = items.slice(0, 20);
    cache = { items: result, ts: Date.now() };
    return NextResponse.json({ items: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  }
}

/**
 * Classify a transaction as WRITE, BUY, EXERCISE, or CLOSE based on its structure.
 * This is a heuristic — checks output patterns against known contract behaviors.
 */
function classifyTransaction(tx: any, _contractAddr: string): ActivityItem | null {
  if (!tx || !tx.outputs || tx.outputs.length === 0) return null;

  // TODO: Implement transaction classification when contract addresses are live
  // Heuristics:
  //   WRITE: creates a new box at contract address with option tokens
  //   BUY: spends a sell order box, buyer receives option tokens
  //   EXERCISE: spends a reserve box, exerciser receives collateral
  //   CLOSE: spends an expired reserve, burns singleton token

  return null;
}
