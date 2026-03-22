/**
 * Safe box selection — port of Config.safeLoadBoxes() from Scala.
 *
 * Selects wallet UTXOs to cover ERG + token requirements while:
 * 1. Excluding protected tokens (oracle pool tokens)
 * 2. Excluding boxes with specific tokens (option tokens during exercise)
 * 3. Preferring smallest sufficient boxes to minimize UTXO fragmentation
 *
 * This is SAFETY-CRITICAL for exercise flows — selecting a box that also
 * contains option tokens would inflate the contract's token count and
 * break payout calculations.
 */
import { PROTECTED_TOKENS } from './config.js';
import type { Amount } from '@fleet-sdk/core';

interface SimpleBox {
  boxId: string;
  value: bigint;
  assets: { tokenId: string; amount: bigint }[];
}

/**
 * Check if a box contains any protected tokens.
 */
export function isProtected(box: SimpleBox): boolean {
  return box.assets.some(a => PROTECTED_TOKENS.has(a.tokenId));
}

/**
 * Check if a box contains any of the excluded tokens.
 */
function hasExcludedToken(box: SimpleBox, excludeTokenIds: Set<string>): boolean {
  return box.assets.some(a => excludeTokenIds.has(a.tokenId));
}

export interface BoxSelectionResult {
  selected: SimpleBox[];
  ergTotal: bigint;
  tokenTotals: Map<string, bigint>;
}

/**
 * Select boxes to cover ERG + token requirements.
 *
 * @param allBoxes       All wallet UTXOs
 * @param ergNeeded      Minimum ERG needed (nanoERG)
 * @param tokensNeeded   Map of tokenId → amount needed
 * @param excludeTokenIds Token IDs to avoid (boxes containing these are skipped for ERG)
 * @returns Selected boxes, or throws if requirements can't be met
 */
export function selectBoxes(
  allBoxes: SimpleBox[],
  ergNeeded: bigint,
  tokensNeeded: Map<string, bigint> = new Map(),
  excludeTokenIds: Set<string> = new Set(),
): BoxSelectionResult {
  // Filter out protected boxes
  const safeBoxes = allBoxes.filter(b => !isProtected(b));

  const selected: SimpleBox[] = [];
  const usedIds = new Set<string>();
  const tokenHave = new Map<string, bigint>();
  let ergHave = 0n;

  // Phase 1: Add boxes that contain required tokens (smallest sufficient first)
  for (const [tokenId, needed] of tokensNeeded) {
    const have = tokenHave.get(tokenId) ?? 0n;
    if (have >= needed) continue;

    // Find best box with this token
    let bestIdx = -1;
    let bestQty = BigInt('9223372036854775807'); // Long.MaxValue

    for (let j = 0; j < safeBoxes.length; j++) {
      const box = safeBoxes[j];
      if (usedIds.has(box.boxId)) continue;

      for (const asset of box.assets) {
        if (asset.tokenId === tokenId) {
          const qty = asset.amount;
          const remaining = needed - have;
          if (qty >= remaining && qty < bestQty) {
            bestIdx = j;
            bestQty = qty;
          }
        }
      }
    }

    // Fallback: any box with the token
    if (bestIdx === -1) {
      for (let j = 0; j < safeBoxes.length; j++) {
        if (usedIds.has(safeBoxes[j].boxId)) continue;
        if (safeBoxes[j].assets.some(a => a.tokenId === tokenId)) {
          bestIdx = j;
          break;
        }
      }
    }

    if (bestIdx >= 0) {
      const box = safeBoxes[bestIdx];
      selected.push(box);
      usedIds.add(box.boxId);
      ergHave += box.value;
      for (const asset of box.assets) {
        tokenHave.set(
          asset.tokenId,
          (tokenHave.get(asset.tokenId) ?? 0n) + asset.amount,
        );
      }
    }
  }

  // Build set of all requested token IDs (to avoid inflating counts)
  const requestedTokenIds = new Set(tokensNeeded.keys());

  // Phase 2: Add boxes for ERG — exclude boxes with requested or excluded tokens
  if (ergHave < ergNeeded) {
    for (const box of safeBoxes) {
      if (ergHave >= ergNeeded) break;
      if (usedIds.has(box.boxId)) continue;

      const hasRequested = box.assets.some(a => requestedTokenIds.has(a.tokenId));
      const hasExcluded = hasExcludedToken(box, excludeTokenIds);

      if (!hasRequested && !hasExcluded) {
        selected.push(box);
        usedIds.add(box.boxId);
        ergHave += box.value;
      }
    }
  }

  // Validate
  if (ergHave < ergNeeded) {
    throw new Error(
      `Not enough ERG in safe boxes: have ${Number(ergHave) / 1e9} ERG, ` +
      `need ${Number(ergNeeded) / 1e9} ERG (protected/excluded boxes filtered)`
    );
  }

  for (const [tokenId, needed] of tokensNeeded) {
    const have = tokenHave.get(tokenId) ?? 0n;
    if (have < needed) {
      throw new Error(
        `Not enough token ${tokenId.slice(0, 16)}...: have ${have}, need ${needed}`
      );
    }
  }

  return { selected, ergTotal: ergHave, tokenTotals: tokenHave };
}
