import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { NODE_URL } from "@/lib/node";

export async function GET() {
  try {
    const res = await fetch(`${NODE_URL}/info`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Node error: ${res.status}`);
    const info = await res.json();
    return NextResponse.json({ height: info.fullHeight });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
