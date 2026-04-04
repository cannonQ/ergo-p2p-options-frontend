/**
 * Scanner — fetches boxes at contract addresses and classifies them.
 */
import { classifyBox, BoxState } from '@ergo-options/core';
import { config } from './config.js';
import { parseCollByte, parseCollLong } from './sigma.js';

interface NodeBox {
  boxId: string;
  transactionId: string;
  index: number;
  ergoTree: string;
  value: number;
  creationHeight: number;
  assets: { tokenId: string; amount: number }[];
  additionalRegisters: Record<string, string>;
}

export interface ClassifiedBox {
  boxId: string;
  state: BoxState;
  contractAddr: string;
  creationHeight: number;
  raw: NodeBox;
}

/**
 * Fetch all unspent boxes by ErgoTree hex.
 * Uses POST /blockchain/box/unspent/byErgoTree (handles long P2S scripts).
 */
async function fetchBoxesByErgoTree(ergoTree: string): Promise<NodeBox[]> {
  const res = await fetch(
    `${config.nodeUrl}/blockchain/box/unspent/byErgoTree?offset=0&limit=200`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ergoTree),
    },
  );
  if (!res.ok) {
    throw new Error(`Node error ${res.status} fetching boxes by ErgoTree ${ergoTree.slice(0, 16)}...`);
  }
  const data = await res.json();
  // Response may be { items: [...], total: N } or just an array
  return data.items ?? data;
}

/**
 * Parse R7 (creation box ID) and R8[3] (maturityDate) from node register format.
 * Registers come as hex-encoded sigma serialization.
 *
 * R7 = Coll[Byte] (0x0e prefix) — 32-byte creation box ID
 * R8 = Coll[Long] (0x11 prefix) — option params, index 3 = maturityDate
 */
function parseBoxForClassification(box: NodeBox): {
  creationBoxId?: string;
  maturityDate?: bigint;
} {
  const result: { creationBoxId?: string; maturityDate?: bigint } = {};

  // Parse R7 — Coll[Byte] containing the 32-byte creation box ID
  const r7hex = box.additionalRegisters.R7;
  if (r7hex) {
    const parsed = parseCollByte(r7hex);
    if (parsed && parsed.length === 64) {
      // 32 bytes = 64 hex chars
      result.creationBoxId = parsed;
    }
  }

  // Parse R8 — Coll[Long] containing option params
  const r8hex = box.additionalRegisters.R8;
  if (r8hex) {
    const params = parseCollLong(r8hex);
    if (params && params.length > 3) {
      result.maturityDate = params[3]; // R8[3] = maturityDate (block height)
    }
  }

  return result;
}

/**
 * Scan all contract addresses and classify boxes.
 */
export async function scanAll(currentHeight: number): Promise<ClassifiedBox[]> {
  const results: ClassifiedBox[] = [];

  for (let i = 0; i < config.contractErgoTrees.length; i++) {
    const ergoTree = config.contractErgoTrees[i];
    const exerciseWindow = config.exerciseWindows[i] ?? 720;

    try {
      const boxes = await fetchBoxesByErgoTree(ergoTree);

      for (const box of boxes) {
        // Skip boxes without R8 — these are not option reserve boxes
        // (e.g. FixedPriceSell or BuyTokenRequest boxes that share an ErgoTree prefix)
        if (!box.additionalRegisters.R8) continue;

        const assets = box.assets.map(a => ({
          tokenId: a.tokenId,
          amount: BigInt(a.amount),
        }));

        const parsed = parseBoxForClassification(box);

        const state = classifyBox(
          { assets, ...parsed },
          currentHeight,
          exerciseWindow,
        );

        results.push({
          boxId: box.boxId,
          state,
          contractAddr: ergoTree,
          creationHeight: box.creationHeight,
          raw: box,
        });
      }
    } catch (err) {
      console.error(`[SCAN] Error scanning ${ergoTree.slice(0, 16)}...:`, err);
    }
  }

  return results;
}
