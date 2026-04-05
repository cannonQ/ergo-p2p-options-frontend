"use client";

import { useState, useMemo } from "react";
import { oracleVolToDecimal } from "@ergo-options/core";
import { TradePanel } from "./TradePanel";
import type { ParsedReserve } from "@/lib/reserve-scanner";
import type { ParsedSellOrder } from "@/lib/sell-order-scanner";

interface OptionChainProps {
  assetName: string;
  assetUnit?: string;
  oracleIndex: number;
  spotPrice?: number;
  oracleVol?: number; // bps from companion R5
  hasPhysical?: boolean;
  reserves?: ParsedReserve[];
  sellOrders?: ParsedSellOrder[];
  /** Map of optionTokenId → { strikePrice, optionType, contractSize } for matching sell orders to strikes */
  tokenToReserve?: Record<string, { strikePrice: number; optionType: "call" | "put"; contractSize?: number }>;
}

interface ChainRow {
  strike: number;
  expiry: string;
  callPremium?: number;
  callAvail: number;
  callOI: number;
  callIV?: number;
  callVolume: number;
  callSellOrders: ParsedSellOrder[];
  putPremium?: number;
  putAvail: number;
  putOI: number;
  putIV?: number;
  putVolume: number;
  putSellOrders: ParsedSellOrder[];
}

interface SelectedOption {
  strike: number;
  expiry: string;
  type: "call" | "put";
  premium: number;
  available: number;
  sellOrder?: ParsedSellOrder;
  contractSize?: number;
}

/**
 * Generate strike prices centered around spot price.
 * Picks a sensible increment based on price magnitude.
 */
