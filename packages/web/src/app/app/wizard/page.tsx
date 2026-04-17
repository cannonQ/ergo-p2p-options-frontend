import type { Metadata } from "next";
import { fetchSpotPrices, fetchVols } from "@/lib/oracle-parser";
import { fetchAllAssetPriceData } from "@/lib/price-history";
import { scanReserves } from "@/lib/reserve-scanner";
import { scanSellOrders } from "@/lib/sell-order-scanner";
import { ASSET_MAP } from "@/lib/asset-map";
import { WizardClient } from "./WizardClient";
import type { WizardAsset } from "./components/AssetPicker";

export const metadata: Metadata = { title: "Strategy Wizard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchCurrentHeight } from "@/lib/node";

export default async function WizardPage() {
  // Single parallel fetch — fetchVols() fetches companion box once for all indices
  let spotPrices = new Map<number, number>();
  let volByIndex = new Map<number, number>();
  let priceData = new Map<number, any>();
  let reserves: any[] = [];
  let sellOrders: any[] = [];
  let currentHeight = 0;
  let nodeError = false;
  try {
    [spotPrices, volByIndex, priceData, reserves, sellOrders, currentHeight] = await Promise.all([
      fetchSpotPrices(),
      fetchVols().catch(() => new Map<number, number>()),
      fetchAllAssetPriceData().catch(() => new Map()),
      scanReserves().catch(() => []),
      scanSellOrders().catch(() => []),
      fetchCurrentHeight(),
    ]);
  } catch {
    nodeError = true;
  }

  // Build wizard asset list with live data
  const assets: WizardAsset[] = [];
  const spotPricesRecord: Record<string, number> = {};
  const volDataRecord: Record<string, number> = {};

  for (const [slug, info] of Object.entries(ASSET_MAP)) {
    const price = spotPrices.get(info.index);
    if (!price) continue; // skip assets without oracle data

    const history = priceData.get(info.index);
    assets.push({
      slug,
      name: info.name,
      displayName: info.displayName,
      price,
      change24h: history?.change24h,
      oracleIndex: info.index,
      category: info.category,
    });

    spotPricesRecord[slug] = price;
    const vol = volByIndex.get(info.index);
    if (vol) volDataRecord[slug] = vol;
  }

  return (
    <>
    {nodeError && (
      <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg px-4 py-3 mb-6 text-sm text-etcha-red">
        Unable to reach Ergo node — data may be unavailable. Try refreshing.
      </div>
    )}
    <WizardClient
      assets={assets}
      spotPrices={spotPricesRecord}
      volData={volDataRecord}
      reserves={reserves}
      sellOrders={sellOrders}
      currentHeight={currentHeight}
    />
    </>
  );
}
