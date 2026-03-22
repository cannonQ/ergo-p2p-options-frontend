"use client";

import Link from "next/link";

interface AssetCardProps {
  name: string;
  slug: string;
  price?: number;       // USD price (from oracle, human-readable)
  optionCount?: number;  // Number of active options
  hasPhysical?: boolean; // Physical delivery available
}

export function AssetCard({
  name,
  slug,
  price,
  optionCount = 0,
  hasPhysical = false,
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
        {hasPhysical && (
          <span className="text-[10px] px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded">
            Physical
          </span>
        )}
      </div>

      <div className="text-xl font-mono text-[#eab308] mb-2">
        {price !== undefined && price > 0
          ? `$${price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: Math.max(2, price >= 100 ? 0 : price >= 1 ? 2 : 4),
            })}`
          : "—"}
      </div>

      <div className="text-sm text-[#94a3b8]">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>
    </Link>
  );
}
