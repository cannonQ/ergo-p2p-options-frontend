import type { Metadata } from "next";
import { OptionChain } from "./components/OptionChain";
import { fetchSpotPriceByIndex, fetchVolByIndex } from "@/lib/oracle-parser";
import { scanReserves, type ParsedReserve } from "@/lib/reserve-scanner";
import { scanSellOrders, type ParsedSellOrder } from "@/lib/sell-order-scanner";
import { hasPhysicalDelivery } from "@ergo-options/core";
import Link from "next/link";
import { RefreshButton } from "./components/RefreshButton";
import { ASSET_MAP } from "@/lib/asset-map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { asset: string } }): Promise<Metadata> {
  const info = ASSET_MAP[params.asset];
  return { title: info ? `Trade ${info.name} Options` : "Trade" };
}

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
        <p className="text-[#9da5b8]">Unknown asset: {params.asset}</p>
        <Link href="/app" className="text-[#c87941] hover:underline mt-4 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  // Fetch live spot price, realized volatility, reserves, and sell orders (server-side)
  let spotPrice: number | undefined = 0, oracleVol: number | undefined = 0, allReserves: ParsedReserve[] = [], allSellOrders: ParsedSellOrder[] = [];
  let nodeError = false;
  try {
    [spotPrice, oracleVol, allReserves, allSellOrders] = await Promise.all([
      fetchSpotPriceByIndex(info.index),
      fetchVolByIndex(info.index),
      scanReserves(),
      scanSellOrders(),
    ]);
  } catch {
    nodeError = true;
  }

  // Filter reserves for this asset
  const assetReserves = allReserves.filter(
    (r) => r.oracleIndex === info.index && r.state === "RESERVE"
  );

  // Build optionTokenId → reserve lookup for matching sell orders
  const tokenToReserve = new Map<string, typeof assetReserves[number]>();
  for (const r of assetReserves) {
    if (r.optionTokenId) tokenToReserve.set(r.optionTokenId, r);
  }

  // Filter sell orders to only those matching this asset's reserves
  const assetSellOrders = allSellOrders.filter(
    (so) => tokenToReserve.has(so.optionTokenId)
  );

  return (
    <div className="space-y-6">
      {nodeError && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg px-4 py-3 text-sm text-[#f87171]">
          Unable to reach Ergo node — data may be unavailable. Try refreshing.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{info.pair}</h1>
          <p className="text-[#9da5b8] text-sm">Option chain for {info.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href={`/app/trade/${params.asset}/write`}
            className="px-4 py-2 bg-[#c87941] text-white rounded-lg text-sm font-medium hover:bg-[#e09a5f] transition-colors"
          >
            Write New Option
          </Link>
        </div>
      </div>

      {/* Option Chain */}
      <OptionChain
        assetName={info.name}
        assetUnit={info.unit}
        oracleIndex={info.index}
        spotPrice={spotPrice}
        oracleVol={oracleVol}
        hasPhysical={hasPhysicalDelivery(info.index)}
        reserves={assetReserves}
        sellOrders={assetSellOrders}
        tokenToReserve={Object.fromEntries(
          [...tokenToReserve.entries()].map(([k, v]) => [k, { strikePrice: v.strikePrice, optionType: v.optionType, contractSize: v.contractSize }])
        )}
      />
    </div>
  );
}