function generateStrikes(spot: number, count: number = 7): number[] {
  if (spot <= 0) return [];

  const rawStep = spot * 0.02;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let step: number;
  if (normalized < 1.5) step = magnitude;
  else if (normalized < 3.5) step = 2 * magnitude;
  else if (normalized < 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;

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

/**
 * Compute approximate IV for a strike using oracle realized vol + smile skew.
 */
function computeSmileIV(strike: number, spot: number, baseVol: number): number {
  const moneyness = Math.abs(Math.log(strike / spot));
  const skew = moneyness * 0.3;
  return baseVol * (1 + skew);
}

function VolumeBar({
  volume,
  maxVolume,
  color,
}: {
  volume: number;
  maxVolume: number;
  color: string;
}) {
  const widthPx = maxVolume > 0 ? Math.round((volume / maxVolume) * 60) : 0;
  return (
    <div className="flex items-center h-full">
      <div
        className="rounded"
        style={{
          width: `${widthPx}px`,
          height: "8px",
          backgroundColor: color,
          minWidth: volume > 0 ? "2px" : "0px",
        }}
      />
    </div>
  );
}

/**
 * Convert sell order premium from raw stablecoin units to USD.
 * USE: 1000 raw = $1.  SigUSD: 100 raw = $1.
 */
function premiumToUsd(premiumPerToken: string, paymentTokenId: string): number {
  const raw = BigInt(premiumPerToken);
  // USE token ID starts with "a55b"
  const isUSE = paymentTokenId.startsWith("a55b");
  const divisor = isUSE ? 1000 : 100;
  return Number(raw) / divisor;
}

export function OptionChain({
  assetName,
  assetUnit,
  oracleIndex: _oracleIndex,
  spotPrice,
  oracleVol,
  hasPhysical,
  reserves = [],
  sellOrders = [],
  tokenToReserve = {},
}: OptionChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>("all");
  const [settlement, setSettlement] = useState<"all" | "physical" | "cash">(hasPhysical ? "all" : "cash");
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);

  const baseVol = oracleVol ? oracleVolToDecimal(oracleVol) : undefined;

  // Build OI lookup from on-chain reserves
  const oiByStrikeType = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reserves) {
      const key = `${r.optionType}:${r.strikePrice}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [reserves]);

  // Build sell order aggregation by strike+type
  // For each strike+type: cheapest premium + total available + list of orders (sorted by price)
  const sellByStrikeType = useMemo(() => {
    const map = new Map<string, { cheapestPremium: number; totalAvail: number; orders: ParsedSellOrder[]; contractSize?: number }>();

    for (const so of sellOrders) {
      const reserveInfo = tokenToReserve[so.optionTokenId];
      if (!reserveInfo) continue;

      const key = `${reserveInfo.optionType}:${reserveInfo.strikePrice}`;
      const premiumUsd = premiumToUsd(so.premiumPerToken, so.paymentTokenId);
      const tokenCount = Number(BigInt(so.tokenAmount));

      const existing = map.get(key);
      if (existing) {
        existing.totalAvail += tokenCount;
        existing.orders.push(so);
        if (premiumUsd < existing.cheapestPremium) {
          existing.cheapestPremium = premiumUsd;
        }
      } else {
        map.set(key, {
          cheapestPremium: premiumUsd,
          totalAvail: tokenCount,
          orders: [so],
          contractSize: reserveInfo.contractSize,
        });
      }
    }

    // Sort orders within each group by premium (cheapest first)
    for (const group of map.values()) {
      group.orders.sort((a, b) => {
        const pa = premiumToUsd(a.premiumPerToken, a.paymentTokenId);
        const pb = premiumToUsd(b.premiumPerToken, b.paymentTokenId);
        return pa - pb;
      });
    }

    return map;
  }, [sellOrders, tokenToReserve]);

  // Collect on-chain strike prices
  const onChainStrikes = useMemo(() => {
    return [...new Set(reserves.map((r) => r.strikePrice))];
  }, [reserves]);

  // Generate strike rows
  const rows: ChainRow[] = useMemo(() => {
    if (!spotPrice || spotPrice <= 0) return [];

    const strikes = generateStrikes(spotPrice);
    for (const s of onChainStrikes) {
      if (!strikes.includes(s)) strikes.push(s);
    }
    strikes.sort((a, b) => a - b);

    return strikes.map((strike) => {
      const iv = baseVol && spotPrice > 0
        ? computeSmileIV(strike, spotPrice, baseVol)
        : undefined;

      const callOI = oiByStrikeType.get(`call:${strike}`) ?? 0;
      const putOI = oiByStrikeType.get(`put:${strike}`) ?? 0;

      const callSell = sellByStrikeType.get(`call:${strike}`);
      const putSell = sellByStrikeType.get(`put:${strike}`);

      // Find expiry from on-chain reserve at this strike
      const reserveAtStrike = reserves.find(r => r.strikePrice === strike);
      const expiryStr = reserveAtStrike
        ? `blk ${reserveAtStrike.maturityHeight}`
        : "—";

      return {
        strike,
        expiry: expiryStr,
        callPremium: callSell?.cheapestPremium,
        callAvail: callSell?.totalAvail ?? 0,
        callOI,
        callIV: iv ? Number((iv * 100).toFixed(1)) : undefined,
        callVolume: 0,
        callSellOrders: callSell?.orders ?? [],
        putPremium: putSell?.cheapestPremium,
        putAvail: putSell?.totalAvail ?? 0,
        putOI,
        putIV: iv ? Number((iv * 100).toFixed(1)) : undefined,
        putVolume: 0,
        putSellOrders: putSell?.orders ?? [],
      };
    });
  }, [spotPrice, baseVol, onChainStrikes, oiByStrikeType, sellByStrikeType]);

  const maxVolume = useMemo(() => {
    return Math.max(1, ...rows.map((r) => Math.max(r.callVolume, r.putVolume)));
  }, [rows]);

  const expiries: string[] = [];

  const handleRowClick = (row: ChainRow, type: "call" | "put") => {
    const orders = type === "call" ? row.callSellOrders : row.putSellOrders;
    const cheapestOrder = orders.length > 0 ? orders[0] : undefined;
    const premium = type === "call" ? (row.callPremium ?? 0) : (row.putPremium ?? 0);
    const available = type === "call" ? row.callAvail : row.putAvail;
    // Get contractSize from the sell order group for this strike+type
    const groupKey = `${type}:${row.strike}`;
    const group = sellByStrikeType.get(groupKey);

    setSelectedOption({
      strike: row.strike,
      expiry: row.expiry,
      type,
      premium,
      available,
      sellOrder: cheapestOrder,
      contractSize: group?.contractSize,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#8891a5]">Spot:</span>
          <span className="text-[#e09a5f] font-mono text-lg">
            {spotPrice && spotPrice > 0
              ? formatStrike(spotPrice)
              : "Unavailable"}
          </span>
          {spotPrice && spotPrice > 0 && (
            <span className="text-[#8891a5]/60 text-xs">via oracle</span>
          )}
          {baseVol !== undefined && (
            <>
              <span className="text-[#8891a5] ml-2">RV:</span>
              <span className="text-[#a78bfa] font-mono">
                {(baseVol * 100).toFixed(1)}%
              </span>
            </>
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
                  ? "bg-[#c87941] text-white"
                  : disabled
                  ? "bg-[#1e2330]/50 text-[#8891a5]/30 cursor-not-allowed"
                  : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
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
              ? "bg-[#c87941] text-white"
              : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
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
                ? "bg-[#c87941] text-white"
                : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
            }`}
          >
            {exp}
          </button>
        ))}
      </div>

      {/* Chain Table */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto bg-[#12151c] border border-[#1e2330] rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2330]">
                <th colSpan={5} className="py-2 px-2 text-center text-[#34d399] font-semibold text-xs uppercase tracking-wider">
                  Calls
                </th>
                <th className="py-2 px-3 text-center text-[#e8eaf0] font-bold bg-[#1e2330]">
                  Strike
                </th>
                <th colSpan={5} className="py-2 px-2 text-center text-[#f87171] font-semibold text-xs uppercase tracking-wider">
                  Puts
                </th>
              </tr>
              <tr className="border-b border-[#1e2330]/50">
                <th className="text-center py-1 px-2 text-[#34d399]/70 font-normal text-xs w-[68px]">Vol</th>
                <th className="text-left py-1 px-2 text-[#34d399]/70 font-normal text-xs">Premium</th>
                <th className="text-right py-1 px-2 text-[#34d399]/70 font-normal text-xs">Avail</th>
                <th className="text-right py-1 px-2 text-[#34d399]/70 font-normal text-xs">Open</th>
                <th className="text-right py-1 px-2 text-[#34d399]/70 font-normal text-xs">IV</th>
                <th className="bg-[#1e2330]"></th>
                <th className="text-left py-1 px-2 text-[#f87171]/70 font-normal text-xs">IV</th>
                <th className="text-right py-1 px-2 text-[#f87171]/70 font-normal text-xs">Open</th>
                <th className="text-right py-1 px-2 text-[#f87171]/70 font-normal text-xs">Avail</th>
                <th className="text-left py-1 px-2 text-[#f87171]/70 font-normal text-xs">Premium</th>
                <th className="text-center py-1 px-2 text-[#f87171]/70 font-normal text-xs w-[68px]">Vol</th>
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

                const callBarColor = isATM ? "#c87941" : "#34d399";
                const putBarColor = isATM ? "#c87941" : "#f87171";

                return (
                  <tr
                    key={i}
                    className={`border-b border-[#1e2330]/30 hover:bg-[#1e2330]/30 transition-colors ${
                      isATM ? "bg-[#c87941]/8" : ""
                    }`}
                  >
                    {/* Call volume bar */}
                    <td className={`py-2 px-2 ${isITMCall ? "bg-[#34d399]/5" : ""}`}>
                      <div className="flex justify-end">
                        <VolumeBar volume={row.callVolume} maxVolume={maxVolume} color={callBarColor} />
                      </div>
                    </td>
                    {/* Call side */}
                    <td
                      className={`py-2 px-2 font-mono cursor-pointer hover:bg-[#34d399]/10 transition-colors ${
                        row.callPremium ? "text-[#e09a5f]" : "text-[#8891a5]/40"
                      } ${isITMCall ? "bg-[#34d399]/5" : ""}`}
                      onClick={() => handleRowClick(row, "call")}
                    >
                      {row.callPremium?.toFixed(4) ?? "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.callAvail > 0 ? "text-[#8891a5]" : "text-[#8891a5]/30"} ${isITMCall ? "bg-[#34d399]/5" : ""}`}>
                      {row.callAvail}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.callOI > 0 ? "text-[#8891a5]" : "text-[#8891a5]/30"} ${isITMCall ? "bg-[#34d399]/5" : ""}`}>
                      {row.callOI}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.callIV ? "text-[#a78bfa]" : "text-[#8891a5]/30"} ${isITMCall ? "bg-[#34d399]/5" : ""}`}>
                      {row.callIV ? `${row.callIV}%` : "—"}
                    </td>
                    {/* Strike */}
                    <td className={`py-2 px-3 text-center font-mono font-bold bg-[#1e2330]/50 ${
                      isATM ? "text-[#c87941]" : "text-[#e8eaf0]"
                    }`}>
                      {formatStrike(row.strike)}
                      {isATM && <span className="ml-1 text-[10px] text-[#c87941]">ATM</span>}
                      {(() => {
                        const res = reserves.find(r => r.strikePrice === row.strike);
                        if (res?.contractSize && res.contractSize !== 1) {
                          return <div className="text-[9px] text-[#8891a5] font-normal">×{res.contractSize >= 1 ? res.contractSize.toFixed(0) : res.contractSize} {assetUnit}</div>;
                        }
                        return null;
                      })()}
                    </td>
                    {/* Put side */}
                    <td className={`py-2 px-2 text-left ${row.putIV ? "text-[#a78bfa]" : "text-[#8891a5]/30"} ${isITMPut ? "bg-[#f87171]/5" : ""}`}>
                      {row.putIV ? `${row.putIV}%` : "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.putOI > 0 ? "text-[#8891a5]" : "text-[#8891a5]/30"} ${isITMPut ? "bg-[#f87171]/5" : ""}`}>
                      {row.putOI}
                    </td>
                    <td className={`py-2 px-2 text-right ${row.putAvail > 0 ? "text-[#8891a5]" : "text-[#8891a5]/30"} ${isITMPut ? "bg-[#f87171]/5" : ""}`}>
                      {row.putAvail}
                    </td>
                    <td
                      className={`py-2 px-2 font-mono cursor-pointer hover:bg-[#f87171]/10 transition-colors ${
                        row.putPremium ? "text-[#e09a5f]" : "text-[#8891a5]/40"
                      } ${isITMPut ? "bg-[#f87171]/5" : ""}`}
                      onClick={() => handleRowClick(row, "put")}
                    >
                      {row.putPremium?.toFixed(4) ?? "—"}
                    </td>
                    {/* Put volume bar */}
                    <td className={`py-2 px-2 ${isITMPut ? "bg-[#f87171]/5" : ""}`}>
                      <VolumeBar volume={row.putVolume} maxVolume={maxVolume} color={putBarColor} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2330] text-sm text-[#8891a5]">
            <span>Click any row to trade</span>
            <span className="text-xs">
              {(() => {
                const totalOI = rows.reduce((a, r) => a + r.callOI + r.putOI, 0);
                const totalAvail = rows.reduce((a, r) => a + r.callAvail + r.putAvail, 0);
                if (totalOI === 0 && totalAvail === 0) return "No options listed yet — be the first to write";
                const parts: string[] = [];
                if (totalOI > 0) parts.push(`${totalOI} contract${totalOI !== 1 ? "s" : ""} open`);
                if (totalAvail > 0) parts.push(`${totalAvail} available`);
                return parts.join(" / ");
              })()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#12151c] border border-[#1e2330] rounded-lg">
          <p className="text-[#8891a5] mb-2">Oracle price unavailable for {assetName}</p>
          <p className="text-sm text-[#8891a5]/70">
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
          sellOrder={selectedOption.sellOrder}
          contractSize={selectedOption.contractSize}
          oracleIndex={_oracleIndex}
          assetUnit={assetUnit}
          onClose={() => setSelectedOption(null)}
        />
      )}
    </div>
  );
}
