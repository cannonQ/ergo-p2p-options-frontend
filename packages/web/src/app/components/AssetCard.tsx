"use client";

import Link from "next/link";

interface AssetCardProps {
  name: string;
  slug: string;
  price?: number;       // USD price (from oracle, human-readable)
  optionCount?: number;  // Number of active options
  badge?: string;       // e.g. "rsETH", "DexyGold", "Native"
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

export function AssetCard({
  name,
  slug,
  price,
  optionCount = 0,
  badge,
}: AssetCardProps) {
  return (
    <Link
      href={`/trade/${slug}`}
      className="block p-4 bg-[#131a2a] border border-[#1e293b] rounded-lg hover:border-[#3b82f6] transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-[#e2e8f0] group-hover:text-[#3b82f6] transition-colors">
          {name}
        </span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded">
            {badge}
          </span>
        )}
      </div>

      <div className="text-xl font-mono text-[#eab308] mb-2">
        {price !== undefined && price > 0 ? `$${formatPrice(price)}` : "—"}
      </div>

      <div className="text-sm text-[#94a3b8]">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
    </Link>
  );
}
