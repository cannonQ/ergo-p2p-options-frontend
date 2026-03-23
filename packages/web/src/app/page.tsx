import { AssetCard } from "./components/AssetCard";
import { ActivityFeed } from "./components/ActivityFeed";
import { fetchSpotPrices } from "@/lib/oracle-parser";
import { fetchAllAssetPriceData } from "@/lib/price-history";

const CATEGORIES = [
  {
    name: "Crypto",
    subtitle: "Physical Delivery via Rosen Bridge",
    assets: [
      { name: "ETH", slug: "eth", index: 0, badge: "rsETH" },
      { name: "BTC", slug: "btc", index: 1, badge: "rsBTC" },
      { name: "BNB", slug: "bnb", index: 2, badge: "rsBNB" },
      { name: "DOGE", slug: "doge", index: 3, badge: "rsDOGE" },
      { name: "ADA", slug: "ada", index: 4, badge: "rsADA" },
      { name: "ERG", slug: "erg", index: 17, badge: "Native" },
    ],
  },
  {
    name: "Crypto",
    subtitle: "Cash Settlement Only",
    assets: [
      { name: "HNS", slug: "hns", index: 5, badge: undefined },
      { name: "CKB", slug: "ckb", index: 6, badge: undefined },
      { name: "ATOM", slug: "atom", index: 7, badge: undefined },
      { name: "FIRO", slug: "firo", index: 19, badge: undefined },
    ],
  },
  {
    name: "Commodities & Metals",
    subtitle: "Cash Settlement",
    assets: [
      { name: "Gold", slug: "gold", index: 18, badge: "DexyGold" },
      { name: "Silver", slug: "silver", index: 11, badge: undefined },
      { name: "Copper", slug: "copper", index: 12, badge: undefined },
      { name: "Brent", slug: "brent", index: 13, badge: undefined },
      { name: "WTI", slug: "wti", index: 14, badge: undefined },
      { name: "NatGas", slug: "natgas", index: 15, badge: undefined },
    ],
  },
  {
    name: "Indices",
    subtitle: "Cash Settlement",
    assets: [
      { name: "S&P 500", slug: "spx", index: 9, badge: undefined },
      { name: "DJI", slug: "dji", index: 10, badge: undefined },
    ],
  },
];

export default async function HomePage() {
  const [spotPrices, priceData] = await Promise.all([
    fetchSpotPrices(),
    fetchAllAssetPriceData(),
  ]);

  return (
    <div className="space-y-8">
      {CATEGORIES.map((category, catIdx) => (
        <section key={`${category.name}-${catIdx}`}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <span className="text-sm text-[#94a3b8]">{category.subtitle}</span>
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
