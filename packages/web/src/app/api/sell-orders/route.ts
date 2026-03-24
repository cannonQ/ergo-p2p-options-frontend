import { NextResponse } from "next/server";
import { scanSellOrders } from "@/lib/sell-order-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await scanSellOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
