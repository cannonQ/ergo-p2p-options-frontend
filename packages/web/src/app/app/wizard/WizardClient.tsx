"use client";

import { useState, useMemo, useCallback } from "react";
import { bsCall, bsPut, oracleVolToDecimal, blocksToYears } from "@ergo-options/core";
import { StepIndicator } from "./components/StepIndicator";
import { ModeSelector } from "./components/ModeSelector";
import { AssetPicker, type WizardAsset } from "./components/AssetPicker";
import { ParamsForm, EXPIRIES, BUY_STRIKES, WRITE_STRIKES, type StrikeOption } from "./components/ParamsForm";
import { ResultPanel, type MarketResult } from "./components/ResultPanel";
import type { ParsedReserve } from "@/lib/reserve-scanner";
import type { ParsedSellOrder } from "@/lib/sell-order-scanner";

const BLOCKS_PER_DAY = 720;
const ORACLE_DECIMAL = 1_000_000;
const DEFAULT_VOL_BPS = 5500; // 55% default fallback

interface WizardClientProps {
  assets: WizardAsset[];
  spotPrices: Record<string, number>;   // slug -> price
  volData: Record<string, number>;      // slug -> bps
  reserves: ParsedReserve[];
  sellOrders: ParsedSellOrder[];
  currentHeight: number;
}

/**
 * Check on-chain market for matching sell orders.
 * Runs client-side against pre-fetched data — no additional API calls.
 */
function checkMarket(
  reserves: ParsedReserve[],
  sellOrders: ParsedSellOrder[],
  oracleIndex: number,
  isBull: boolean,
  targetStrike: number,
  expiryDays: number,
  currentHeight: number,
): MarketResult {
  const optionType = isBull ? "call" : "put";
  const targetMaturity = currentHeight + expiryDays * BLOCKS_PER_DAY;

  // Find reserves matching asset, type, and approximate strike/expiry
  const matchingReserves = reserves.filter((r) => {
    if (r.state !== "RESERVE") return false;
    if (r.oracleIndex !== oracleIndex) return false;
    if (r.optionType !== optionType) return false;
    // Strike within 15%
    const strikeDiff = Math.abs(r.strikePrice - targetStrike) / targetStrike;
    if (strikeDiff > 0.15) return false;
    // Maturity within ~7 days of target
    const maturityDiff = Math.abs(r.maturityHeight - targetMaturity);
    if (maturityDiff > 7 * BLOCKS_PER_DAY) return false;
    return true;
  });

  if (matchingReserves.length === 0) {
    return { found: false, listings: [] };
  }

  // Build set of matching option token IDs
  const tokenIds = new Set(
    matchingReserves.map((r) => r.optionTokenId).filter(Boolean) as string[],
  );

  // Find sell orders for these tokens
  const matchingSellOrders = sellOrders.filter(
    (so) => tokenIds.has(so.optionTokenId),
  );

  if (matchingSellOrders.length === 0) {
    return { found: false, listings: [] };
  }

  // Map sell orders to listings
  const listings = matchingSellOrders
    .map((so) => {
      const reserve = matchingReserves.find(
        (r) => r.optionTokenId === so.optionTokenId,
      );
      if (!reserve) return null;
      const premiumPerToken = Number(so.premiumPerToken) / ORACLE_DECIMAL;
      const daysToExpiry = Math.max(
        1,
        Math.round((reserve.maturityHeight - currentHeight) / BLOCKS_PER_DAY),
      );
      return {
        strike: reserve.strikePrice,
        premium: premiumPerToken,
        available: Number(so.tokenAmount),
        writer: so.sellerPropBytes.slice(6, 14) + "..." + so.sellerPropBytes.slice(-6),
        expiryDays: daysToExpiry,
      };
    })
    .filter(Boolean) as MarketResult["listings"];

  // Sort by premium ascending (best deal first)
  listings.sort((a, b) => a.premium - b.premium);

  return { found: listings.length > 0, listings: listings.slice(0, 3) };
}

