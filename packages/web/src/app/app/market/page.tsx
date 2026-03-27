import type { Metadata } from "next";
import { scanReserves } from "@/lib/reserve-scanner";
import { fetchSpotPrices } from "@/lib/oracle-parser";
import { MarketFilters } from "./components/MarketFilters";

export const metadata: Metadata = { title: "Market" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

async function fetchHeight(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/info`, { cache: "no-store" });
    if (!res.ok) return 0;
    const info = await res.json();
    return info.fullHeight ?? 0;
  } catch { return 0; }
}

export default async function MarketPage() {
  const [reserves, spotPrices, currentHeight] = await Promise.all([
    scanReserves(),
    fetchSpotPrices(),
    fetchHeight(),
  ]);

  // Show reserves + expired (not definitions or undelivered)
  const visibleReserves = reserves.filter((r) => r.state === "RESERVE" || r.state === "EXPIRED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-[#8891a5]">All active options across all assets</p>
      </div>

      <MarketFilters
        reserves={visibleReserves}
        spotPrices={Object.fromEntries(spotPrices)}
        currentHeight={currentHeight}
      />
    </div>
  );
}
