import { NextResponse } from 'next/server';

const NODE_URL = process.env.ERGO_NODE_URL || 'http://96.255.150.220:9053';

export async function GET(
  request: Request,
  { params }: { params: { txId: string } }
) {
  try {
    const res = await fetch(
      `${NODE_URL}/transactions/unconfirmed/byTransactionId/${params.txId}`,
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
