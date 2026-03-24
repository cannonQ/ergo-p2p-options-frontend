import { scanReserves } from "@/lib/reserve-scanner";
import { fetchSpotPrices } from "@/lib/oracle-parser";
import { MarketFilters } from "./components/MarketFilters";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function MarketPage() {
  const [reserves, spotPrices] = await Promise.all([
    scanReserves(),
    fetchSpotPrices(),
  ]);

  // Only show active reserves (not definitions, not expired)
  const activeReserves = reserves.filter((r) => r.state === "RESERVE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-[#94a3b8]">All active options across all assets</p>
      </div>

      <MarketFilters reserves={activeReserves} spotPrices={Object.fromEntries(spotPrices)} />
    </div>
  );
}
