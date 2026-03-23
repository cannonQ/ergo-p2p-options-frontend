"use client";

import { useState, useEffect, useCallback } from "react";

interface TradePanelProps {
  assetName: string;
  spotPrice: number;
  strike: number;
  type: "call" | "put";
  expiry: string;
  premium: number;      // stablecoin per contract
  available: number;    // contracts available
  onClose: () => void;
}

export function TradePanel({
  assetName,
  spotPrice,
  strike,
  type,
  expiry,
  premium,
  available,
  onClose,
}: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<string>("1");
  const [slippage, setSlippage] = useState<string>("1.0");
  const [stablecoin, setStablecoin] = useState<string>("USE");

  const qty = parseInt(quantity) || 0;
  const total = qty * premium;
  const isCall = type === "call";
  const accentColor = isCall ? "#22c55e" : "#ef4444";
  const typeLabel = isCall ? "Call" : "Put";

  // Exercise math — pay/receive in stablecoins, not dollars
  const stableDecimals = stablecoin === "USE" ? 3 : 2;
  const exerciseReceive = isCall
    ? `${qty} ${assetName}`
    : `${(qty * strike).toFixed(stableDecimals)} ${stablecoin}`;
  const exercisePay = isCall
    ? `${(qty * strike).toFixed(stableDecimals)} ${stablecoin}`
    : `${qty} ${assetName}`;
  const breakeven = isCall
    ? strike + premium * spotPrice   // strike + premium converted to asset terms
    : strike - premium * spotPrice;

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#131a2a] border-l border-[#1e293b] z-50 overflow-y-auto shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 text-xs font-bold rounded"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {typeLabel}
            </span>
            <span className="font-bold text-[#e2e8f0]">{assetName}</span>
            <span className="text-[#eab308] font-mono">${strike >= 100 ? strike.toFixed(0) : strike >= 1 ? strike.toFixed(2) : strike.toFixed(4)}</span>
            <span className="text-[#94a3b8] text-sm">Exp: {expiry}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#e2e8f0] text-xl leading-none px-2"
          >
            x
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Buy / Sell toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                side === "buy"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                side === "sell"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Available / Premium */}
          <div className="bg-[#0a0e17] rounded-lg px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Available</span>
              <span className="text-[#e2e8f0] font-mono">{available} contracts</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Premium</span>
              <span className="text-[#eab308] font-mono">{premium.toFixed(stableDecimals)} {stablecoin}</span>
            </div>
          </div>

          {/* Quantity input */}
          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max={available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-4 py-2 text-[#e2e8f0] font-mono text-lg focus:border-[#3b82f6] focus:outline-none transition-colors"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[#94a3b8] text-sm">Total</span>
            <span className="text-[#eab308] font-mono text-xl font-bold">
              {total.toFixed(stableDecimals)} {stablecoin}
            </span>
          </div>

          {/* Exercise info */}
          <div className="border border-[#1e293b] rounded-lg px-4 py-3 space-y-2">
            <div className="text-sm text-[#94a3b8] font-medium border-b border-[#1e293b] pb-1 mb-1">
              If Exercised
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">You receive</span>
              <span className="text-[#22c55e] font-mono">{exerciseReceive}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">You pay</span>
              <span className="text-[#ef4444] font-mono">{exercisePay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Breakeven</span>
              <span className="text-[#e2e8f0] font-mono">
                ${breakeven.toFixed(4)}/{assetName}
              </span>
            </div>
          </div>

          {/* Slippage & Stablecoin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#94a3b8] block mb-1">Slippage</label>
              <div className="relative">
                <input
                  type="text"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-3 py-2 text-[#e2e8f0] font-mono text-sm focus:border-[#3b82f6] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#94a3b8] block mb-1">Stablecoin</label>
              <select
                value={stablecoin}
                onChange={(e) => setStablecoin(e.target.value)}
                className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-3 py-2 text-[#e2e8f0] text-sm focus:border-[#3b82f6] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="USE">USE ($1 = 1000)</option>
                <option value="SigUSD">SigUSD ($1 = 100)</option>
              </select>
            </div>
          </div>

          {/* Confirm button */}
          <button
            disabled={qty <= 0 || qty > available}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              qty > 0 && qty <= available
                ? "bg-[#3b82f6] hover:bg-[#2563eb] cursor-pointer"
                : "bg-[#3b82f6]/30 cursor-not-allowed"
            }`}
          >
            {side === "buy" ? "Confirm Purchase" : "Confirm Sale"}
          </button>

          {/* Spot price footer */}
          <div className="text-center text-xs text-[#94a3b8]">
            Spot: ${spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            {" "} | Oracle feed
          </div>
        </div>
      </div>
    </>
  );
}
