/**
 * Scanner — fetches boxes at contract addresses and classifies them.
 */
import { classifyBox, BoxState } from '@ergo-options/core';
import { config } from './config.js';

interface NodeBox {
  boxId: string;
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
 * Fetch all unspent boxes at a contract address.
 */
async function fetchBoxes(address: string): Promise<NodeBox[]> {
  const res = await fetch(
    `${config.nodeUrl}/blockchain/box/unspent/byAddress/${address}?offset=0&limit=200`,
  );
  if (!res.ok) {
    throw new Error(`Node error ${res.status} fetching boxes for ${address.slice(0, 16)}...`);
  }
  return res.json();
}

/**
 * Parse R7 (creation box ID) and R8[3] (maturityDate) from node register format.
 * Registers come as hex-encoded sigma serialization.
 * For a basic implementation, we extract key fields.
 */
function parseBoxForClassification(box: NodeBox): {
  creationBoxId?: string;
  maturityDate?: bigint;
} {
  // R7 is at register index 3 (R4=0, R5=1, R6=2, R7=3)
  // For now, return undefined — full parsing requires Fleet SDK deserializer
  // The bot will use a simplified heuristic: token count > 1 means undelivered
  return {};
}

/**
 * Scan all contract addresses and classify boxes.
 */
export async function scanAll(currentHeight: number): Promise<ClassifiedBox[]> {
  const results: ClassifiedBox[] = [];

  for (let i = 0; i < config.contractAddresses.length; i++) {
    const addr = config.contractAddresses[i];
    const exerciseWindow = config.exerciseWindows[i] ?? 720;

    try {
      const boxes = await fetchBoxes(addr);

      for (const box of boxes) {
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
          contractAddr: addr,
          creationHeight: box.creationHeight,
          raw: box,
        });
      }
    } catch (err) {
      console.error(`[SCAN] Error scanning ${addr.slice(0, 16)}...:`, err);
    }
  }

  return results;
}
