import { NextResponse } from 'next/server';

import { NODE_URL } from "@/lib/node";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic TX structure validation
    if (!body || typeof body !== 'object' || !body.inputs || !body.outputs) {
      return NextResponse.json({ error: 'Invalid transaction format' }, { status: 400 });
    }
    const jsonStr = JSON.stringify(body);
    if (jsonStr.length > 500_000) {
      return NextResponse.json({ error: 'Transaction payload too large' }, { status: 400 });
    }

    const res = await fetch(`${NODE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status >= 500) {
        return NextResponse.json({ error: "Node error — please try again" }, { status: 502 });
      }
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const txId = await res.json();
    return NextResponse.json({ txId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
