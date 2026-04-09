/**
 * Server-side scanner for option reserve boxes at known contract addresses.
 * Parses R4 (name), R7 (creation box ID), R8 (option params) from on-chain UTXOs.
 */
import { NODE_URL, hexToBytes, parseCollLong, ORACLE_DECIMAL } from "./oracle-parser";
import { CONTRACT_ADDRESSES, ASSET_NAMES } from "@ergo-options/core";

export interface ParsedReserve {
  boxId: string;
  name: string;
  optionType: "call" | "put";
  style: "european" | "american";
  settlement: "physical" | "cash";
  strikePrice: number;
  maturityHeight: number;
  oracleIndex: number;
  assetName: string;
  state: "DEFINITION" | "MINTED_UNDELIVERED" | "RESERVE" | "EXPIRED" | "UNKNOWN";
  collateralTokenId?: string;
  collateralAmount?: string;
  /** Box value in nanoERG (collateral for ERG options) */
  valueNanoErg: string;
  /** The option token ID (= definition box ID from R7, same as tokens[0] for minted boxes) */
  optionTokenId?: string;
  /** Contract size in oracle units (shareSize / ORACLE_DECIMAL) */
  contractSize?: number;
}

/**
 * Parse a sigma-serialized Coll[Byte] (type 0x0e) to UTF-8 string.
 */
function parseCollByte(bytes: Uint8Array): string | null {
  let offset = 0;
  if (bytes[offset] !== 0x0e) return null;
  offset++;

  // Read VLQ length
  let len = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    len |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }

  const strBytes = bytes.slice(offset, offset + len);
  return new TextDecoder().decode(strBytes);
}

/**
 * Parse R7 Coll[Byte] to hex string (32-byte creation box ID).
 */
function parseR7BoxId(bytes: Uint8Array): string | null {
  let offset = 0;
  if (bytes[offset] !== 0x0e) return null;
  offset++;

  let len = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    len |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }

  if (len !== 32) return null;
  const idBytes = bytes.slice(offset, offset + 32);
  return Array.from(idBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Scan all known contract addresses for reserve boxes.
 */
export async function scanReserves(currentHeight?: number): Promise<ParsedReserve[]> {
  const reserves: ParsedReserve[] = [];

  // Get current height if not provided
  let height = currentHeight;
  if (!height) {
    try {
      const infoRes = await fetch(`${NODE_URL}/info`, { cache: 'no-store' });
      if (infoRes.ok) {
        const info = await infoRes.json();
        height = info.fullHeight;
      }
    } catch { /* ignore */ }
  }
  height = height ?? 0;

  for (const contractInfo of CONTRACT_ADDRESSES) {
    try {
      const res = await fetch(
        `${NODE_URL}/blockchain/box/unspent/byErgoTree?offset=0&limit=100`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractInfo.ergoTree),
          cache: 'no-store',
        } as any,
      );
      if (!res.ok) continue;
      // Response may be { items: [...] } or array
      const rawData = await res.json();
      const boxes = rawData.items ?? rawData;

      for (const box of boxes) {
        const parsed = parseReserveBox(box, height, contractInfo.exerciseWindow);
        if (parsed) reserves.push(parsed);
      }
    } catch (err) {
      console.error(`Scanner error for ${contractInfo.ergoTree.slice(0, 16)}...:`, err);
    }
  }

  return reserves;
}

function parseReserveBox(box: any, currentHeight: number, exerciseWindow: number): ParsedReserve | null {
  const regs = box.additionalRegisters;
  if (!regs?.R4 || !regs?.R8) return null;

  // Parse R4: option name
  const name = parseCollByte(hexToBytes(regs.R4)) ?? "Unknown";

  // Parse R7: creation box ID
  const creationBoxId = regs.R7 ? parseR7BoxId(hexToBytes(regs.R7)) : null;

  // Parse R8: Coll[Long] — 11 params
  const params = parseCollLong(hexToBytes(regs.R8));
  if (!params || params.length < 11) return null;

  const optionType = Number(params[0]) === 0 ? "call" as const : "put" as const;
  const style = Number(params[1]) === 0 ? "european" as const : "american" as const;
  const shareSize = Number(params[2]);
  const contractSize = shareSize / Number(ORACLE_DECIMAL);
  const maturityHeight = Number(params[3]);
  // strikePrice per unit:
  //   Physical: on-chain = strike * contractSize * ORACLE_DECIMAL → divide by both
  //   Cash: on-chain = strike * ORACLE_DECIMAL → divide by ORACLE_DECIMAL only
  const settlement = Number(params[8]) === 0 ? "physical" as const : "cash" as const;
  const strikePriceRaw = Number(params[4]) / Number(ORACLE_DECIMAL);
  const strikePrice = settlement === "physical" && contractSize > 0
    ? strikePriceRaw / contractSize
    : strikePriceRaw;
  const oracleIndex = Number(params[7]);
  // settlement already declared above for strike calculation

  // Classify state
  const hasToken = box.assets && box.assets.length > 0;
  const tokenId = hasToken ? box.assets[0].tokenId : "";
  const tokenQty = hasToken ? BigInt(box.assets[0].amount) : 0n;
  const isMinted = hasToken && creationBoxId && tokenId === creationBoxId;

  let state: ParsedReserve["state"];
  if (!isMinted) {
    state = "DEFINITION";
  } else if (tokenQty > 1n) {
    state = "MINTED_UNDELIVERED";
  } else if (currentHeight > 0 && currentHeight > maturityHeight + exerciseWindow) {
    // Guard: skip expiry check when height=0 (node unreachable) to avoid
    // misclassifying expired options as active RESERVE
    state = "EXPIRED";
  } else {
    state = "RESERVE";
  }

  const assetName = ASSET_NAMES[oracleIndex] ?? `Feed #${oracleIndex}`;

  return {
    boxId: box.boxId,
    name,
    optionType,
    style,
    settlement,
    strikePrice,
    maturityHeight,
    oracleIndex,
    assetName,
    state,
    collateralTokenId: box.assets?.[1]?.tokenId,
    collateralAmount: box.assets?.[1]?.amount?.toString(),
    valueNanoErg: box.value?.toString() ?? "0",
    optionTokenId: creationBoxId ?? (tokenId || undefined),
    contractSize,
  };
}
