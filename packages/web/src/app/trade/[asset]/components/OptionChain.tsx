"use client";

import { useState } from "react";

interface OptionChainProps {
  assetName: string;
  oracleIndex: number;
}

// Placeholder data structure for an option chain row
interface ChainRow {
  strike: number;
  callPremium?: number;
  callAvail?: number;
  callOI?: number;
  callIV?: number;
  putPremium?: number;
  putAvail?: number;
  putOI?: number;
  putIV?: number;
}

export function OptionChain({ assetName, oracleIndex: _oracleIndex }: OptionChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>("all");

  // In production, this data comes from the options store (on-chain reserves + sell orders)
  // For now, show the empty state with the correct structure
  const spotPrice = 0; // Will come from oracle store
  const rows: ChainRow[] = [];
  const expiries: string[] = [];

  return (
    <div className="space-y-4">
      {/* Spot Price Banner */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#94a3b8]">Current:</span>
        <span className="text-[#eab308] font-mono text-lg">
          {spotPrice > 0
            ? `$${spotPrice.toLocaleString()}`
            : "Loading..."}
        </span>
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
                const isATM = Math.abs(row.strike - spotPrice) === Math.min(
                  ...rows.map((r) => Math.abs(r.strike - spotPrice))
                );

                return (
                  <tr
                    key={i}
                    className={`border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 cursor-pointer transition-colors ${
                      isATM ? "bg-[#3b82f6]/5" : ""
                    }`}
                  >
                    <td className="py-2 px-2 text-[#eab308] font-mono">
                      {row.callPremium?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callAvail ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callOI ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.callIV ? `${row.callIV}%` : "—"}
                    </td>
                    <td className={`py-2 px-3 text-center font-mono font-bold bg-[#1e293b]/50 ${
                      isATM ? "text-[#3b82f6]" : "text-[#e2e8f0]"
                    }`}>
                      {isATM ? `*${row.strike}*` : row.strike}
                    </td>
                    <td className="py-2 px-2 text-[#eab308] font-mono">
                      {row.putPremium?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.putAvail ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-right text-[#94a3b8]">
                      {row.putIV ? `${row.putIV}%` : "—"}
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
    </div>
  );
}
