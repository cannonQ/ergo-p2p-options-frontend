/**
 * Server-side scanner for sell order boxes at the FixedPriceSell contract addresses.
 * Parses R4 (sellerPK), R5 (pricing params), R6 (fee tree) from on-chain UTXOs.
 */
import { NODE_URL, hexToBytes, parseCollLong } from "./oracle-parser";
import {
  SELL_CONTRACT_USE_ERGOTREE,
  SELL_CONTRACT_SIGUSD_ERGOTREE,
  USE_TOKEN_ID,
  SIGUSD_TOKEN_ID,
} from "@ergo-options/core";

export interface ParsedSellOrder {
  boxId: string;
  optionTokenId: string;
  tokenAmount: string;          // stringified bigint for JSON safety
  premiumPerToken: string;      // stringified bigint
  dAppUIFeePer1000: string;     // stringified bigint
  txFee: string;                // stringified bigint
  sellerPropBytes: string;      // R4 hex
  dAppUIFeeTree: string;        // R6 hex
  paymentTokenId: string;       // USE or SigUSD token ID
  ergoTree: string;             // the sell contract ErgoTree
  value: string;                // nanoERG
  registers: Record<string, string>; // full register map for TX builder
}

const SELL_CONTRACTS = [
  { ergoTree: SELL_CONTRACT_USE_ERGOTREE, paymentTokenId: USE_TOKEN_ID },
  { ergoTree: SELL_CONTRACT_SIGUSD_ERGOTREE, paymentTokenId: SIGUSD_TOKEN_ID },
];

/**
 * Scan both FixedPriceSell contracts for unspent sell order boxes.
 */
export async function scanSellOrders(): Promise<ParsedSellOrder[]> {
  const orders: ParsedSellOrder[] = [];

  for (const contract of SELL_CONTRACTS) {
    try {
      const res = await fetch(
        `${NODE_URL}/blockchain/box/unspent/byErgoTree?offset=0&limit=100`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contract.ergoTree),
          cache: "no-store",
        } as any,
      );
      if (!res.ok) continue;

      const rawData = await res.json();
      const boxes = rawData.items ?? rawData;

      for (const box of boxes) {
        const parsed = parseSellOrderBox(box, contract.ergoTree, contract.paymentTokenId);
        if (parsed) orders.push(parsed);
      }
    } catch (err) {
      console.error(`Sell order scan error for ${contract.ergoTree.slice(0, 16)}...:`, err);
    }
  }

  return orders;
}

function parseSellOrderBox(
  box: any,
  ergoTree: string,
  paymentTokenId: string,
): ParsedSellOrder | null {
  // Must have at least one token (the option tokens being sold)
  if (!box.assets || box.assets.length === 0 || BigInt(box.assets[0].amount) === 0n) {
    return null;
  }

  const regs = box.additionalRegisters;
  if (!regs?.R4 || !regs?.R5 || !regs?.R6) return null;

  // Parse R5: Coll[Long] = [premiumPerToken, dAppUIFeePer1000, txFee]
  const r5Params = parseCollLong(hexToBytes(regs.R5));
  if (!r5Params || r5Params.length < 3) return null;

  return {
    boxId: box.boxId,
    optionTokenId: box.assets[0].tokenId,
    tokenAmount: box.assets[0].amount.toString(),
    premiumPerToken: r5Params[0].toString(),
    dAppUIFeePer1000: r5Params[1].toString(),
    txFee: r5Params[2].toString(),
    sellerPropBytes: regs.R4,
    dAppUIFeeTree: regs.R6,
    paymentTokenId,
    ergoTree,
    value: box.value.toString(),
    registers: {
      R4: regs.R4,
      R5: regs.R5,
      R6: regs.R6,
    },
  };
}