export function WizardClient({
  assets,
  spotPrices,
  volData,
  reserves,
  sellOrders,
  currentHeight,
}: WizardClientProps) {
  const [mode, setMode] = useState<"buy" | "write" | null>(null);
  const [step, setStep] = useState(0); // 0=splash, 1=mode already picked, 2=asset+dir, 3=params, 4=result
  const [selectedAsset, setSelectedAsset] = useState<WizardAsset | null>(null);
  const [direction, setDirection] = useState<"bull" | "bear" | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<typeof EXPIRIES[number] | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<StrikeOption | null>(null);
  const [marketResult, setMarketResult] = useState<MarketResult | null>(null);
  const [checking, setChecking] = useState(false);

  const isBuy = mode === "buy";
  const isBull = direction === "bull";
  const spot = selectedAsset ? spotPrices[selectedAsset.slug] ?? selectedAsset.price : 0;
  const strike = selectedStrike ? spot * selectedStrike.multiplier : null;

  // Compute premium using real B-S pricing (per unit of underlying, same as write page)
  const sigmaUsed = selectedAsset
    ? oracleVolToDecimal(volData[selectedAsset.slug] ?? DEFAULT_VOL_BPS)
    : 0;
  const premium = useMemo(() => {
    if (!selectedAsset || !selectedStrike || !selectedExpiry || !strike) return null;
    const expiryBlocks = selectedExpiry.days * BLOCKS_PER_DAY;
    const T = blocksToYears(expiryBlocks);
    if (T <= 0 || sigmaUsed <= 0) return Math.max(0, isBull ? spot - strike : strike - spot);
    const p = isBull ? bsCall(spot, strike, sigmaUsed, T) : bsPut(spot, strike, sigmaUsed, T);
    return Math.max(p, 0);
  }, [selectedAsset, selectedStrike, selectedExpiry, strike, spot, isBull, sigmaUsed]);

  const reset = useCallback(() => {
    setMode(null);
    setStep(0);
    setSelectedAsset(null);
    setDirection(null);
    setSelectedExpiry(null);
    setSelectedStrike(null);
    setMarketResult(null);
    setChecking(false);
  }, []);

  function pickMode(m: "buy" | "write") {
    setMode(m);
    setStep(2);
  }

  function handleAssetContinue() {
    setStep(3);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  function handleParamsContinue() {
    setStep(4);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    if (isBuy && selectedAsset && strike && selectedExpiry) {
      setChecking(true);
      setMarketResult(null);
      // Brief delay for UX, then run client-side check
      setTimeout(() => {
        const result = checkMarket(
          reserves,
          sellOrders,
          selectedAsset.oracleIndex,
          isBull,
          strike,
          selectedExpiry.days,
          currentHeight,
        );
        setMarketResult(result);
        setChecking(false);
      }, 800);
    }
  }

  function goBack() {
    if (step === 4) {
      setStep(3);
      setMarketResult(null);
      setChecking(false);
    } else if (step === 3) {
      setStep(2);
      setSelectedExpiry(null);
      setSelectedStrike(null);
    } else if (step === 2) {
      setStep(0);
      setMode(null);
      setSelectedAsset(null);
      setDirection(null);
    }
  }

  function switchToWrite() {
    setMode("write");
    setStep(3);
    setSelectedStrike(null);
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {mode && (
            <span
              className="rounded px-2 py-0.5 text-[11px] font-mono font-semibold"
              style={{
                background: (isBuy ? "#6366f1" : "#c87941") + "22",
                color: isBuy ? "#6366f1" : "#c87941",
                border: `1px solid ${isBuy ? "#6366f1" : "#c87941"}44`,
              }}
            >
              {isBuy ? "buying" : "writing"}
            </span>
          )}
        </div>
        {step > 0 && (
          <div className="flex items-center gap-3">
            {step >= 2 && (
              <button
                onClick={goBack}
                className="text-etcha-text-secondary text-[13px] hover:text-etcha-text-primary transition-colors cursor-pointer"
              >
                &larr; back
              </button>
            )}
            <button
              onClick={reset}
              className="text-etcha-text-dim text-[13px] hover:text-etcha-text-secondary transition-colors cursor-pointer"
            >
              restart
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      {step >= 2 && <StepIndicator current={step - 1} total={4} />}

      {/* Step 0/1: Mode selection */}
      {step === 0 && <ModeSelector onSelect={pickMode} />}

      {/* Step 2: Asset + Direction */}
      {step === 2 && mode && (
        <AssetPicker
          mode={mode}
          assets={assets}
          selectedAsset={selectedAsset}
          direction={direction}
          onAssetSelect={(asset) => {
            setSelectedAsset(asset);
            setTimeout(() => {
              document.getElementById("wizard-direction")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }}
          onDirectionSelect={setDirection}
          onContinue={handleAssetContinue}
        />
      )}

      {/* Step 3: Params */}
      {step === 3 && mode && direction && selectedAsset && (
        <ParamsForm
          mode={mode}
          direction={direction}
          assetLabel={selectedAsset.name}
          spotPrice={spot}
          premium={premium}
          selectedExpiry={selectedExpiry}
          selectedStrike={selectedStrike}
          onExpirySelect={setSelectedExpiry}
          onStrikeSelect={setSelectedStrike}
          onContinue={handleParamsContinue}
        />
      )}

      {/* Step 4: Result */}
      {step === 4 && mode && direction && selectedAsset && strike && premium && selectedExpiry && (
        <ResultPanel
          mode={mode}
          direction={direction}
          assetSlug={selectedAsset.slug}
          assetLabel={selectedAsset.name}
          spotPrice={spot}
          strike={strike}
          premium={premium}
          sigmaPct={sigmaUsed * 100}
          expiryLabel={selectedExpiry.label}
          expiryDays={selectedExpiry.days}
          checking={checking}
          marketResult={marketResult}
          onReset={reset}
          onSwitchToWrite={switchToWrite}
        />
      )}
    </div>
  );
}
