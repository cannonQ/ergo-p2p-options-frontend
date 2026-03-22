import { NextResponse } from 'next/server';

const NODE_URL = process.env.ERGO_NODE_URL || 'http://96.255.150.220:9053';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NODE_URL}/blockchain/box/unspent/byAddress/${address}?offset=0&limit=100`,
    );
    if (!res.ok) throw new Error(`Node error: ${res.status}`);
    const boxes = await res.json();
    return NextResponse.json({ boxes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
