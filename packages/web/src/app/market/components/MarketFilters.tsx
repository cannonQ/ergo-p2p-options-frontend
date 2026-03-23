"use client";

import { useState } from "react";
import type { ParsedReserve } from "@/lib/reserve-scanner";
import Link from "next/link";

interface MarketFiltersProps {
  reserves: ParsedReserve[];
  spotPrices: Record<number, number>;
}

export function MarketFilters({ reserves, spotPrices }: MarketFiltersProps) {
  const [assetFilter, setAssetFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [itmOnly, setItmOnly] = useState(false);

  const assets = [...new Set(reserves.map((r) => r.assetName))].sort();

  // Group expiries by approximate date (round to nearest week)
  const expiries = [...new Set(reserves.map((r) => {
    const blocksFromNow = r.maturityHeight; // Will compare against current height
    return r.maturityHeight.toString();
  }))].sort();

  const filtered = reserves.filter((r) => {
    if (assetFilter !== "all" && r.assetName !== assetFilter) return false;
    if (typeFilter !== "all" && r.optionType !== typeFilter) return false;
    if (expiryFilter !== "all" && r.maturityHeight.toString() !== expiryFilter) return false;
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
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]"
        >
          <option value="all">All Assets</option>
          {assets.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]"
        >
          <option value="all">All Types</option>
          <option value="call">Calls</option>
          <option value="put">Puts</option>
        </select>
        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]"
        >
          <option value="all">All Expiries</option>
          {expiries.map((exp) => (
            <option key={exp} value={exp}>Block {exp}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#94a3b8] cursor-pointer">
          <input
            type="checkbox"
            checked={itmOnly}
            onChange={(e) => setItmOnly(e.target.checked)}
            className="w-4 h-4 rounded border-[#1e293b] bg-[#0a0e17] text-[#3b82f6]"
          />
          ITM only
        </label>
      </div>

      {/* Table */}
      <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Spot</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry (block)</th>
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Settlement</th>
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Style</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const spot = spotPrices[r.oracleIndex];
                const isITM = r.optionType === "call"
                  ? spot !== undefined && spot > r.strikePrice
                  : spot !== undefined && spot < r.strikePrice;

                return (
                  <tr
                    key={r.boxId}
                    className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 cursor-pointer"
                  >
                    <td className="py-2 px-4 text-[#e2e8f0] font-medium">{r.assetName}</td>
                    <td className="py-2 px-4">
                      <span className={r.optionType === "call" ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        {r.optionType === "call" ? "Call" : "Put"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-[#eab308]">
                      ${r.strikePrice >= 100 ? r.strikePrice.toFixed(0) : r.strikePrice.toFixed(r.strikePrice >= 1 ? 2 : 4)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-[#94a3b8]">
                      {spot !== undefined ? `$${spot >= 100 ? spot.toFixed(0) : spot.toFixed(spot >= 1 ? 2 : 4)}` : "—"}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-[#94a3b8]">
                      {r.maturityHeight.toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-[#94a3b8] capitalize">{r.settlement}</td>
                    <td className="py-2 px-4 text-[#94a3b8] capitalize">{r.style}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#94a3b8]">
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
