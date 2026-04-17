"use client";

import { useState, useEffect } from "react";
import { TxStatus } from "@/app/components/TxStatus";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { REGISTRY_RATES, ORACLE_DECIMAL } from "@ergo-options/core";

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
  reserveBoxId: string;
  contractSize?: number;
  oracleIndex?: number;
  onExercise: (params: { quantity: number }) => Promise<string>;
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
  reserveBoxId: _reserveBoxId,
  contractSize,
  oracleIndex,
  onExercise,
}: ExerciseDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  const exerciseQty = Number(quantity);
  const [status, setStatus] = useState("");
  const [txId, setTxId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const stableDecimals = stablecoin === "USE" ? 3 : 2;

  // Compute per-contract delivery amounts using registry rate
  const cSize = contractSize ?? 1;
  const rate = oracleIndex !== undefined ? Number(REGISTRY_RATES[oracleIndex] ?? 0n) : 0;
  const tokensPerContract = rate > 0 ? Math.floor(cSize * rate) : 0;
  const rateIsPowerOf10 = rate > 0 && Math.log10(rate) === Math.floor(Math.log10(rate));
  // Strike payment per contract = strikePrice * contractSize (in stablecoin)
  const strikePerContract = strikePrice * cSize;

  // Format underlying amount for display
  const formatUnderlying = (contracts: number): string => {
    const totalTokens = contracts * tokensPerContract;
    if (rate <= 0) return `${(contracts * cSize).toFixed(cSize < 1 ? 4 : 2)} ${assetUnit}`;
    if (rateIsPowerOf10) {
      const human = totalTokens / rate;
      const d = human >= 100 ? 0 : human >= 1 ? 2 : human >= 0.01 ? 4 : 6;
      return `${human.toFixed(d)} ${assetUnit}`;
    }
    return `${totalTokens} ${assetUnit}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setStatus("");
    setTxId("");
    setConfirmed(false);
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCallColor = optionType === "call";
  const accentColor = isCallColor ? "#34d399" : "#f87171";
  const accentBg = isCallColor ? "bg-[#34d399]/10 border-[#34d399]/30" : "bg-[#f87171]/10 border-[#f87171]/30";
  const accentText = isCallColor ? "text-etcha-green" : "text-etcha-red";

  // Exercise window status
  const windowStatus = (() => {
    if (style === "american") return { label: "Exercisable now", ok: true };
    if (expiryBlocks > 0) return { label: `Exercisable in ~${Math.ceil(expiryBlocks / 720)} day(s)`, ok: false };
    if (expiryBlocks <= 0 && expiryBlocks > -720) return { label: "Exercise window open", ok: true };
    return { label: "Expired", ok: false };
  })();

  // Cash profit calculation (per-contract, not per-unit)
  const cashProfit = (() => {
    if (settlementType !== "cash" || !spotPrice) return 0;
    const raw = optionType === "call"
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
    const capped = collateralCap ? Math.min(raw, collateralCap) : raw;
    return capped * cSize;
  })();
  const isOTM = settlementType === "cash" && cashProfit <= 0;
  const canExercise = windowStatus.ok && !isOTM && !txId;
  const isSubmitting = status === "Building..." || status === "Sign in wallet..." || status === "Submitting...";

  const handleExercise = async () => {
    if (!canExercise) return;
    try {
      setStatus("Building...");
      setTxId("");  // Clear any previous state
      const resultTxId = await onExercise({ quantity: exerciseQty });
      if (resultTxId) {
        setTxId(resultTxId);
        setStatus("Success!");
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("[ExerciseDialog] Error:", err);
      console.error("[ExerciseDialog] Full message:", msg);
      if (msg.includes("declined") || msg.includes("Refused")) {
        setStatus("Signing declined");
      } else if (msg.includes("Insufficient inputs")) {
        if (msg.includes("nanoErgs")) {
          setStatus("Insufficient ERG in wallet for transaction fees.");
        } else {
          setStatus("Insufficient tokens in wallet. Check your balance.");
        }
      } else {
        setStatus(`Error: ${msg.slice(0, 120)}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={txId ? undefined : onClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="exercise-title" className="relative bg-etcha-surface border border-etcha-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="exercise-title" className="text-lg font-bold">
            Exercise:{" "}
            <span className={accentText}>
              {assetName} {optionType === "call" ? "Call" : "Put"}
            </span>{" "}
            ${strikePrice.toFixed(strikePrice >= 100 ? 0 : strikePrice >= 1 ? 2 : 4)} Strike
          </h2>
          <button onClick={onClose} className="text-etcha-text-secondary hover:text-etcha-text text-xl" aria-label="Close exercise dialog">&times;</button>
        </div>

        {/* Exercise window badge */}
        <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
          windowStatus.ok ? accentBg + " " + accentText : "bg-[#e09a5f]/10 border-[#e09a5f]/30 text-etcha-copper-light"
        }`}>
          {windowStatus.label}
        </div>

        {/* Exercise details */}
        <div className="space-y-3 text-sm">
          {settlementType === "physical" && optionType === "call" && (
            <div className="space-y-2">
              <p className="text-etcha-text-secondary">You will:</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-2">
                <span className="text-etcha-red">Pay:</span>
                <span className="text-etcha-text font-mono">{strikePerContract.toFixed(stableDecimals)} {stablecoin} per contract (strike → writer)</span>
                <span className="text-etcha-green">Receive:</span>
                <span className="text-etcha-text font-mono">{formatUnderlying(1)} per contract (from reserve)</span>
              </div>
            </div>
          )}

          {settlementType === "physical" && optionType === "put" && (
            <div className="space-y-2">
              <p className="text-etcha-text-secondary">You will:</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pl-2">
                <span className="text-etcha-red">Send:</span>
                <span className="text-etcha-text font-mono">{formatUnderlying(1)} per contract (to writer)</span>
                <span className="text-etcha-green">Receive:</span>
                <span className="text-etcha-text font-mono">{strikePerContract.toFixed(stableDecimals)} {stablecoin} per contract (from reserve)</span>
              </div>
            </div>
          )}

          {settlementType === "cash" && (
            <div className="space-y-2">
              {spotPrice !== undefined && (
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-etcha-text-secondary">Oracle spot:</span>
                  <span className="text-etcha-copper-light font-mono">${spotPrice >= 1 ? spotPrice.toFixed(2) : spotPrice >= 0.01 ? spotPrice.toFixed(4) : spotPrice.toFixed(6)}</span>
                  <span className="text-etcha-text-secondary">Strike:</span>
                  <span className="text-etcha-text font-mono">${strikePrice >= 1 ? strikePrice.toFixed(2) : strikePrice >= 0.01 ? strikePrice.toFixed(4) : strikePrice.toFixed(6)}</span>
                  <span className="text-etcha-text-secondary">Profit/contract:</span>
                  <span className={`font-mono ${cashProfit > 0 ? "text-etcha-green" : "text-etcha-red"}`}>
                    {cashProfit > 0 ? `$${cashProfit.toFixed(stableDecimals)}` : "OTM — no profit"}
                  </span>
                </div>
              )}
              {isOTM && (
                <p className="text-xs text-etcha-copper-light">
                  Option is out of the money. Nothing to exercise.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-3 bg-etcha-bg rounded-lg border border-etcha-border space-y-1 text-sm">
          {settlementType === "physical" && optionType === "call" && (
            <>
              <div className="flex justify-between">
                <span className="text-etcha-text-secondary">Total payment:</span>
                <span className="text-etcha-text font-mono">{(strikePerContract * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-etcha-text-secondary">Total received:</span>
                <span className="text-etcha-green font-mono">{formatUnderlying(exerciseQty)}</span>
              </div>
            </>
          )}
          {settlementType === "physical" && optionType === "put" && (
            <>
              <div className="flex justify-between">
                <span className="text-etcha-text-secondary">Total sent:</span>
                <span className="text-etcha-text font-mono">{formatUnderlying(exerciseQty)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-etcha-text-secondary">Total received:</span>
                <span className="text-etcha-green font-mono">{(strikePerContract * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
              </div>
            </>
          )}
          {settlementType === "cash" && cashProfit > 0 && (
            <div className="flex justify-between">
              <span className="text-etcha-text-secondary">Total payout:</span>
              <span className="text-etcha-green font-mono">{(cashProfit * exerciseQty).toFixed(stableDecimals)} {stablecoin}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-[#1e2330]/50">
            <span className="text-etcha-text-secondary">Network fee:</span>
            <span className="text-etcha-text-secondary font-mono">0.0022 ERG</span>
          </div>
        </div>

        {/* Success Summary */}
        {txId && (
          <div className="p-3 bg-[#34d399]/10 border border-[#34d399]/30 rounded-lg space-y-1 text-sm">
            <p className="font-semibold text-etcha-green">
              Exercised {exerciseQty} {assetName} {optionType === "call" ? "Call" : "Put"} ${strikePrice >= 100 ? strikePrice.toFixed(0) : strikePrice.toFixed(4)}
            </p>
            {settlementType === "physical" && optionType === "call" && (
              <p className="text-etcha-text">Paid: {(strikePerContract * exerciseQty).toFixed(stableDecimals)} {stablecoin} &middot; Received: {formatUnderlying(exerciseQty)}</p>
            )}
            {settlementType === "physical" && optionType === "put" && (
              <p className="text-etcha-text">Sent: {formatUnderlying(exerciseQty)} &middot; Received: {(strikePerContract * exerciseQty).toFixed(stableDecimals)} {stablecoin}</p>
            )}
            {settlementType === "cash" && cashProfit > 0 && (
              <p className="text-etcha-text">Received: {(cashProfit * exerciseQty).toFixed(stableDecimals)} {stablecoin} profit</p>
            )}
          </div>
        )}

        {/* Status */}
        <TxStatus status={status} txId={txId} />

        {/* Actions */}
        <div className="space-y-2">
          {txId ? (
            <div className="flex gap-3">
              <button
                disabled
                className={`flex-1 py-3 rounded-lg font-medium opacity-40 cursor-not-allowed ${
                  isCallColor
                    ? "bg-etcha-green text-white"
                    : "bg-etcha-red text-white"
                }`}
              >
                Exercised!
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-etcha-border text-etcha-text-secondary rounded-lg hover:text-etcha-text transition-colors"
              >
                Close
              </button>
            </div>
          ) : isSubmitting ? (
            <div className="flex gap-3">
              <button
                disabled
                className={`flex-1 py-3 rounded-lg font-medium opacity-40 cursor-not-allowed ${
                  isCallColor
                    ? "bg-etcha-green text-white"
                    : "bg-etcha-red text-white"
                }`}
              >
                {status}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-etcha-border text-etcha-text-secondary rounded-lg hover:text-etcha-text transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : !confirmed ? (
            <div className="flex gap-3">
              <button
                disabled={!canExercise}
                onClick={() => setConfirmed(true)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCallColor
                    ? "bg-etcha-green hover:bg-[#16a34a] text-white"
                    : "bg-etcha-red hover:bg-[#dc2626] text-white"
                }`}
              >
                Exercise {exerciseQty} Contract{exerciseQty !== 1 ? "s" : ""}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-etcha-border text-etcha-text-secondary rounded-lg hover:text-etcha-text transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg px-3 py-2 text-sm text-etcha-red">
                {settlementType === "cash"
                  ? "This action is irreversible. You will receive the cash profit payout."
                  : "This action is irreversible. You will pay the strike amount and receive the underlying asset."}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmed(false)} className="flex-1 py-2 rounded-lg bg-etcha-border text-etcha-text-secondary hover:text-etcha-text">
                  Cancel
                </button>
                <button onClick={handleExercise} className="flex-1 py-2 rounded-lg bg-etcha-red text-white hover:bg-[#ef4444]">
                  Confirm Exercise
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
