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

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";

async function fetchCurrentHeight(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/info`, { cache: "no-store" });
    if (res.ok) {
      const info = await res.json();
      return info.fullHeight ?? 0;
    }
  } catch { /* ignore */ }
  return 0;
}

export default async function WizardPage() {
  // Single parallel fetch — fetchVols() fetches companion box once for all indices
  const [spotPrices, volByIndex, priceData, reserves, sellOrders, currentHeight] = await Promise.all([
    fetchSpotPrices(),
    fetchVols().catch(() => new Map<number, number>()),
    fetchAllAssetPriceData().catch(() => new Map()),
    scanReserves().catch(() => []),
    scanSellOrders().catch(() => []),
    fetchCurrentHeight(),
  ]);

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
    <WizardClient
      assets={assets}
      spotPrices={spotPricesRecord}
      volData={volDataRecord}
      reserves={reserves}
      sellOrders={sellOrders}
      currentHeight={currentHeight}
    />
  );
}
