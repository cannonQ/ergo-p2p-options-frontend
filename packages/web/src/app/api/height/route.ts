import { NextResponse } from 'next/server';

const NODE_URL = process.env.ERGO_NODE_URL || 'http://96.255.150.220:9053';

export async function GET() {
  try {
    const res = await fetch(`${NODE_URL}/info`);
    if (!res.ok) throw new Error(`Node error: ${res.status}`);
    const info = await res.json();
    return NextResponse.json({ height: info.fullHeight });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
