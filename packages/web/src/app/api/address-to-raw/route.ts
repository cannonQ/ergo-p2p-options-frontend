import { NextResponse } from "next/server";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
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
