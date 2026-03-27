/**
 * Scan contract address for boxes belonging to a specific wallet.
 * Matches R9[0] (issuer EC point) against the wallet's public key.
 *
 * Returns classified boxes: DEFINITION (stuck), MINTED_UNDELIVERED, RESERVE, EXPIRED
 */
import { NextResponse } from "next/server";
import {
  CONTRACT_ADDRESSES,
  OPTION_RESERVE_ERGOTREE,
  ORACLE_DECIMAL,
} from "@ergo-options/core";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

// Sigma type prefix for Coll[Byte]: 0x0e
// R7 format: 0e20 + 32-byte hex (box ID)
// R9 format: Coll[Coll[Byte]] — first element is 33-byte EC point

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Extract the issuer EC point (33 bytes) from R9 register hex.
 * R9 is Coll[Coll[Byte]] — type 0x1a. First inner Coll[Byte] is the EC point.
 */
function extractIssuerECPoint(r9hex: string): string | null {
  try {
    const bytes = hexToBytes(r9hex);
    let offset = 0;

    // Type byte: 0x1a = Coll[Coll[Byte]]
    if (bytes[offset] !== 0x1a) return null;
    offset++;

    // Outer count (VLQ)
    let outerCount = 0;
    let shift = 0;
    while (offset < bytes.length) {
      const b = bytes[offset++];
      outerCount |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    if (outerCount < 1) return null;

    // First inner Coll[Byte] length (VLQ)
    let innerLen = 0;
    shift = 0;
    while (offset < bytes.length) {
      const b = bytes[offset++];
      innerLen |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }

    // Should be 33 bytes (compressed EC point)
    if (innerLen !== 33) return null;

    const ecPointBytes = bytes.slice(offset, offset + 33);
    return Array.from(ecPointBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

/**
 * Parse R8 Coll[Long] to extract option params.
 */
function parseR8Params(r8hex: string): any | null {
  try {
    const bytes = hexToBytes(r8hex);
    let offset = 0;
    if (bytes[offset] !== 0x11) return null;
    offset++;

    // Count (VLQ)
    let count = 0;
    let shift = 0;
    while (offset < bytes.length) {
      const b = bytes[offset++];
      count |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }

    // Read BigInt VLQ values
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      let result = 0n;
      let s = 0n;
      while (offset < bytes.length) {
        const b = BigInt(bytes[offset++]);
        result |= (b & 0x7fn) << s;
        if ((b & 0x80n) === 0n) break;
        s += 7n;
      }
      const decoded = (result >> 1n) ^ -(result & 1n);
      values.push(Number(decoded));
    }

    if (values.length < 11) return null;

    return {
      optionType: values[0],    // 0=call, 1=put
      style: values[1],         // 0=european, 1=american
      shareSize: values[2],
      maturityDate: values[3],
      strikePrice: values[4] / Number(ORACLE_DECIMAL),
      dAppUIMintFee: values[5],
      txFee: values[6],
      oracleIndex: values[7],
      settlementType: values[8], // 0=physical, 1=cash
      collateralCap: values[9],
      stablecoinDecimal: values[10],
    };
  } catch {
    return null;
  }
}

/**
 * Parse R4 Coll[Byte] to get option name as UTF-8 string.
 */
function parseR4Name(r4hex: string): string {
  try {
    const bytes = hexToBytes(r4hex);
    let offset = 0;
    if (bytes[offset] !== 0x0e) return "Unknown";
    offset++;
    let len = 0;
    let shift = 0;
    while (offset < bytes.length) {
      const b = bytes[offset++];
      len |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    const raw = new TextDecoder().decode(bytes.slice(offset, offset + len));
    // Sanitize: allow alphanumeric, spaces, basic symbols; truncate to 100 chars
    return raw.replace(/[^\w\s$.\-/()]/g, "").substring(0, 100) || "Unknown";
  } catch {
    return "Unknown";
  }
}

export interface MyBox {
  boxId: string;
  state: "DEFINITION" | "MINTED_UNDELIVERED" | "RESERVE" | "EXPIRED";
  name: string;
  value: number;
  optionType?: string;
  style?: string;
  settlement?: string;
  strikePrice?: number;
  maturityDate?: number;
  oracleIndex?: number;
  tokenCount?: number;
  collateralTokenId?: string;
  collateralAmount?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletECPoint = searchParams.get("ecPoint"); // 33-byte EC point as hex (66 chars)

  if (!walletECPoint || !/^[0-9a-f]{66}$/i.test(walletECPoint)) {
    return NextResponse.json({ error: "ecPoint must be 66 hex characters" }, { status: 400 });
  }

  try {
    const currentHeight = await fetchHeight();

    // Scan all contract addresses for unspent boxes
    const allBoxes: any[] = [];
    for (const contract of CONTRACT_ADDRESSES) {
      try {
        const res = await fetch(
          `${NODE_URL}/blockchain/box/unspent/byErgoTree?offset=0&limit=200`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contract.ergoTree),
          },
        );
        if (res.ok) {
          const rawData = await res.json();
          const items: any[] = rawData.items ?? rawData;
          allBoxes.push(...items);
        }
      } catch {
        // Skip failed contract scans
      }
    }

    const myBoxes: MyBox[] = [];

    for (const box of allBoxes) {
      const regs = box.additionalRegisters || {};
      if (!regs.R9) continue;

      // Extract issuer EC point from R9[0]
      const issuerECPoint = extractIssuerECPoint(regs.R9);
      if (!issuerECPoint) continue;

      // Check if this box belongs to the connected wallet
      if (issuerECPoint.toLowerCase() !== walletECPoint.toLowerCase()) continue;

      // Classify box state
      const r7hex = regs.R7;
      const creationBoxId = r7hex && r7hex.startsWith("0e20") ? r7hex.slice(4) : null;
      const hasToken = box.assets && box.assets.length > 0;
      const tokenId = hasToken ? box.assets[0].tokenId : "";
      const tokenQty = hasToken ? box.assets[0].amount : 0;
      const isMinted = hasToken && creationBoxId && tokenId === creationBoxId;

      let state: MyBox["state"];
      const exerciseWindow = CONTRACT_ADDRESSES[0]?.exerciseWindow ?? 720;

      if (!isMinted) {
        state = "DEFINITION";
      } else if (tokenQty > 1) {
        state = "MINTED_UNDELIVERED";
      } else {
        // Parse R8 for maturity
        const params = regs.R8 ? parseR8Params(regs.R8) : null;
        if (params && currentHeight > params.maturityDate + exerciseWindow) {
          state = "EXPIRED";
        } else {
          state = "RESERVE";
        }
      }

      const params = regs.R8 ? parseR8Params(regs.R8) : null;
      const name = regs.R4 ? parseR4Name(regs.R4) : "Unknown";

      myBoxes.push({
        boxId: box.boxId,
        state,
        name,
        value: box.value,
        optionType: params ? (params.optionType === 0 ? "call" : "put") : undefined,
        style: params ? (params.style === 0 ? "european" : "american") : undefined,
        settlement: params ? (params.settlementType === 0 ? "physical" : "cash") : undefined,
        strikePrice: params?.strikePrice,
        maturityDate: params?.maturityDate,
        oracleIndex: params?.oracleIndex,
        tokenCount: tokenQty > 1 ? tokenQty - 1 : undefined,
        collateralTokenId: box.assets?.[1]?.tokenId,
        collateralAmount: box.assets?.[1]?.amount?.toString(),
      });
    }

    return NextResponse.json({
      boxes: myBoxes,
      currentHeight,
      exerciseWindow: CONTRACT_ADDRESSES[0]?.exerciseWindow ?? 720,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, boxes: [] }, { status: 500 });
  }
}

async function fetchHeight(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/info`);
    if (!res.ok) return 0;
    const info = await res.json();
    return info.fullHeight ?? 0;
  } catch {
    return 0;
  }
}
