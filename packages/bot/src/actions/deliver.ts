/**
 * Delivery action — builds and submits a deliver-option TX
 * for MINTED_UNDELIVERED reserve boxes.
 *
 * V5: Two modes based on R8[11] (autoList flag):
 *   autoList=0: Deliver to writer's wallet (V4 behavior)
 *   autoList=1: Deliver to FixedPriceSell contract (V5 auto-list)
 *
 * This is a permissionless operation: the bot's wallet just pays the miner fee.
 * In both modes, only the writer (from R9[0]) can control the tokens.
 */
import { buildDeliverOptionTx } from '@ergo-options/core';
import {
  SELL_CONTRACT_USE_ERGOTREE,
  SELL_CONTRACT_SIGUSD_ERGOTREE,
  MINER_FEE,
} from '@ergo-options/core';
import { signAndSubmitTx, getChangeErgoTree } from '../signer.js';
import { parseCollCollByte, parseCollLong } from '../sigma.js';
import type { ClassifiedBox } from '../scanner.js';

/**
 * Convert a node API box to Fleet SDK Box<Amount> format.
 * Fleet SDK expects string amounts and all required fields.
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
 * Execute delivery for a MINTED_UNDELIVERED box.
 * Reads R8[11] to determine delivery mode (wallet or sell order).
 *
 * @param box Classified box from the scanner
 * @param currentHeight Current blockchain height
 * @returns TX ID on success, or null if the action should be skipped
 * @throws On unrecoverable errors (signing failure, etc.)
 */
export async function executeDelivery(
  box: ClassifiedBox,
  currentHeight: number,
): Promise<string | null> {
  const raw = box.raw;

  // Parse R9 to get issuer EC point + dApp fee tree
  const r9hex = raw.additionalRegisters.R9;
  if (!r9hex) {
    console.warn(`[DELIVER] Box ${box.boxId.slice(0, 16)}... missing R9 register, skipping`);
    return null;
  }

  const r9parts = parseCollCollByte(r9hex);
  if (!r9parts || r9parts.length < 2) {
    console.warn(`[DELIVER] Box ${box.boxId.slice(0, 16)}... failed to parse R9, skipping`);
    return null;
  }

  const issuerECPoint = r9parts[0];
  if (issuerECPoint.length !== 33) {
    console.warn(
      `[DELIVER] Box ${box.boxId.slice(0, 16)}... R9[0] is ${issuerECPoint.length} bytes, expected 33, skipping`,
    );
    return null;
  }

  const dAppUIFeeTree = r9parts[1];

  // Parse R8 for auto-list params
  const r8hex = raw.additionalRegisters.R8;
  const r8params = r8hex ? parseCollLong(r8hex) : undefined;
  const autoList = r8params && r8params.length > 11 ? Number(r8params[11]) : 0;
  const premiumRaw = r8params && r8params.length > 12 ? r8params[12] : 0n;
  const stablecoinDecimal = r8params && r8params.length > 10 ? Number(r8params[10]) : 1000;

  // Get the bot's change ErgoTree (for miner fee change output)
  const changeErgoTree = await getChangeErgoTree();

  // Convert node box to Fleet SDK format
  const fleetBox = nodeBoxToFleet(raw);

  // Preserve all registers from the reserve box
  const registers: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw.additionalRegisters)) {
    if (val) registers[key] = val;
  }

  if (autoList === 1 && premiumRaw > 0n) {
    // MODE B: V5 auto-list — deliver to sell order
    const sellContractErgoTree = stablecoinDecimal === 100
      ? SELL_CONTRACT_SIGUSD_ERGOTREE
      : SELL_CONTRACT_USE_ERGOTREE;

    // Build seller SigmaProp: 08cd + 33-byte EC point hex
    const ecHex = Array.from(issuerECPoint).map(b => b.toString(16).padStart(2, '0')).join('');
    const sellerSigmaPropHex = '08cd' + ecHex;

    const ts = new Date().toLocaleString();
    console.log(`[DELIVER] ${ts} Auto-list mode: premium=${premiumRaw} stablecoin=${stablecoinDecimal === 100 ? 'SigUSD' : 'USE'}`);

    const unsignedTx = buildDeliverOptionTx(
      {
        reserveBox: fleetBox,
        issuerECPoint,
        registers,
        changeErgoTree,
        autoList: true,
        premiumRaw,
        sellContractErgoTree,
        sellerSigmaPropHex,
        dAppUIFeePer1000: 10n,
        dAppUIFeeTree,
      },
      currentHeight,
    );

    const eip12 = unsignedTx.toEIP12Object();

    try {
      const txId = await signAndSubmitTx(eip12);
      console.log(`[DELIVER] ${ts} Auto-listed TX ${txId} for box ${box.boxId.slice(0, 16)}...`);
      return txId;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('already spent') || msg.includes('double spending')) {
        console.log(`[DELIVER] Box ${box.boxId.slice(0, 16)}... already spent`);
        return null;
      }
      throw err;
    }
  } else {
    // MODE A: V4 compatible — deliver to wallet
    const unsignedTx = buildDeliverOptionTx(
      {
        reserveBox: fleetBox,
        issuerECPoint,
        registers,
        changeErgoTree,
      },
      currentHeight,
    );

    const eip12 = unsignedTx.toEIP12Object();

    try {
      const txId = await signAndSubmitTx(eip12);
      const ts = new Date().toLocaleString();
      console.log(`[DELIVER] ${ts} Submitted TX ${txId} for box ${box.boxId.slice(0, 16)}...`);
      return txId;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('already spent') || msg.includes('double spending')) {
        console.log(`[DELIVER] Box ${box.boxId.slice(0, 16)}... already spent`);
        return null;
      }
      throw err;
    }
  }
}
