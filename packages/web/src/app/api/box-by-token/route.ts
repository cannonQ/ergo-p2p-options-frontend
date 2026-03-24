import { NextResponse } from "next/server";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json({ error: "tokenId parameter required" }, { status: 400 });
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
