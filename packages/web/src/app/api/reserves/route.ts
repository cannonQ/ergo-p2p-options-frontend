import { NextResponse } from "next/server";
import { scanReserves } from "@/lib/reserve-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reserves = await scanReserves();
    return NextResponse.json({ reserves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
