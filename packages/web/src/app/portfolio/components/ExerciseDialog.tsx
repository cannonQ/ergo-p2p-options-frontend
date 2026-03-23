"use client";

import { useState, useEffect } from "react";

interface ExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  optionTokenId: string;
  quantity: bigint;
  optionType: "call" | "put";
  settlementType: "physical" | "cash";
  strikePrice: number;
  assetName: string;
  assetUnit: string;
  expiryBlocks: number;
  style: "european" | "american";
  spotPrice?: number;
  collateralCap?: number;
  stablecoin: "USE" | "SigUSD";
}

export function ExerciseDialog({
  isOpen,
  onClose,
  optionTokenId: _optionTokenId,
  quantity,
  optionType,
  settlementType,
  strikePrice,
  assetName,
  assetUnit,
  expiryBlocks,
  style,
  spotPrice,
  collateralCap,
  stablecoin,
}: ExerciseDialogProps) {
  const [exerciseQty, setExerciseQty] = useState(Number(quantity));
  const stableDecimals = stablecoin === "USE" ? 3 : 2;

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCallColor = optionType === "call";
  const accentColor = isCallColor ? "#22c55e" : "#ef4444";
  const accentBg = isCallColor ? "bg-[#22c55e]/10 border-[#22c55e]/30" : "bg-[#ef4444]/10 border-[#ef4444]/30";
  const accentText = isCallColor ? "text-[#22c55e]" : "text-[#ef4444]";

  // Exercise window status
  const windowStatus = (() => {
    if (style === "american") return { label: "Exercisable now", ok: true };
    if (expiryBlocks > 0) return { label: `Exercisable in ~${Math.ceil(expiryBlocks / 720)} day(s)`, ok: false };
    if (expiryBlocks <= 0 && expiryBlocks > -720) return { label: "Exercise window open", ok: true };
    return { label: "Expired", ok: false };
  })();

  // Cash profit calculation
  const cashProfit = (() => {
    if (settlementType !== "cash" || !spotPrice) return 0;
    const raw = optionType === "call"
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
    return collateralCap ? Math.min(raw, collateralCap) : raw;
  })();
  const isOTM = settlementType === "cash" && cashProfit <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#131a2a] border border-[#1e293b] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Exercise:{" "}
            <span className={accentText}>
              {assetName} {optionType === "call" ? "Call" : "Put"}
            </span>{" "}
            ${strikePrice.toFixed(strikePrice >= 100 ? 0 : strikePrice >= 1 ? 2 : 4)} Strike
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#e2e8f0] text-xl">&times;</button>
        </div>

        {/* Exercise window badge */}
        <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
          windowStatus.ok ? accentBg + " " + accentText : "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]"
        }`}>
          {windowStatus.label}
        </div>

        {/* Exercise details */}
        <div className="space-y-3 text-sm">
          {settlementType === "physical" && optionType === "call" && (
            <div className="space-y-2">
              <p className="text-[#94a3b8]">You will:</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-2">
                <span className="text-[#ef4444]">Pay:</span>
                <span className="text-[#e2e8f0] font-mono">{strikePrice.toFixed(stableDecimals)} {stablecoin} per contract (strike → writer)</span>
                <span className="text-[#22c55e]">Receive:</span>
                <span className="text-[#e2e8f0] font-mono">1 {assetUnit} per contract (from reserve)</span>
              </div>
            </div>
          )}

          {settlementType === "physical" && optionType === "put" && (
            <div className="space-y-2">
              <p className="text-[#94a3b8]">You will:</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-2">
                <span className="text-[#ef4444]">Send:</span>
                <span className="text-[#e2e8f0] font-mono">1 {assetUnit} per contract (to writer)</span>
                <span className="text-[#22c55e]">Receive:</span>
                <span className="text-[#e2e8f0] font-mono">{strikePrice.toFixed(stableDecimals)} {stablecoin} per contract (from reserve)</span>
              </div>
            </div>
          )}

          {settlementType === "cash" && (
            <div className="space-y-2">
              {spotPrice !== undefined && (
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-[#94a3b8]">Oracle spot:</span>
                  <span className="text-[#eab308] font-mono">${spotPrice.toFixed(2)}</span>
                  <span className="text-[#94a3b8]">Strike:</span>
                  <span className="text-[#e2e8f0] font-mono">${strikePrice.toFixed(2)}</span>
                  <span className="text-[#94a3b8]">Profit/contract:</span>
                  <span className={`font-mono ${cashProfit > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {cashProfit > 0 ? `$${cashProfit.toFixed(stableDecimals)}` : "OTM — no profit"}
                  </span>
                </div>
              )}
              {isOTM && (
                <p className="text-xs text-[#f59e0b]">
                  Option is out of the money. Nothing to exercise.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm text-[#94a3b8] mb-1">Contracts to exercise</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={exerciseQty}
              onChange={(e) => setExerciseQty(Math.min(Number(quantity), Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={Number(quantity)}
              className="flex-1 bg-[#0a0e17] border border-[#1e293b] rounded-lg px-3 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none"
            />
            <button
              onClick={() => setExerciseQty(Number(quantity))}
              className="px-3 py-2 bg-[#1e293b] text-[#94a3b8] rounded-lg text-sm hover:text-[#e2e8f0]"
            >
              Max
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1e293b] space-y-1 text-sm">
          {settlementType === "physical" && optionType === "call" && (
            <>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total payment:</span>
                <span className="text-[#e2e8f0] font-mono">{(strikePrice * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total received:</span>
                <span className="text-[#22c55e] font-mono">{exerciseQty} {assetUnit}</span>
              </div>
            </>
          )}
          {settlementType === "physical" && optionType === "put" && (
            <>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total sent:</span>
                <span className="text-[#e2e8f0] font-mono">{exerciseQty} {assetUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total received:</span>
                <span className="text-[#22c55e] font-mono">{(strikePrice * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
              </div>
            </>
          )}
          {settlementType === "cash" && cashProfit > 0 && (
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Total payout:</span>
              <span className="text-[#22c55e] font-mono">{(cashProfit * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-[#1e293b]/50">
            <span className="text-[#94a3b8]">Network fee:</span>
            <span className="text-[#94a3b8] font-mono">0.0022 ERG</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            disabled={isOTM || !windowStatus.ok}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isCallColor
                ? "bg-[#22c55e] hover:bg-[#16a34a] text-white"
                : "bg-[#ef4444] hover:bg-[#dc2626] text-white"
            }`}
          >
            Exercise {exerciseQty} Contract{exerciseQty !== 1 ? "s" : ""}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#1e293b] text-[#94a3b8] rounded-lg hover:text-[#e2e8f0] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
