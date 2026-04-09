/**
 * Fetch a box by ID from the node.
 * Returns full box JSON (for building TXs on the client).
 */
import { NextResponse } from "next/server";

import { NODE_URL } from "@/lib/node";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boxId = searchParams.get("boxId");

  if (!boxId || !/^[0-9a-f]{64}$/i.test(boxId)) {
    return NextResponse.json(
      { error: "boxId must be 64 hex characters" },
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
