import { NextResponse } from 'next/server';

import { NODE_URL } from "@/lib/node";
const COMPANION_NFT_ID = '3182674f07dbb98d696d38eda53e63eb3bf5fe570f71dee85eb954d6cf903bba';
const REGISTRY_NFT_ID = 'ea7b36e294b1a954a80752eac288711728e5b91b0b3c0596548c755665050b88';

// Simple in-memory cache
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

async function fetchBoxByTokenId(tokenId: string) {
  const res = await fetch(
    `${NODE_URL}/blockchain/box/unspent/byTokenId/${tokenId}?offset=0&limit=1`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Node error: ${res.status}`);
  const boxes = await res.json();
  if (!boxes || boxes.length === 0) throw new Error(`No box found with token ${tokenId.slice(0, 16)}...`);
  return boxes[0];
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const [companion, registry] = await Promise.all([
      fetchBoxByTokenId(COMPANION_NFT_ID),
      fetchBoxByTokenId(REGISTRY_NFT_ID),
    ]);

    // Parse companion R8 (spot prices) and R5 (volatility)
    // The node returns registers as serialized hex — we pass them through
    // for the client to parse with Fleet SDK serializer
    const data = {
      companion: {
        boxId: companion.boxId,
        additionalRegisters: companion.additionalRegisters,
        assets: companion.assets,
      },
      registry: {
        boxId: registry.boxId,
        additionalRegisters: registry.additionalRegisters,
        assets: registry.assets,
      },
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
