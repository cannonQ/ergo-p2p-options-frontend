"use client";

import { useState, useMemo } from "react";
import { TradePanel } from "./TradePanel";

interface OptionChainProps {
  assetName: string;
  oracleIndex: number;
  spotPrice?: number;
  hasPhysical?: boolean;
}

interface ChainRow {
  strike: number;
  expiry: string;
  callPremium?: number;
  callAvail: number;
  callOI: number;
  callIV?: number;
  putPremium?: number;
  putAvail: number;
  putOI: number;
  putIV?: number;
}

interface SelectedOption {
  strike: number;
  expiry: string;
  type: "call" | "put";
  premium: number;
  available: number;
}

/**
 * Generate strike prices centered around spot price.
 * Picks a sensible increment based on price magnitude.
 */
function generateStrikes(spot: number, count: number = 7): number[] {
  if (spot <= 0) return [];

  // Pick increment: ~2-3% of spot, rounded to a "nice" number
  // BTC $68K → $1000, Gold $4600 → $100, ADA $0.25 → $0.01
  const rawStep = spot * 0.02; // 2% of spot
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  // Round to 1, 2, or 5 × magnitude (standard financial increments)
  const normalized = rawStep / magnitude;
  let step: number;
  if (normalized < 1.5) step = magnitude;
  else if (normalized < 3.5) step = 2 * magnitude;
  else if (normalized < 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;

  // Center around spot
  const center = Math.round(spot / step) * step;
  const half = Math.floor(count / 2);
  const strikes: number[] = [];

  for (let i = -half; i <= half; i++) {
    const s = center + i * step;
    if (s > 0) strikes.push(Number(s.toFixed(6)));
  }

  return strikes;
}

function formatStrike(strike: number): string {
  if (strike >= 1000) return `$${strike.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (strike >= 1) return `$${strike.toFixed(2)}`;
  if (strike >= 0.01) return `$${strike.toFixed(4)}`;
  return `$${strike.toFixed(6)}`;
}

export function OptionChain({ assetName, oracleIndex: _oracleIndex, spotPrice, hasPhysical }: OptionChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>("all");
  const [settlement, setSettlement] = useState<"all" | "physical" | "cash">(hasPhysical ? "all" : "cash");
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);

  // Generate strike rows from spot price (even with 0 options on-chain)
  // In production, on-chain reserves + sell orders will populate premium/avail/OI
  const rows: ChainRow[] = useMemo(() => {
    if (!spotPrice || spotPrice <= 0) return [];

    const strikes = generateStrikes(spotPrice);
    return strikes.map((strike) => ({
      strike,
      expiry: "—",
      callAvail: 0,
      callOI: 0,
      putAvail: 0,
      putOI: 0,
    }));
  }, [spotPrice]);

  const expiries: string[] = []; // Will be populated from on-chain data

  const handleRowClick = (row: ChainRow, type: "call" | "put") => {
    setSelectedOption({
      strike: row.strike,
      expiry: row.expiry,
      type,
      premium: type === "call" ? (row.callPremium ?? 0) : (row.putPremium ?? 0),
      available: type === "call" ? row.callAvail : row.putAvail,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#94a3b8]">Spot:</span>
          <span className="text-[#eab308] font-mono text-lg">
            {spotPrice && spotPrice > 0
              ? formatStrike(spotPrice)
              : "Unavailable"}
          </span>
          {spotPrice && spotPrice > 0 && (
            <span className="text-[#94a3b8]/60 text-xs">via oracle</span>
          )}
        </div>
      </div>

      {/* Settlement Filter */}
      <div className="flex gap-2">
        {(["all", "physical", "cash"] as const).map((s) => {
          const disabled = s === "physical" && !hasPhysical;
          return (
            <button
              key={s}
              onClick={() => !disabled && setSettlement(s)}
              disabled={disabled}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                settlement === s
                  ? "bg-[#3b82f6] text-white"
                  : disabled
                  ? "bg-[#1e293b]/50 text-[#94a3b8]/30 cursor-not-allowed"
                  : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
              }`}
            >
              {s === "all" ? "All" : s === "physical" ? "Physical" : "Cash"}
            </button>
          );
        })}
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

      {/* Chain Table — always show if we have a spot price */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto bg-[#131a2a] border border-[#1e293b] rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th colSpan={4} className="py-2 px-2 text-center text-[#22c55e] font-semibold text-xs uppercase tracking-wider">
                  Calls
                </th>
                <th className="py-2 px-3 text-center text-[#e2e8f0] font-bold bg-[#1e293b]">
                  Strike
                </th>
                <th colSpan={4} className="py-2 px-2 text-center text-[#ef4444] font-semibold text-xs uppercase tracking-wider">
                  Puts
                </th>
              </tr>
              <tr className="border-b border-[#1e293b]/50">
                <th className="text-left py-1 px-2 text-[#22c55e]/70 font-normal text-xs">Premium</th>
                <th className="text-right py-1 px-2 text-[#22c55e]/70 font-normal text-xs">Avail</th>
                <th className="text-right py-1 px-2 text-[#22c55e]/70 font-normal text-xs">OI</th>
                <th className="text-right py-1 px-2 text-[#22c55e]/70 font-normal text-xs">IV</th>
                <th className="bg-[#1e293b]"></th>
                <th className="text-left py-1 px-2 text-[#ef4444]/70 font-normal text-xs">Premium</th>
                <th className="text-right py-1 px-2 text-[#ef4444]/70 font-normal text-xs">Avail</th>
                <th className="text-right py-1 px-2 text-[#ef4444]/70 font-normal text-xs">OI</th>
                <th className="text-right py-1 px-2 text-[#ef4444]/70 font-normal text-xs">IV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isATM = spotPrice !== undefined && spotPrice > 0 &&
                  Math.abs(row.strike - spotPrice) === Math.min(
                    ...rows.map((r) => Math.abs(r.strike - (spotPrice ?? 0)))
                  );
                const isITMCall = spotPrice !== undefined && row.strike < spotPrice;
                const isITMPut = spotPrice !== undefined && row.strike > spotPrice;

                return (
                  <tr
                    key={i}
                    className={`border-b border-[#1e293b]/30 hover:bg-[#1e293b]/30 transition-colors ${
                      isATM ? "bg-[#3b82f6]/8" : ""
                    }`}
                  >
                    {/* Call side */}
                    <td
                      className={`py-2 px-2 font-mono cursor-pointer hover:bg-[#22c55e]/10 transition-colors ${
                        row.callPremium ? "text-[#eab308]" : "text-[#94a3b8]/40"
                      } ${isITMCall ? "bg-[#22c55e]/5" : ""}`}
                      onClick={() => handleRowClick(row, "call")}
                    >
                      {row.callPremium?.toFixed(4) ?? "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.callAvail > 0 ? "text-[#94a3b8]" : "text-[#94a3b8]/30"} ${isITMCall ? "bg-[#22c55e]/5" : ""}`}>
                      {row.callAvail}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.callOI > 0 ? "text-[#94a3b8]" : "text-[#94a3b8]/30"} ${isITMCall ? "bg-[#22c55e]/5" : ""}`}>
                      {row.callOI}
                    </td>
                    <td className={`py-2 px-2 text-right text-[#94a3b8]/30 ${isITMCall ? "bg-[#22c55e]/5" : ""}`}>
                      {row.callIV ? `${row.callIV}%` : "—"}
                    </td>
                    {/* Strike */}
                    <td className={`py-2 px-3 text-center font-mono font-bold bg-[#1e293b]/50 ${
                      isATM ? "text-[#3b82f6]" : "text-[#e2e8f0]"
                    }`}>
                      {formatStrike(row.strike)}
                      {isATM && <span className="ml-1 text-[10px] text-[#3b82f6]">ATM</span>}
                    </td>
                    {/* Put side */}
                    <td
                      className={`py-2 px-2 font-mono cursor-pointer hover:bg-[#ef4444]/10 transition-colors ${
                        row.putPremium ? "text-[#eab308]" : "text-[#94a3b8]/40"
                      } ${isITMPut ? "bg-[#ef4444]/5" : ""}`}
                      onClick={() => handleRowClick(row, "put")}
                    >
                      {row.putPremium?.toFixed(4) ?? "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.putAvail > 0 ? "text-[#94a3b8]" : "text-[#94a3b8]/30"} ${isITMPut ? "bg-[#ef4444]/5" : ""}`}>
                      {row.putAvail}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.putOI > 0 ? "text-[#94a3b8]" : "text-[#94a3b8]/30"} ${isITMPut ? "bg-[#ef4444]/5" : ""}`}>
                      {row.putOI}
                    </td>
                    <td className={`py-2 px-2 text-right text-[#94a3b8]/30 ${isITMPut ? "bg-[#ef4444]/5" : ""}`}>
                      {row.putIV ? `${row.putIV}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b] text-sm text-[#94a3b8]">
            <span>Click any row to trade</span>
            <span className="text-xs">
              {rows.reduce((a, r) => a + r.callAvail + r.putAvail, 0) === 0
                ? "No options listed yet — be the first to write"
                : `${rows.reduce((a, r) => a + r.callAvail + r.putAvail, 0)} contracts available`}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#131a2a] border border-[#1e293b] rounded-lg">
          <p className="text-[#94a3b8] mb-2">Oracle price unavailable for {assetName}</p>
          <p className="text-sm text-[#94a3b8]/70">
            Cannot generate option chain without a spot price
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
