/**
 * Close-expired action — builds and submits a close-expired TX
 * for reserves past their exercise window.
 *
 * This is a permissionless operation: the bot's wallet just pays the miner fee.
 * Collateral returns to the writer (issuer address from R9[0]).
 * The singleton option token is burned.
 */
import { buildCloseExpiredTx } from '@ergo-options/core';
import { signAndSubmitTx, getChangeErgoTree } from '../signer.js';
import { parseCollCollByte } from '../sigma.js';
import type { ClassifiedBox } from '../scanner.js';

/**
 * Convert a node API box to Fleet SDK Box<Amount> format.
 */
function nodeBoxToFleet(raw: ClassifiedBox['raw']): any {
  return {
    boxId: raw.boxId,
    transactionId: raw.transactionId,
    index: raw.index,
    ergoTree: raw.ergoTree,
    creationHeight: raw.creationHeight,
    value: raw.value.toString(),
    assets: (raw.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: raw.additionalRegisters || {},
  };
}

/**
 * Execute a close-expired TX for an expired reserve box.
 *
 * @param box Classified box from the scanner
 * @param currentHeight Current blockchain height
 * @returns TX ID on success, or null if the action should be skipped
 * @throws On unrecoverable errors (signing failure, etc.)
 */
export async function executeClose(
  box: ClassifiedBox,
  currentHeight: number,
): Promise<string | null> {
  const raw = box.raw;

  // Parse R9 to get issuer EC point
  const r9hex = raw.additionalRegisters.R9;
  if (!r9hex) {
    console.warn(`[CLOSE] Box ${box.boxId.slice(0, 16)}... missing R9 register, skipping`);
    return null;
  }

  const r9parts = parseCollCollByte(r9hex);
  if (!r9parts || r9parts.length < 1) {
    console.warn(`[CLOSE] Box ${box.boxId.slice(0, 16)}... failed to parse R9, skipping`);
    return null;
  }

  const issuerECPoint = r9parts[0];
  if (issuerECPoint.length !== 33) {
    console.warn(
      `[CLOSE] Box ${box.boxId.slice(0, 16)}... R9[0] is ${issuerECPoint.length} bytes, expected 33, skipping`,
    );
    return null;
  }

  // Get the bot's change ErgoTree
  const changeErgoTree = await getChangeErgoTree();

  // Convert node box to Fleet SDK format
  const fleetBox = nodeBoxToFleet(raw);

  // Build the unsigned close-expired TX
  const unsignedTx = buildCloseExpiredTx(
    {
      reserveBox: fleetBox,
      issuerECPoint,
      changeErgoTree,
    },
    currentHeight,
  );

  // Convert to EIP-12 format for node signing
  const eip12 = unsignedTx.toEIP12Object();

  try {
    const txId = await signAndSubmitTx(eip12);
    console.log(`[CLOSE] Submitted TX ${txId} for box ${box.boxId.slice(0, 16)}...`);
    return txId;
  } catch (err: any) {
    const msg = err?.message || String(err);

    // "Input already spent" means someone else closed it — not an error
    if (msg.includes('already spent') || msg.includes('double spending')) {
      console.log(`[CLOSE] Box ${box.boxId.slice(0, 16)}... already spent (closed by another party)`);
      return null;
    }

    throw err;
  }
}
