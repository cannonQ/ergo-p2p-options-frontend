import { OptionChain } from "./components/OptionChain";
import { fetchSpotPriceByIndex, fetchVolByIndex } from "@/lib/oracle-parser";
import { scanReserves } from "@/lib/reserve-scanner";
import { hasPhysicalDelivery } from "@ergo-options/core";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 30;

// Map URL slugs to oracle feed indices and display info
const ASSET_MAP: Record<string, { name: string; index: number; pair: string }> = {
  // Crypto — Physical Delivery
  eth:     { name: "ETH",     index: 0,  pair: "ETH/USD" },
  btc:     { name: "BTC",     index: 1,  pair: "BTC/USD" },
  bnb:     { name: "BNB",     index: 2,  pair: "BNB/USD" },
  doge:    { name: "DOGE",    index: 3,  pair: "DOGE/USD" },
  ada:     { name: "ADA",     index: 4,  pair: "ADA/USD" },
  erg:     { name: "ERG",     index: 17, pair: "ERG/USD" },
  // Crypto — Cash Settlement
  hns:     { name: "HNS",     index: 5,  pair: "HNS/USD" },
  ckb:     { name: "CKB",     index: 6,  pair: "CKB/USD" },
  atom:    { name: "ATOM",    index: 7,  pair: "ATOM/USD" },
  firo:    { name: "FIRO",    index: 19, pair: "FIRO/USD" },
  // Commodities & Metals
  gold:    { name: "Gold",    index: 18, pair: "XAU/USD" },
  silver:  { name: "Silver",  index: 11, pair: "XAG/USD" },
  copper:  { name: "Copper",  index: 12, pair: "XCU/USD" },
  brent:   { name: "Brent",   index: 13, pair: "BRENT/USD" },
  wti:     { name: "WTI",     index: 14, pair: "WTI/USD" },
  natgas:  { name: "NatGas",  index: 15, pair: "NGAS/USD" },
  // Indices
  spx:     { name: "S&P 500", index: 9,  pair: "SPX" },
  dji:     { name: "DJI",     index: 10, pair: "DJI" },
};

export default async function TradePage({
  params,
}: {
  params: { asset: string };
}) {
  const info = ASSET_MAP[params.asset];

  if (!info) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-2">Asset Not Found</h1>
        <p className="text-[#94a3b8]">Unknown asset: {params.asset}</p>
        <Link href="/" className="text-[#3b82f6] hover:underline mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  // Fetch live spot price, realized volatility, and on-chain reserves (server-side)
  const [spotPrice, oracleVol, allReserves] = await Promise.all([
    fetchSpotPriceByIndex(info.index),
    fetchVolByIndex(info.index),
    scanReserves(),
  ]);

  // Filter reserves for this asset
  const assetReserves = allReserves.filter(
    (r) => r.oracleIndex === info.index && r.state === "RESERVE"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{info.pair}</h1>
          <p className="text-[#94a3b8] text-sm">Option chain for {info.name}</p>
        </div>
        <Link
          href={`/trade/${params.asset}/write`}
          className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
        >
          Write New Option
        </Link>
      </div>

      {/* Option Chain */}
      <OptionChain assetName={info.name} oracleIndex={info.index} spotPrice={spotPrice} oracleVol={oracleVol} hasPhysical={hasPhysicalDelivery(info.index)} reserves={assetReserves} />
    </div>
  );
}
