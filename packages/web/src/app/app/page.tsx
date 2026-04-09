import type { Metadata } from "next";
import { AssetCard } from "../components/AssetCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { fetchSpotPrices } from "@/lib/oracle-parser";
import { fetchAllAssetPriceData } from "@/lib/price-history";
import { scanReserves } from "@/lib/reserve-scanner";
import { ASSET_CATEGORIES } from "@/lib/asset-map";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [spotPrices, priceData, allReserves] = await Promise.all([
    fetchSpotPrices(),
    fetchAllAssetPriceData(),
    scanReserves().catch(() => []),
  ]);

  const optionCounts = new Map<number, number>();
  for (const r of allReserves) {
    if (r.state === "RESERVE") {
      optionCounts.set(r.oracleIndex, (optionCounts.get(r.oracleIndex) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-8">
      {ASSET_CATEGORIES.map((category, catIdx) => (
        <section key={`${category.name}-${catIdx}`}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <span className="text-sm text-[#9da5b8]">{category.subtitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {category.assets.map((asset) => {
              const history = priceData.get(asset.index);
              return (
                <AssetCard
                  key={asset.index}
                  name={asset.name}
                  slug={asset.slug}
                  price={spotPrices.get(asset.index)}
                  badge={asset.badge}
                  sparkline={history?.sparkline}
                  change24h={history?.change24h}
                  optionCount={optionCounts.get(asset.index) ?? 0}
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Live Activity Feed */}
      <section>
        <ActivityFeed />
      </section>
    </div>
  );
}
