/**
 * Shared oracle parsing utilities for Ergo sigma-serialized register data.
 * Used by both the landing page and trade pages to decode Coll[Long] from
 * the companion box registers.
 *
 * IMPORTANT: Uses BigInt throughout to handle large oracle values correctly
 * (e.g. BTC at 67,952,600,000 micro-dollars overflows 32-bit integers).
 */

import { NODE_URL } from "./node";
export { NODE_URL };  // re-export for existing consumers
export const COMPANION_NFT_ID = "3182674f07dbb98d696d38eda53e63eb3bf5fe570f71dee85eb954d6cf903bba";
export const ORACLE_DECIMAL = 1_000_000;

/**
 * Fetch the companion box once and parse both R8 (prices) and R5 (vol) registers.
 * All other functions delegate to this to avoid duplicate network requests.
 */
export async function fetchCompanionBox(): Promise<{
  prices: Map<number, number>;
  vols: Map<number, number>;
}> {
  const prices = new Map<number, number>();
  const vols = new Map<number, number>();

  try {
    const res = await fetch(
      `${NODE_URL}/blockchain/box/unspent/byTokenId/${COMPANION_NFT_ID}?offset=0&limit=1`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return { prices, vols };
    const boxes = await res.json();
    if (!boxes || boxes.length === 0) return { prices, vols };

    const box = boxes[0];

    // Parse R8 -> spot prices
    const r8hex = box.additionalRegisters?.R8;
    if (r8hex) {
      const parsed = parseCollLong(hexToBytes(r8hex));
      if (parsed) {
        for (let i = 0; i < parsed.length && i < 21; i++) {
          if (parsed[i] > 0n) {
            prices.set(i, Number(parsed[i]) / ORACLE_DECIMAL);
          }
        }
      }
    }

    // Parse R5 -> volatility (bps)
    const r5hex = box.additionalRegisters?.R5;
    if (r5hex) {
      const parsed = parseCollLong(hexToBytes(r5hex));
      if (parsed) {
        for (let i = 0; i < parsed.length && i < 21; i++) {
          const val = Number(parsed[i]);
          if (val > 0) vols.set(i, val);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch companion box:", err);
  }

  return { prices, vols };
}

/**
 * Fetch spot prices from the companion box R8 register.
 * Returns a Map of oracle index -> USD price (human-readable).
 */
export async function fetchSpotPrices(): Promise<Map<number, number>> {
  const { prices } = await fetchCompanionBox();
  return prices;
}

/**
 * Fetch the spot price for a single oracle index.
 * Returns the USD price or undefined if not available.
 */
export async function fetchSpotPriceByIndex(index: number): Promise<number | undefined> {
  const { prices } = await fetchCompanionBox();
  return prices.get(index);
}

/**
 * Fetch realized volatility for ALL oracle indices from companion box R5.
 * Returns Map of oracle index -> bps.
 */
export async function fetchVols(): Promise<Map<number, number>> {
  const { vols } = await fetchCompanionBox();
  return vols;
}

/**
 * Fetch realized volatility from the companion box R5 register for a single oracle index.
 * R5 is Coll[Long] with annualized volatility in basis points (1% = 100 bps).
 * Returns bps or undefined if not available.
 */
export async function fetchVolByIndex(index: number): Promise<number | undefined> {
  const { vols } = await fetchCompanionBox();
  return vols.get(index);
}

/**
 * Fetch both spot price and volatility for a single oracle index in one request.
 * Returns { spotPrice, vol } where vol is in basis points.
 * Callers (e.g. trade page) can use this instead of separate
 * fetchSpotPriceByIndex + fetchVolByIndex calls.
 */
export async function fetchOracleData(index: number): Promise<{
  spotPrice: number | undefined;
  vol: number | undefined;
}> {
  const { prices, vols } = await fetchCompanionBox();
  return {
    spotPrice: prices.get(index),
    vol: vols.get(index),
  };
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Parse a sigma-serialized Coll[Long] value.
 * Format: type_byte(0x11) + VLQ_count + VLQ_encoded_longs
 *
 * Returns BigInt[] to handle large values (BTC, DJI, Gold, S&P prices
 * exceed 2^31 in micro-dollars).
 */
export function parseCollLong(bytes: Uint8Array): bigint[] | null {
  let offset = 0;

  // Type byte: 0x11 = Coll[Long]
  if (bytes[offset] !== 0x11) return null;
  offset++;

  // Read VLQ count (small number, regular number is fine)
  const [count, countOffset] = readVLQNumber(bytes, offset);
  offset = countOffset;

  const values: bigint[] = [];
  for (let i = 0; i < count; i++) {
    const [val, nextOffset] = readSignedVLQBigInt(bytes, offset);
    offset = nextOffset;
    values.push(val);
  }

  return values;
}

/** Read unsigned VLQ as regular number (for small values like array length) */
function readVLQNumber(bytes: Uint8Array, offset: number): [number, number] {
  let result = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return [result, offset];
}

/** Read unsigned VLQ as BigInt (for potentially large values) */
function readVLQBigInt(bytes: Uint8Array, offset: number): [bigint, number] {
  let result = 0n;
  let shift = 0n;
  while (offset < bytes.length) {
    const b = BigInt(bytes[offset++]);
    result |= (b & 0x7fn) << shift;
    if ((b & 0x80n) === 0n) break;
    shift += 7n;
  }
  return [result, offset];
}

/** Read signed VLQ (ZigZag encoded) as BigInt */
function readSignedVLQBigInt(bytes: Uint8Array, offset: number): [bigint, number] {
  const [raw, newOffset] = readVLQBigInt(bytes, offset);
  // ZigZag decode: (raw >> 1) ^ -(raw & 1)
  const value = (raw >> 1n) ^ -(raw & 1n);
  return [value, newOffset];
}
