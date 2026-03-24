/**
 * Fetch a box by ID from the node.
 * Returns full box JSON (for building TXs on the client).
 */
import { NextResponse } from "next/server";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boxId = searchParams.get("boxId");

  if (!boxId || boxId.length !== 64) {
    return NextResponse.json(
      { error: "boxId parameter required (64 hex chars)" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${NODE_URL}/utxo/withPool/byId/${boxId}`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Node error: ${text}` },
        { status: res.status },
      );
    }
    const box = await res.json();
    return NextResponse.json(box);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
