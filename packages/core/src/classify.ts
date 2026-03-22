import { BoxState } from './types.js';
import { bytesToHex } from './config.js';
import type { OptionParams } from './types.js';

interface RawBox {
  boxId: string;
  creationHeight: number;
  additionalRegisters: Record<string, string>;
  assets: { tokenId: string; amount: bigint }[];
}

/**
 * Classify an on-chain box at a known contract address into a lifecycle state.
 *
 * @param box       Raw box data from the node API
 * @param currentHeight Current blockchain height
 * @param exerciseWindow Exercise window (from contract config, default 720)
 */
export function classifyBox(
  box: {
    assets: { tokenId: string; amount: bigint }[];
    creationBoxId?: string;  // R7 parsed
    maturityDate?: bigint;   // R8[3] parsed
  },
  currentHeight: number,
  exerciseWindow: number = 720,
): BoxState {
  const hasToken = box.assets.length > 0;
  const tokenId = hasToken ? box.assets[0].tokenId : '';
  const tokenQty = hasToken ? box.assets[0].amount : 0n;

  // R7 = creation box ID. If tokens[0] ID matches R7, it's been minted.
  const isMinted = hasToken && box.creationBoxId !== undefined && tokenId === box.creationBoxId;

  if (!isMinted) {
    return BoxState.DEFINITION;
  }

  if (tokenQty > 1n) {
    return BoxState.MINTED_UNDELIVERED;
  }

  // tokenQty === 1n (singleton) — check expiry
  if (box.maturityDate !== undefined) {
    const expiry = Number(box.maturityDate) + exerciseWindow;
    if (currentHeight > expiry) {
      return BoxState.EXPIRED;
    }
  }

  return BoxState.RESERVE;
}
