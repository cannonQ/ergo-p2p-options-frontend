"use client";

import { useState, useEffect } from "react";
import { bsCall, bsPut, blocksToYears, oracleVolToDecimal } from "@ergo-options/core";

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionTokenId: string;
  maxTokens: bigint;
  optionName: string;
  /** Option details for B-S premium calculation */
  optionType?: string;      // "call" or "put"
  strikePrice?: number;     // USD
  maturityDate?: number;    // block height
  contractSize?: number;    // units per contract
  oracleIndex?: number;
  onSubmit: (params: {
    stablecoin: "USE" | "SigUSD";
    premiumPerToken: bigint;
    tokenAmount: bigint;
  }) => Promise<void>;
}

export function ListForSaleModal({
  isOpen,
  onClose,
  optionTokenId,
  maxTokens,
  optionName,
  optionType,
  strikePrice,
  maturityDate,
  contractSize,
  oracleIndex,
  onSubmit,
}: ListForSaleModalProps) {
  const [stablecoin, setStablecoin] = useState<"USE" | "SigUSD">("USE");
  const [premiumInput, setPremiumInput] = useState("");
  const [tokenAmountInput, setTokenAmountInput] = useState(maxTokens.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suggestedPremium, setSuggestedPremium] = useState<number | null>(null);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);

  // Reset state and fetch B-S premium when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset
    setSuggestedPremium(null);
    setSpotPrice(null);
    setPremiumInput("");
    setTokenAmountInput(maxTokens.toString());
    setSubmitting(false);
    setError(null);
    setSuccess(null);

    // Compute B-S suggested premium
    if (!strikePrice || oracleIndex === undefined || !maturityDate) return;

    Promise.all([
      fetch(`/api/spot?index=${oracleIndex}`).then(r => r.json()),
      fetch("/api/height").then(r => r.json()),
    ])
      .then(([spotData, heightData]) => {
        if (!spotData.price) return;
        setSpotPrice(spotData.price);
        const currentHeight = heightData.height ?? 0;
        const blocksToExpiry = Math.max(1, maturityDate - currentHeight); // At least 1 block for B-S

        const T = blocksToYears(blocksToExpiry);
        const sigma = spotData.vol ? oracleVolToDecimal(spotData.vol) : 0.5;
        const S = spotData.price;
        const K = strikePrice;
        const size = contractSize ?? 1;

        // If past maturity, premium = intrinsic value only
        let premium: number;
        if (maturityDate <= currentHeight) {
          // Intrinsic value: max(0, spot - strike) for calls, max(0, strike - spot) for puts
          const intrinsic = optionType === "put"
            ? Math.max(0, K - S)
            : Math.max(0, S - K);
          premium = intrinsic * size;
        } else {
          const pricePerUnit = optionType === "put"
            ? bsPut(S, K, sigma, T)
            : bsCall(S, K, sigma, T);
          premium = Math.max(0, pricePerUnit * size);
        }
        setSuggestedPremium(premium);
        setPremiumInput(premium > 0 ? premium.toFixed(6) : "");
      })
      .catch(() => {});
  }, [isOpen, maxTokens, strikePrice, oracleIndex, maturityDate, optionType, contractSize]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const decimals = stablecoin === "USE" ? 3 : 2;
  const unitName = stablecoin === "USE" ? "USE (Dexy USD)" : "SigUSD";

  const parsePremium = (): bigint | null => {
    const val = parseFloat(premiumInput);
    if (isNaN(val) || val <= 0) return null;
    return BigInt(Math.round(val * Math.pow(10, decimals)));
  };

  const parseTokenAmount = (): bigint | null => {
    const val = parseInt(tokenAmountInput, 10);
    if (isNaN(val) || val <= 0 || BigInt(val) > maxTokens) return null;
    return BigInt(val);
  };

  const premiumRaw = parsePremium();
  const tokenAmount = parseTokenAmount();
  const isValid = premiumRaw !== null && tokenAmount !== null;

  const handleSubmit = async () => {
    if (!isValid || premiumRaw === null || tokenAmount === null) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await onSubmit({
        stablecoin,
        premiumPerToken: premiumRaw,
        tokenAmount,
      });
      setSuccess("Sell order submitted successfully!");
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">List for Sale</h2>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#e2e8f0] text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Option info */}
        <div className="text-sm text-[#94a3b8] space-y-1">
          <div>
            <span className="text-[#64748b]">Option:</span>{" "}
            <span className="text-[#e2e8f0]">{optionName}</span>
          </div>
          <div>
            <span className="text-[#64748b]">Token ID:</span>{" "}
            <span className="font-mono text-xs">
              {optionTokenId.slice(0, 12)}...{optionTokenId.slice(-8)}
            </span>
          </div>
          <div>
            <span className="text-[#64748b]">Available:</span>{" "}
            <span className="text-[#e2e8f0]">{maxTokens.toString()} tokens</span>
          </div>
          {spotPrice !== null && (
            <div>
              <span className="text-[#64748b]">Spot Price:</span>{" "}
              <span className="text-[#eab308] font-mono">${spotPrice.toFixed(4)}</span>
            </div>
          )}
          {strikePrice !== undefined && (
            <div>
              <span className="text-[#64748b]">Strike:</span>{" "}
              <span className="text-[#e2e8f0] font-mono">${strikePrice.toFixed(4)}</span>
              {spotPrice !== null && (
                <span className={`ml-2 text-xs ${
                  (optionType === "call" ? spotPrice > strikePrice : spotPrice < strikePrice)
                    ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}>
                  {optionType === "call"
                    ? (spotPrice > strikePrice ? "ITM" : "OTM")
                    : (spotPrice < strikePrice ? "ITM" : "OTM")}
                </span>
              )}
            </div>
          )}
          {suggestedPremium !== null && (
            <div>
              <span className="text-[#64748b]">B-S Suggested:</span>{" "}
              <span className="text-[#a78bfa] font-mono">{suggestedPremium.toFixed(6)} {stablecoin}</span>
            </div>
          )}
        </div>

        {/* Stablecoin selector */}
        <div>
          <label className="block text-sm text-[#94a3b8] mb-1.5">Payment Currency</label>
          <div className="flex gap-2">
            <button
              onClick={() => setStablecoin("USE")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                stablecoin === "USE"
                  ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                  : "bg-[#1e293b] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
              }`}
            >
              USE (Dexy USD)
            </button>
            <button
              onClick={() => setStablecoin("SigUSD")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                stablecoin === "SigUSD"
                  ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                  : "bg-[#1e293b] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
              }`}
            >
              SigUSD
            </button>
          </div>
        </div>

        {/* Premium per token */}
        <div>
          <label className="flex items-center justify-between text-sm text-[#94a3b8] mb-1.5">
            <span>Premium per Token ({unitName})</span>
            {suggestedPremium !== null && suggestedPremium > 0 && (
              <button
                type="button"
                onClick={() => setPremiumInput(suggestedPremium.toFixed(6))}
                className="text-xs text-[#3b82f6] hover:underline"
              >
                B-S: {suggestedPremium.toFixed(4)} {unitName}
              </button>
            )}
          </label>
          <input
            type="number"
            step={(() => {
              const val = Number(premiumInput) || 0;
              if (val <= 0) return "0.001";
              const mag = Math.pow(10, Math.floor(Math.log10(val)));
              return mag.toString();
            })()}
            min="0"
            value={premiumInput}
            onChange={(e) => setPremiumInput(e.target.value)}
            placeholder={suggestedPremium ? suggestedPremium.toFixed(6) : `e.g. 0.${decimals === 3 ? "050" : "05"}`}
            className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#e2e8f0] text-sm focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        {/* Token amount */}
        <div>
          <label className="block text-sm text-[#94a3b8] mb-1.5">
            Tokens to List
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={maxTokens.toString()}
              value={tokenAmountInput}
              onChange={(e) => setTokenAmountInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#e2e8f0] text-sm focus:outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={() => setTokenAmountInput(maxTokens.toString())}
              className="px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#94a3b8] text-xs hover:text-[#e2e8f0]"
            >
              Max
            </button>
          </div>
        </div>

        {/* Summary */}
        {isValid && premiumRaw !== null && tokenAmount !== null && (
          <div className="bg-[#1e293b]/50 border border-[#334155] rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-[#94a3b8]">
              <span>Total premium (if fully filled)</span>
              <span className="text-[#eab308] font-mono">
                {(Number(premiumRaw * tokenAmount) / Math.pow(10, decimals)).toFixed(decimals)}{" "}
                {stablecoin}
              </span>
            </div>
            <div className="flex justify-between text-[#94a3b8]">
              <span>dApp fee (1%)</span>
              <span className="text-[#64748b] font-mono">
                {(Number(premiumRaw * tokenAmount) / Math.pow(10, decimals) * 0.01).toFixed(decimals)}{" "}
                {stablecoin}
              </span>
            </div>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-3 text-sm text-[#ef4444]">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-3 text-sm text-[#22c55e]">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#1e293b] text-[#94a3b8] rounded-lg text-sm hover:text-[#e2e8f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-2.5 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing..." : "List for Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
