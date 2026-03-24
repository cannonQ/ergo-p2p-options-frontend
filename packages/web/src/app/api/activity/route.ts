import { NextResponse } from "next/server";
import {
  OPTION_RESERVE_ERGOTREE,
  SELL_CONTRACT_USE_ERGOTREE,
  SELL_CONTRACT_SIGUSD_ERGOTREE,
  DAPP_FEE_ADDRESS,
} from "@ergo-options/core";
import { hexToBytes } from "@/lib/oracle-parser";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

interface ActivityItem {
  type: "BUY" | "WRITE" | "EXERCISE" | "SELL" | "CLOSE";
  timestamp: string;
  description: string;
  amount?: string;
  txId?: string;
}

const SELL_ERGOTREES = new Set([SELL_CONTRACT_USE_ERGOTREE, SELL_CONTRACT_SIGUSD_ERGOTREE]);

// Simple cache
let cache: { items: ActivityItem[]; ts: number } | null = null;
const CACHE_TTL = 15_000;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json({ items: cache.items });
    }

    // Get current height
    let currentHeight = 0;
    try {
      const infoRes = await fetch(`${NODE_URL}/info`, { cache: "no-store" });
      if (infoRes.ok) {
        const info = await infoRes.json();
        currentHeight = info.fullHeight ?? 0;
      }
    } catch { /* ignore */ }

    // Scan recent transactions at the fee address — every platform TX pays fees here
    const items: ActivityItem[] = [];

    try {
      const res = await fetch(
        `${NODE_URL}/blockchain/transaction/byAddress/${DAPP_FEE_ADDRESS}?offset=0&limit=20`,
        { cache: "no-store" },
      );

      if (res.ok) {
        const data = await res.json();
        const txs = data.items ?? data;

        for (const tx of txs) {
          const item = classifyTx(tx, currentHeight);
          if (item) items.push(item);
        }
      }
    } catch (err) {
      console.error("Activity scan error:", err);
    }

    // Also scan reserve contract boxes (spent + unspent) to catch exercise/close TXs
    // that don't go through the fee address
    try {
      const res = await fetch(
        `${NODE_URL}/blockchain/box/byErgoTree?offset=0&limit=20`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(OPTION_RESERVE_ERGOTREE),
          cache: "no-store",
        } as any,
      );

      if (res.ok) {
        const data = await res.json();
        const boxes = data.items ?? data;

        // Collect unique spending TX IDs (excluding those already found)
        const existingTxIds = new Set(items.map((i) => i.txId));
        const spentTxIds = new Set<string>();
        for (const box of boxes) {
          const stx = box.spentTransactionId;
          if (stx && !existingTxIds.has(stx) && !spentTxIds.has(stx)) {
            spentTxIds.add(stx);
          }
        }

        // Fetch each spending TX and classify
        for (const txId of spentTxIds) {
          try {
            const txRes = await fetch(`${NODE_URL}/blockchain/transaction/byId/${txId}`, { cache: "no-store" });
            if (txRes.ok) {
              const tx = await txRes.json();
              const item = classifyTx(tx, currentHeight);
              if (item) items.push(item);
            }
          } catch { /* skip */ }
        }

        // Also add unspent boxes as WRITE events (creation TXs)
        for (const box of boxes) {
          if (!box.spentTransactionId && box.transactionId && !existingTxIds.has(box.transactionId)) {
            const boxHeight = box.settlementHeight ?? box.creationHeight ?? currentHeight;
            const blocksAgo = currentHeight - boxHeight;
            const r4name = box.additionalRegisters?.R4 ? parseR4Name(box.additionalRegisters.R4) : "Option";
            items.push({
              type: "WRITE",
              timestamp: blocksToRelativeTime(blocksAgo),
              description: r4name,
              txId: box.transactionId,
            });
          }
        }
      }
    } catch (err) {
      console.error("Activity scan error (reserve boxes):", err);
    }

    // Deduplicate by txId
    const seen = new Set<string>();
    const deduped = items.filter((item) => {
      if (!item.txId || seen.has(item.txId)) return false;
      seen.add(item.txId);
      return true;
    });

    // Sort by timestamp (most recent first)
    deduped.sort((a, b) => {
      const parseMin = (t: string) => {
        const n = parseInt(t) || 0;
        if (t.includes("d")) return n * 1440;
        if (t.includes("h")) return n * 60;
        return n;
      };
      return parseMin(a.timestamp) - parseMin(b.timestamp);
    });

    const result = deduped.slice(0, 20);
    cache = { items: result, ts: Date.now() };
    return NextResponse.json({ items: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  }
}

