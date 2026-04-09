import { NextResponse } from "next/server";
import { fetchPriceHistory7d } from "@/lib/price-history";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const indexStr = searchParams.get("index");
  if (!indexStr) return NextResponse.json({ error: "Missing index" }, { status: 400 });

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0 || index > 30) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const data = await fetchPriceHistory7d(index);
  return NextResponse.json({ data });
}
