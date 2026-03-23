"use client";

import { useState } from "react";
import { TradePanel } from "./TradePanel";

interface OptionChainProps {
  assetName: string;
  oracleIndex: number;
  spotPrice?: number;  // USD price from oracle, passed from server component
}

// Placeholder data structure for an option chain row
interface ChainRow {
  strike: number;
  expiry: string;
  callPremium?: number;
  callAvail?: number;
  callOI?: number;
  callIV?: number;
  putPremium?: number;
  putAvail?: number;
  putOI?: number;
  putIV?: number;
}

interface SelectedOption {
  strike: number;
  expiry: string;
  type: "call" | "put";
  premium: number;
  available: number;
}

export function OptionChain({ assetName, oracleIndex: _oracleIndex, spotPrice }: OptionChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>("all");
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);

  // In production, this data comes from the options store (on-chain reserves + sell orders)
  // For now, show the empty state with the correct structure
  const rows: ChainRow[] = [];
  const expiries: string[] = [];

  const handleRowClick = (row: ChainRow, type: "call" | "put") => {
    const premium = type === "call" ? row.callPremium : row.putPremium;
    const available = type === "call" ? row.callAvail : row.putAvail;
    if (premium === undefined || available === undefined) return;

    setSelectedOption({
      strike: row.strike,
      expiry: row.expiry,
      type,
      premium,
      available,
    });
  };

  return (
    <div className="space-y-4">
      {/* Spot Price Banner */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#94a3b8]">Spot Price:</span>
        <span className="text-[#eab308] font-mono text-lg">
          {spotPrice !== undefined && spotPrice > 0
            ? `$${spotPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: Math.max(2, spotPrice >= 100 ? 0 : spotPrice >= 1 ? 2 : 4),
              })}`
            : "Unavailable"}
        </span>
        {spotPrice !== undefined && spotPrice > 0 && (
          <span className="text-[#94a3b8]/60 text-xs">via oracle</span>
        )}
      </div>

      {/* Expiry Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedExpiry("all")}
          className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
            selectedExpiry === "all"
              ? "bg-[#3b82f6] text-white"
              : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
          }`}
        >
          All Expiries
        </button>
        {expiries.map((exp) => (
          <button
            key={exp}
            onClick={() => setSelectedExpiry(exp)}
            className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
              selectedExpiry === exp
                ? "bg-[#3b82f6] text-white"
                : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
            }`}
          >
            {exp}
          </button>
        ))}
      </div>

      {/* Chain Table */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {/* Calls */}
                <th className="text-left py-2 px-2 text-[#22c55e] font-medium">Premium</th>
                <th className="text-right py-2 px-2 text-[#22c55e] font-medium">Avail</th>
                <th className="text-right py-2 px-2 text-[#22c55e] font-medium">OI</th>
                <th className="text-right py-2 px-2 text-[#22c55e] font-medium">IV</th>
                {/* Strike */}
                <th className="text-center py-2 px-3 text-[#e2e8f0] font-bold bg-[#1e293b] rounded-t">
                  Strike
                </th>
                {/* Puts */}
                <th className="text-left py-2 px-2 text-[#ef4444] font-medium">Premium</th>
                <th className="text-right py-2 px-2 text-[#ef4444] font-medium">Avail</th>
                <th className="text-right py-2 px-2 text-[#ef4444] font-medium">IV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isATM = spotPrice !== undefined && spotPrice > 0 && Math.abs(row.strike - spotPrice) === Math.min(
                  ...rows.map((r) => Math.abs(r.strike - (spotPrice ?? 0)))
                );

                return (
                  <tr
                    key={i}
                    className={`border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors ${
                      isATM ? "bg-[#3b82f6]/5" : ""
                    }`}
                  >
                    {/* Call side - clickable */}
                    <td
                      className="py-2 px-2 text-[#eab308] font-mono cursor-pointer hover:bg-[#22c55e]/10 transition-colors"
                      onClick={() => handleRowClick(row, "call")}
                    >
                      {row.callPremium?.toFixed(4) ?? "\u2014"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callAvail ?? "\u2014"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callOI ?? "\u2014"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callIV ? `${row.callIV}%` : "\u2014"}
                    </td>
                    {/* Strike */}
                    <td className={`py-2 px-3 text-center font-mono font-bold bg-[#1e293b]/50 ${
                      isATM ? "text-[#3b82f6]" : "text-[#e2e8f0]"
                    }`}>
                      {isATM ? `*${row.strike}*` : row.strike}
                    </td>
                    {/* Put side - clickable */}
                    <td
                      className="py-2 px-2 text-[#eab308] font-mono cursor-pointer hover:bg-[#ef4444]/10 transition-colors"
                      onClick={() => handleRowClick(row, "put")}
                    >
                      {row.putPremium?.toFixed(4) ?? "\u2014"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.putAvail ?? "\u2014"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.putIV ? `${row.putIV}%` : "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#131a2a] border border-[#1e293b] rounded-lg">
          <p className="text-[#94a3b8] mb-2">No options available for {assetName}</p>
          <p className="text-sm text-[#94a3b8]/70">
            Be the first to write an option on this asset
          </p>
        </div>
      )}

      {/* Trade Panel slide-out */}
      {selectedOption && (
        <TradePanel
          assetName={assetName}
          spotPrice={spotPrice ?? 0}
          strike={selectedOption.strike}
          type={selectedOption.type}
          expiry={selectedOption.expiry}
          premium={selectedOption.premium}
          available={selectedOption.available}
          onClose={() => setSelectedOption(null)}
        />
      )}
    </div>
  );
}