function blocksToRelativeTime(blocks: number): string {
  if (blocks < 0) blocks = 0;
  const mins = blocks * 2;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Parse R4 Coll[Byte] to UTF-8 string for option name */
function parseR4Name(r4hex: string): string {
  try {
    const bytes = hexToBytes(r4hex);
    if (bytes[0] !== 0x0e) return "Option";
    let offset = 1;
    let len = 0;
    let shift = 0;
    while (offset < bytes.length) {
      const b = bytes[offset++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return new TextDecoder().decode(bytes.slice(offset, offset + len)) || "Option";
  } catch {
    return "Option";
  }
}

function classifyTx(tx: any, currentHeight: number): ActivityItem | null {
  if (!tx?.outputs || !tx?.inputs) return null;

  const txHeight = tx.inclusionHeight ?? currentHeight;
  const blocksAgo = currentHeight - txHeight;
  const timestamp = blocksToRelativeTime(blocksAgo);

  const inputTrees = new Set<string>((tx.inputs || []).map((i: any) => i.ergoTree as string));
  const outputTrees = new Set<string>((tx.outputs || []).map((o: any) => o.ergoTree as string));

  const hasReserveInput = inputTrees.has(OPTION_RESERVE_ERGOTREE);
  const hasReserveOutput = outputTrees.has(OPTION_RESERVE_ERGOTREE);
  const hasSellInput = [...inputTrees].some((t) => SELL_ERGOTREES.has(t));
  const hasSellOutput = [...outputTrees].some((t) => SELL_ERGOTREES.has(t));

  // Get option name from reserve box R4 if available
  let optionName = "";
  const reserveBox = tx.outputs.find((o: any) => o.ergoTree === OPTION_RESERVE_ERGOTREE)
    ?? tx.inputs.find((i: any) => i.ergoTree === OPTION_RESERVE_ERGOTREE);
  if (reserveBox?.additionalRegisters?.R4) {
    optionName = parseR4Name(reserveBox.additionalRegisters.R4);
  }

  // BUY: sell contract input consumed → buyer purchased option tokens
  if (hasSellInput && !hasReserveInput) {
    const sellInput = tx.inputs.find((i: any) => SELL_ERGOTREES.has(i.ergoTree));
    const sellOutput = tx.outputs.find((o: any) => SELL_ERGOTREES.has(o.ergoTree));
    const inputQty = Number(sellInput?.assets?.[0]?.amount ?? 0);
    const outputQty = Number(sellOutput?.assets?.[0]?.amount ?? 0);
    const bought = inputQty - outputQty;

    return {
      type: "BUY",
      timestamp,
      description: `${bought > 0 ? bought : "?"} token${bought !== 1 ? "s" : ""}${optionName ? ` — ${optionName}` : ""}`,
      txId: tx.id,
    };
  }

  // SELL (list): creates sell box, no sell inputs
  if (hasSellOutput && !hasSellInput) {
    const sellBox = tx.outputs.find((o: any) => SELL_ERGOTREES.has(o.ergoTree));
    const qty = sellBox?.assets?.[0]?.amount ?? "?";
    return {
      type: "SELL",
      timestamp,
      description: `Listed ${qty} tokens`,
      txId: tx.id,
    };
  }

  // Reserve-related transactions
  if (hasReserveInput && hasReserveOutput) {
    const resIn = tx.inputs.find((i: any) => i.ergoTree === OPTION_RESERVE_ERGOTREE);
    const resOut = tx.outputs.find((o: any) => o.ergoTree === OPTION_RESERVE_ERGOTREE);
    const inTokenQty = Number(resIn?.assets?.[0]?.amount ?? 0);
    const outTokenQty = Number(resOut?.assets?.[0]?.amount ?? 0);

    // MINT: no tokens in → many tokens out
    if (inTokenQty === 0 && outTokenQty > 1) {
      return {
        type: "WRITE",
        timestamp,
        description: `Minted${optionName ? `: ${optionName}` : ""}`,
        txId: tx.id,
      };
    }

    // DELIVER: many tokens → singleton (1)
    if (inTokenQty > 1 && outTokenQty === 1) {
      return {
        type: "WRITE",
        timestamp,
        description: `Delivered${optionName ? `: ${optionName}` : ""}`,
        txId: tx.id,
      };
    }

    // EXERCISE: value decreases significantly
    const valIn = BigInt(resIn?.value ?? 0);
    const valOut = BigInt(resOut?.value ?? 0);
    if (valIn > valOut + 10_000_000n) {
      return {
        type: "EXERCISE",
        timestamp,
        description: optionName || "Exercise",
        txId: tx.id,
      };
    }
  }

  // WRITE (create definition): reserve output, no reserve input
  if (hasReserveOutput && !hasReserveInput) {
    return {
      type: "WRITE",
      timestamp,
      description: optionName || "New option",
      txId: tx.id,
    };
  }

  // CLOSE: reserve input consumed, no reserve output
  if (hasReserveInput && !hasReserveOutput) {
    return {
      type: "CLOSE",
      timestamp,
      description: optionName || "Closed",
      txId: tx.id,
    };
  }

  return null;
}
