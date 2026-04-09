import type { Metadata } from "next";
import { scanReserves, type ParsedReserve } from "@/lib/reserve-scanner";
import { fetchSpotPrices } from "@/lib/oracle-parser";
import { MarketFilters } from "./components/MarketFilters";

export const metadata: Metadata = { title: "Market" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchCurrentHeight } from "@/lib/node";

export default async function MarketPage() {
  let reserves: ParsedReserve[] = [], spotPrices = new Map<number, number>(), currentHeight = 0;
  let nodeError = false;
  try {
    [reserves, spotPrices, currentHeight] = await Promise.all([
      scanReserves(),
      fetchSpotPrices(),
      fetchCurrentHeight(),
    ]);
  } catch {
    nodeError = true;
  }

  // Show reserves + expired (not definitions or undelivered)
  const visibleReserves = reserves.filter((r) => r.state === "RESERVE" || r.state === "EXPIRED");

  return (
    <div className="space-y-6">
      {nodeError && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg px-4 py-3 text-sm text-[#f87171]">
          Unable to reach Ergo node — data may be unavailable. Try refreshing.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-[#9da5b8]">All active options across all assets</p>
      </div>

      <MarketFilters
        reserves={visibleReserves}
        spotPrices={Object.fromEntries(spotPrices)}
        currentHeight={currentHeight}
      />
    </div>
  );
}
