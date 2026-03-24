import { NextResponse } from "next/server";
import { scanReserves } from "@/lib/reserve-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reserves = await scanReserves();
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
      // Total reserves found (all states)
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
