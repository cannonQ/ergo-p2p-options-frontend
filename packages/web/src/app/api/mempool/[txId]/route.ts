import { NextResponse } from 'next/server';

import { NODE_URL } from "@/lib/node";

export async function GET(
  request: Request,
  { params }: { params: { txId: string } }
) {
  const txId = params.txId;
  if (!/^[0-9a-fA-F]{64}$/.test(txId)) {
    return NextResponse.json({ error: "Invalid txId" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NODE_URL}/transactions/unconfirmed/byTransactionId/${txId}`,
    );

    if (res.status === 404) {
      return NextResponse.json({ found: false });
    }
    if (!res.ok) throw new Error(`Node error: ${res.status}`);

    const tx = await res.json();
    return NextResponse.json({ found: true, tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
