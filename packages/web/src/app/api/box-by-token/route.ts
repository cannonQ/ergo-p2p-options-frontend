import { NextResponse } from "next/server";

import { NODE_URL } from "@/lib/node";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId || !/^[0-9a-fA-F]{64}$/.test(tokenId)) {
    return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NODE_URL}/blockchain/box/unspent/byTokenId/${tokenId}?offset=0&limit=1`,
    );
    if (!res.ok) throw new Error(`Node error: ${res.status}`);
    const data = await res.json();
    const boxes = data.items ?? data;
    if (!boxes || boxes.length === 0) {
      return NextResponse.json({ error: "No box found with this token" }, { status: 404 });
    }
    return NextResponse.json(boxes[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
