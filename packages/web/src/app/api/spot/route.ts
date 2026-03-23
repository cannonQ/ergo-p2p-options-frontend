import { NextResponse } from "next/server";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";
const COMPANION_NFT_ID = "3182674f07dbb98d696d38eda53e63eb3bf5fe570f71dee85eb954d6cf903bba";
const ORACLE_DECIMAL = 1_000_000;

// Cache parsed oracle data
let cache: { prices: number[]; vol: number[]; ts: number } | null = null;
const CACHE_TTL = 30_000;

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

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

function parseCollLong(bytes: Uint8Array): number[] | null {
  let offset = 0;
  if (bytes[offset] !== 0x11) return null;
  offset++;

  // Read count
  let count = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    count |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }

  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const [raw, newOffset] = readVLQBigInt(bytes, offset);
    offset = newOffset;
    const value = (raw >> 1n) ^ -(raw & 1n);
    values.push(Number(value));
  }
  return values;
}

async function fetchOracleData(): Promise<{ prices: number[]; vol: number[] }> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return { prices: cache.prices, vol: cache.vol };
  }

  const res = await fetch(
    `${NODE_URL}/blockchain/box/unspent/byTokenId/${COMPANION_NFT_ID}?offset=0&limit=1`,
  );
  if (!res.ok) throw new Error(`Node error: ${res.status}`);
  const boxes = await res.json();
  if (!boxes || boxes.length === 0) throw new Error("Companion box not found");

  const box = boxes[0];

  // R8 = spot prices (Coll[Long])
  const r8hex = box.additionalRegisters?.R8;
  const prices = r8hex ? parseCollLong(hexToBytes(r8hex)) ?? [] : [];

  // R5 = volatility (Coll[Long], annualized bps)
  const r5hex = box.additionalRegisters?.R5;
  const vol = r5hex ? parseCollLong(hexToBytes(r5hex)) ?? [] : [];

  cache = { prices, vol, ts: Date.now() };
  return { prices, vol };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const indexStr = searchParams.get("index");

  if (indexStr === null) {
    return NextResponse.json({ error: "index parameter required" }, { status: 400 });
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0 || index > 20) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }

  try {
    const { prices, vol } = await fetchOracleData();
    const rawPrice = prices[index] ?? 0;
    const rawVol = vol[index] ?? 0;

    return NextResponse.json({
      price: rawPrice / ORACLE_DECIMAL,
      rawPrice,
      vol: rawVol,       // bps (annualized)
      index,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
