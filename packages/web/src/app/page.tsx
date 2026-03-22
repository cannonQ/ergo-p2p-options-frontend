import { AssetCard } from "./components/AssetCard";

const CATEGORIES = [
  {
    name: "Crypto",
    subtitle: "Physical Delivery Available",
    assets: [
      { name: "ETH", slug: "eth", index: 0, physical: true },
      { name: "BTC", slug: "btc", index: 1, physical: true },
      { name: "BNB", slug: "bnb", index: 2, physical: true },
      { name: "DOGE", slug: "doge", index: 3, physical: true },
      { name: "ADA", slug: "ada", index: 4, physical: true },
      { name: "ERG", slug: "erg", index: 17, physical: true },
    ],
  },
  {
    name: "Commodities & Metals",
    subtitle: "Cash Settlement",
    assets: [
      { name: "Gold", slug: "gold", index: 18, physical: true },
      { name: "Brent", slug: "brent", index: 13, physical: false },
      { name: "WTI", slug: "wti", index: 14, physical: false },
      { name: "NatGas", slug: "natgas", index: 15, physical: false },
      { name: "Lithium", slug: "lithium", index: 16, physical: false },
    ],
  },
  {
    name: "Indices",
    subtitle: "Cash Settlement",
    assets: [
      { name: "S&P 500", slug: "spx", index: 9, physical: false },
      { name: "DJI", slug: "dji", index: 10, physical: false },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">P2P Options</h1>
        <p className="text-[#94a3b8]">
          Decentralized options trading on Ergo. Pick an asset to see available options.
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <section key={category.name}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <span className="text-sm text-[#94a3b8]">{category.subtitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {category.assets.map((asset) => (
              <AssetCard
                key={asset.index}
                name={asset.name}
                slug={asset.slug}
                hasPhysical={asset.physical}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
