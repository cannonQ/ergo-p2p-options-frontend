import { NextResponse } from "next/server";
import { scanReserves } from "@/lib/reserve-scanner";

export const dynamic = "force-dynamic";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

async function fetchHeight(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/info`, { cache: "no-store" });
    if (!res.ok) return 0;
    const info = await res.json();
    return info.fullHeight ?? 0;
  } catch { return 0; }
}

export async function GET() {
  try {
    const [reserves, currentHeight] = await Promise.all([
      scanReserves(),
      fetchHeight(),
    ]);
    const active = reserves.filter((r) => r.state === "RESERVE");

    const callCount = active.filter((r) => r.optionType === "call").length;
    const putCount = active.filter((r) => r.optionType === "put").length;

    // Open interest: sum of collateral ERG value across active reserves
    // For ERG options, the box value IS the collateral
    const openInterestNanoErg = active.reduce((sum, r) => {
      return sum + BigInt(r.valueNanoErg);
    }, 0n);

    // Convert nanoERG to ERG
    const openInterestErg = Number(openInterestNanoErg) / 1_000_000_000;

    return NextResponse.json({
      activeContracts: active.length,
      callCount,
      putCount,
      openInterestErg,
      currentHeight,
      totalBoxes: reserves.length,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { activeContracts: 0, callCount: 0, putCount: 0, openInterestErg: 0, totalBoxes: 0 },
      { status: 500 }
    );
  }
}
