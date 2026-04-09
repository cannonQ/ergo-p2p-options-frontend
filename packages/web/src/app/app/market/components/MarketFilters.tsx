"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedReserve } from "@/lib/reserve-scanner";
import { ASSET_SLUG } from "@/lib/asset-map";

interface MarketFiltersProps {
  reserves: ParsedReserve[];
  spotPrices: Record<number, number>;
  currentHeight: number;
}

// Time-based expiry buckets (blocks at ~2min each)
const EXPIRY_BUCKETS = [
  { label: "< 1h", maxBlocks: 30 },
  { label: "< 12h", maxBlocks: 360 },
  { label: "< 24h", maxBlocks: 720 },
  { label: "< 48h", maxBlocks: 1440 },
  { label: "> 48h", maxBlocks: Infinity },
  { label: "Expired", maxBlocks: -1 },
];

function formatBlocksToTime(blocks: number): string {
  if (blocks <= 0) return "expired";
  const minutes = blocks * 2;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function MarketFilters({ reserves, spotPrices, currentHeight }: MarketFiltersProps) {
  const router = useRouter();
  const [assetFilter, setAssetFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [itmOnly, setItmOnly] = useState(false);

  const assets = [...new Set(reserves.map((r) => r.assetName))].sort();

  const filtered = reserves.filter((r) => {
    if (assetFilter !== "all" && r.assetName !== assetFilter) return false;
    if (typeFilter !== "all" && r.optionType !== typeFilter) return false;
    if (expiryFilter !== "all") {
      const blocksToExpiry = r.maturityHeight - currentHeight;
      if (expiryFilter === "Expired") {
        if (blocksToExpiry > 0) return false;
      } else {
        if (blocksToExpiry <= 0) return false; // Don't show expired in time buckets
        const bucket = EXPIRY_BUCKETS.find(b => b.label === expiryFilter);
        if (bucket) {
          const prevMax = EXPIRY_BUCKETS[EXPIRY_BUCKETS.indexOf(bucket) - 1]?.maxBlocks ?? 0;
          if (blocksToExpiry < prevMax || blocksToExpiry >= bucket.maxBlocks) return false;
        }
      }
    }
    if (itmOnly) {
      const spot = spotPrices[r.oracleIndex];
      if (spot === undefined) return false;
      const isITM = r.optionType === "call" ? spot > r.strikePrice : spot < r.strikePrice;
      if (!isITM) return false;
    }
    return true;
  });

  return (
    <>
      {/* Current height */}
      <div className="text-xs text-[#9da5b8]">
        Chain height: <span className="font-mono text-[#e8eaf0]">{currentHeight.toLocaleString()}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className="bg-[#12151c] border border-[#1e2330] rounded-lg px-3 py-1.5 text-sm text-[#e8eaf0]"
        >
          <option value="all">All Assets</option>
          {assets.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#12151c] border border-[#1e2330] rounded-lg px-3 py-1.5 text-sm text-[#e8eaf0]"
        >
          <option value="all">All Types</option>
          <option value="call">Calls</option>
          <option value="put">Puts</option>
        </select>
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="bg-[#12151c] border border-[#1e2330] rounded-lg px-3 py-1.5 text-sm text-[#e8eaf0]"
        >
          <option value="all">All Expiries</option>
          {EXPIRY_BUCKETS.map((b) => (
            <option key={b.label} value={b.label}>{b.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#9da5b8] cursor-pointer">
          <input
            type="checkbox"
            checked={itmOnly}
            onChange={(e) => setItmOnly(e.target.checked)}
            className="w-4 h-4 rounded border-[#1e2330] bg-[#0a0c10] text-[#c87941]"
          />
          ITM only
        </label>
      </div>

      {/* Table */}
      <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2330]">
              <th className="text-left py-3 px-4 text-[#9da5b8] font-medium">Asset</th>
              <th className="text-left py-3 px-4 text-[#9da5b8] font-medium">Type</th>
              <th className="text-right py-3 px-4 text-[#9da5b8] font-medium">Strike</th>
              <th className="text-right py-3 px-4 text-[#9da5b8] font-medium">Spot</th>
              <th className="text-right py-3 px-4 text-[#9da5b8] font-medium">Expiry</th>
              <th className="text-left py-3 px-4 text-[#9da5b8] font-medium hidden md:table-cell">Settlement</th>
              <th className="text-left py-3 px-4 text-[#9da5b8] font-medium hidden md:table-cell">Style</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const spot = spotPrices[r.oracleIndex];
                const blocksToExpiry = r.maturityHeight - currentHeight;
                const isITM = r.optionType === "call"
                  ? spot !== undefined && spot > r.strikePrice
                  : spot !== undefined && spot < r.strikePrice;

                return (
                  <tr
                    key={r.boxId}
                    onClick={() => {
                      const slug = ASSET_SLUG[r.assetName];
                      if (slug) router.push(`/app/trade/${slug}`);
                    }}
                    className={`border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30 cursor-pointer ${
                      isITM ? "bg-[#34d399]/5" : ""
                    }`}
                  >
                    <td className="py-2 px-4 text-[#e8eaf0] font-medium">{r.assetName}</td>
                    <td className="py-2 px-4">
                      <span className={r.optionType === "call" ? "text-[#34d399]" : "text-[#f87171]"}>
                        {r.optionType === "call" ? "Call" : "Put"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
                      ${r.strikePrice >= 100 ? r.strikePrice.toFixed(0) : r.strikePrice.toFixed(r.strikePrice >= 1 ? 2 : 4)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-[#9da5b8]">
                      {spot !== undefined ? `$${spot >= 100 ? spot.toFixed(0) : spot.toFixed(spot >= 1 ? 2 : 4)}` : "—"}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="text-xs space-y-0.5">
                        {blocksToExpiry > 0 ? (
                          <>
                            <div className="font-mono text-[#e8eaf0]">
                              {formatBlocksToTime(blocksToExpiry)} to maturity
                            </div>
                          </>
                        ) : blocksToExpiry > -720 ? (
                          <>
                            <div className="font-mono text-[#e09a5f]">
                              Exercise window: {formatBlocksToTime(720 + blocksToExpiry)}
                            </div>
                            <div className="text-[#34d399] font-semibold">Exercisable</div>
                          </>
                        ) : (
                          <div className="font-mono text-[#f87171]">Expired</div>
                        )}
                        <div className="text-[#9da5b8]">
                          blk {r.maturityHeight.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-[#9da5b8] capitalize hidden md:table-cell">{r.settlement}</td>
                    <td className="py-2 px-4 text-[#9da5b8] capitalize hidden md:table-cell">{r.style}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#9da5b8]">
                  {reserves.length === 0
                    ? "No options currently listed. Be the first to write one."
                    : "No options match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
