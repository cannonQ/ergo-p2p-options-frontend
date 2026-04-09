import { NextResponse } from "next/server";

import { NODE_URL } from "@/lib/node";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !/^[1-9A-HJ-NP-Za-km-z]{30,60}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const res = await fetch(`${NODE_URL}/utils/addressToRaw/${address}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const data = await res.json();
    return NextResponse.json({ raw: data.raw });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
