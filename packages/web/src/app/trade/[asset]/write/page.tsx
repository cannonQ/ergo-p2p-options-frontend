"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ORACLE_DECIMAL,
  MINER_FEE,
  MIN_BOX_VALUE,
  ERG_ORACLE_INDEX,
  REGISTRY_RATES,
  REGISTRY_TOKEN_IDS,
  USE_TOKEN_ID,
  SIGUSD_TOKEN_ID,
  CONTRACT_ADDRESSES,
  hasPhysicalDelivery,
  type OptionType as OptionTypeNum,
  type OptionStyle as OptionStyleNum,
  type SettlementType as SettlementTypeNum,
} from "@ergo-options/core";
import { bsCall, bsPut, blocksToYears, oracleVolToDecimal } from "@ergo-options/core";
import { useWriteOption, type WriteOptionInput } from "@/lib/hooks/useWriteOption";
import { Tooltip } from "@/app/components/Tooltip";
import { fetchHeight } from "@/lib/api";

const ASSET_MAP: Record<string, { name: string; index: number; unit: string }> = {
  // Crypto — Physical Delivery (Rosen Bridge)
  eth: { name: "ETH", index: 0, unit: "rsETH" },
  btc: { name: "BTC", index: 1, unit: "rsBTC" },
  bnb: { name: "BNB", index: 2, unit: "rsBNB" },
  doge: { name: "DOGE", index: 3, unit: "rsDOGE" },
  ada: { name: "ADA", index: 4, unit: "rsADA" },
  erg: { name: "ERG", index: 17, unit: "ERG" },
  // Crypto — Cash Settlement
  hns: { name: "HNS", index: 5, unit: "USE/SigUSD" },
  ckb: { name: "CKB", index: 6, unit: "USE/SigUSD" },
  atom: { name: "ATOM", index: 7, unit: "USE/SigUSD" },
  firo: { name: "FIRO", index: 19, unit: "USE/SigUSD" },
  // Commodities & Metals
  gold: { name: "Gold", index: 18, unit: "DexyGold" },
  silver: { name: "Silver", index: 11, unit: "USE/SigUSD" },
  copper: { name: "Copper", index: 12, unit: "USE/SigUSD" },
  brent: { name: "Brent", index: 13, unit: "USE/SigUSD" },
  wti: { name: "WTI", index: 14, unit: "USE/SigUSD" },
  natgas: { name: "NatGas", index: 15, unit: "USE/SigUSD" },
  // Indices
  spx: { name: "S&P 500", index: 9, unit: "USE/SigUSD" },
  dji: { name: "DJI", index: 10, unit: "USE/SigUSD" },
};

const BLOCKS_PER_DAY = 720;

// OptionReserveV2 contract ErgoTree (hex) — production deployment
// TODO: Replace with actual deployed contract ErgoTree after deployment
const OPTION_CONTRACT_ERGOTREE =
  CONTRACT_ADDRESSES[0]?.address
    ? "" // Will be resolved from address when CONTRACT_ADDRESSES is populated
    : "100604000e20" + "0".repeat(64); // placeholder

// dApp UI fee tree — 36-byte P2PK ErgoTree for fee collection
// TODO: Replace with actual fee collection address
const DAPP_UI_FEE_TREE = new Uint8Array(36);
const DAPP_UI_MINT_FEE = 0n; // no mint fee for now

export default function WritePage({ params }: { params: { asset: string } }) {
  const info = ASSET_MAP[params.asset];

  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [style, setStyle] = useState<"european" | "american">("european");
  const [settlement, setSettlement] = useState<"physical" | "cash">("physical");
  const [strike, setStrike] = useState("");
  const [collateral, setCollateral] = useState("");
  const [stablecoin, setStablecoin] = useState<"USE" | "SigUSD">("USE");
  const [expiryDays, setExpiryDays] = useState("7");
  const [premium, setPremium] = useState("");
  const [autoList, setAutoList] = useState(true);

  // Write option hook — manages the 3-TX chain
  const {
    step,
    error: writeError,
    txIds,
    execute: executeWrite,
    reset: resetWrite,
  } = useWriteOption();

  // Fetch oracle data client-side (spot price + volatility)
  const [spotPrice, setSpotPrice] = useState(0);
  const [oracleVol, setOracleVol] = useState(5500); // bps, default fallback

  useEffect(() => {
    if (!info) return;
    fetch(`/api/spot?index=${info.index}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.price) {
          setSpotPrice(data.price);
          // Default strike to current oracle price (rounded to sensible precision)
          if (!strike) {
            const p = data.price;
            const decimals = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
            setStrike(p.toFixed(decimals));
          }
        }
        if (data.vol) setOracleVol(data.vol);
      })
      .catch(() => {});
  }, [info]);

  const stablecoinDecimal = stablecoin === "USE" ? 1000n : 100n;
  const expiryBlocks = Number(expiryDays || 0) * BLOCKS_PER_DAY;

  // Compute contracts from collateral
  const contracts = useMemo(() => {
    const col = Number(collateral) || 0;
    const str = Number(strike) || 0;
    if (col <= 0) return 0;

    const oracleIdx = info.index;
    const rate = REGISTRY_RATES[oracleIdx] ?? 0n;

    if (optionType === "call" && settlement === "physical") {
      if (oracleIdx === ERG_ORACLE_INDEX) {
        // ERG call: collateral in nanoERG
        const nanoErg = col * 1e9;
        const perContract = Number(100000n * (rate || 1_000_000_000n) / ORACLE_DECIMAL);
        return Math.floor(nanoErg / perContract);
      }
      // Token call: collateral / shareSize
      return Math.floor(col * Number(rate || 1_000_000n) / Number(ORACLE_DECIMAL));
    }
    if (optionType === "put" && settlement === "physical") {
      // Put: stablecoin collateral / (strike * stablecoinDecimal / ORACLE_DECIMAL)
      if (str <= 0) return 0;
      const rawCol = col * Number(stablecoinDecimal);
      const strikePerContract = str * Number(stablecoinDecimal);
      return Math.floor(rawCol / strikePerContract);
    }
    // Cash-settled: needs collateralCap input (simplified)
    return Math.floor(col);
  }, [collateral, strike, optionType, settlement, info.index, stablecoinDecimal]);

  // B-S suggested premium
  const suggestedPremium = useMemo(() => {
    const S = spotPrice;
    const K = Number(strike) || 0;
    const T = blocksToYears(expiryBlocks);
    const sigma = oracleVolToDecimal(oracleVol);
    if (S <= 0 || K <= 0 || T <= 0) return 0;
    const price = optionType === "call" ? bsCall(S, K, sigma, T) : bsPut(S, K, sigma, T);
    return Math.max(0, price);
  }, [spotPrice, strike, expiryBlocks, oracleVol, optionType]);

  // ERG deposit for non-ERG collateral options
  const ergDeposit = Number(4n * MINER_FEE + MIN_BOX_VALUE + 3n * MIN_BOX_VALUE) / 1e9;

  // Build the write input and kick off the 3-TX chain
  const handleWrite = useCallback(async () => {
    if (!info) return;
    const currentHeight = await fetchHeight();
    const expiryHeight = BigInt(currentHeight + expiryBlocks);

    // Convert UI strings to on-chain types
    const optTypeNum: OptionTypeNum = optionType === "call" ? 0 : 1;
    const styleNum: OptionStyleNum = style === "european" ? 0 : 1;
    const settlNum: SettlementTypeNum = settlement === "physical" ? 0 : 1;

    const oracleIdx = info.index;
    const rate = REGISTRY_RATES[oracleIdx] ?? 1_000_000n;

    // Strike price in oracle units (USD * ORACLE_DECIMAL)
    const strikeBigint = BigInt(Math.round(Number(strike) * Number(ORACLE_DECIMAL)));

    // Share size = tokensPerOracleUnit (from registry)
    // For calls: how many token-units per contract (e.g. 10^9 rsETH per 1 ETH contract)
    // For puts/cash: shareSize field from config
    const shareSize = rate > 0n ? rate : 100000n;

    // Collateral cap for cash-settled (how much stablecoin per contract at max loss)
    // For physical, this is unused but must be > 0
    const collateralCap = strikeBigint > 0n ? strikeBigint : 1n;

    // Collateral token setup
    const colAmount = Number(collateral) || 0;
    let collateralToken: { tokenId: string; amount: bigint } | undefined;
    let ergCollateral: bigint | undefined;

    const isErgCall =
      optTypeNum === 0 && settlNum === 0 && oracleIdx === ERG_ORACLE_INDEX;

    if (isErgCall) {
      // ERG call: collateral in nanoERG
      ergCollateral = BigInt(Math.round(colAmount * 1e9));
    } else if (optTypeNum === 0 && settlNum === 0) {
      // Physical non-ERG call: collateral in underlying token
      const tokenId = REGISTRY_TOKEN_IDS[oracleIdx];
      if (!tokenId) throw new Error("No token ID for this asset");
      collateralToken = {
        tokenId,
        amount: BigInt(Math.round(colAmount * Number(rate))),
      };
    } else {
      // Put or cash-settled: collateral in stablecoin
      const stableId = stablecoin === "USE" ? USE_TOKEN_ID : SIGUSD_TOKEN_ID;
      const stableDecimal = stablecoin === "USE" ? 1000n : 100n;
      collateralToken = {
        tokenId: stableId,
        amount: BigInt(Math.round(colAmount * Number(stableDecimal))),
      };
    }

    // Option name for R4
    const assetName = info.name;
    const typeStr = optionType === "call" ? "Call" : "Put";
    const strikeStr = Number(strike).toFixed(2);
    const optionName = `${assetName} ${typeStr} $${strikeStr}`;

    const input: WriteOptionInput = {
      contractErgoTree: OPTION_CONTRACT_ERGOTREE,
      optionName,
      optionType: optTypeNum,
      style: styleNum,
      settlementType: settlNum,
      oracleIndex: oracleIdx,
      shareSize,
      maturityHeight: expiryHeight,
      strikePrice: strikeBigint,
      collateralCap,
      stablecoinDecimal,
      collateralToken,
      ergCollateral,
      dAppUIMintFee: DAPP_UI_MINT_FEE,
      dAppUIFeeTree: DAPP_UI_FEE_TREE,
    };

    await executeWrite(input);
  }, [
    optionType,
    style,
    settlement,
    strike,
    collateral,
    stablecoin,
    expiryBlocks,
    stablecoinDecimal,
    info,
    executeWrite,
  ]);

  if (!info) {
    return <div className="text-center py-20 text-[#94a3b8]">Asset not found</div>;
  }

  // Summary calculations
  // Strike in oracle units (USD × 10^6), then convert to raw stablecoin
  const strikeOracleUnits = Math.round(Number(strike || 0) * Number(ORACLE_DECIMAL));
  const strikePaymentPerContract = Math.floor(strikeOracleUnits * Number(stablecoinDecimal) / Number(ORACLE_DECIMAL));
  const totalStrikeIfExercised = strikePaymentPerContract * contracts;
  // Human-readable stablecoin amounts
  const strikeUsdPerContract = strikePaymentPerContract / Number(stablecoinDecimal);
  const totalStrikeUsd = totalStrikeIfExercised / Number(stablecoinDecimal);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/trade/${params.asset}`} className="text-sm text-[#3b82f6] hover:underline">
          &larr; Back to {info.name} chain
        </Link>
        <h1 className="text-xl font-bold mt-2">Write an Option on {info.name}</h1>
      </div>

      {step === 0 ? (
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-6 space-y-5">
          {/* Row 1: Type + Style */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">
                Type
                <Tooltip text="Call: You profit when the price goes UP. You lock the underlying asset and buyers pay the strike price to claim it. Put: You profit when the price goes DOWN. You lock stablecoin and buyers deliver the underlying asset to claim it." />
              </label>
              <div className="flex gap-2">
                {(["call", "put"] as const).map((t) => (
                  <button key={t} onClick={() => setOptionType(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      optionType === t
                        ? t === "call"
                          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                          : "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                        : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                    }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">
                Style
                <Tooltip text={style === "european"
                  ? "European: Buyer can only exercise during the ~24h window after maturity. Better for writers — price spikes during the term don't matter."
                  : "American: Buyer can exercise any time before maturity. Better for buyers — they can capture price movements whenever they occur."
                } />
              </label>
              <div className="flex gap-2">
                {(["european", "american"] as const).map((s) => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      style === s
                        ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                        : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                    }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Settlement</label>
            <div className="flex gap-2">
              {(["physical", "cash"] as const).map((s) => {
                const disabled = s === "physical" && !hasPhysicalDelivery(info.index);
                return (
                  <button key={s}
                    onClick={() => !disabled && setSettlement(s)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settlement === s
                        ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                        : disabled
                        ? "bg-[#1e293b]/50 text-[#94a3b8]/40 cursor-not-allowed"
                        : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                    }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {disabled && " (N/A)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Strike + Expiry */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">
                Strike Price (USD)
                {spotPrice > 0 && (
                  <span className="ml-2 text-[#eab308]">Current: ${spotPrice.toFixed(4)}</span>
                )}
              </label>
              <input type="number" value={strike} onChange={(e) => setStrike(e.target.value)}
                placeholder="0.00" step="0.01"
                className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-4 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Expiry</label>
              <div className="flex gap-2">
                <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}
                  min="1" step="1"
                  className="w-20 bg-[#0a0e17] border border-[#1e293b] rounded-lg px-3 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none" />
                <span className="self-center text-sm text-[#94a3b8]">
                  days ({expiryBlocks} blocks)
                </span>
              </div>
            </div>
          </div>

          {/* Collateral + Contracts */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">
              Collateral ({optionType === "call" && settlement === "physical" ? info.unit : stablecoin})
            </label>
            <input type="number" value={collateral} onChange={(e) => setCollateral(e.target.value)}
              placeholder="0"
              className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-4 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none" />
            {contracts > 0 && (
              <p className="mt-1 text-sm text-[#94a3b8]">
                Your collateral will create <span className="text-[#e2e8f0] font-bold">{contracts}</span> tradeable contracts
              </p>
            )}
          </div>

          {/* Collateral Required Section */}
          {contracts > 0 && (
            <div className="p-4 bg-[#0a0e17] rounded-lg border border-[#1e293b]">
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-2">Collateral Required</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">
                    {optionType === "call" && settlement === "physical"
                      ? `${collateral} ${info.unit}`
                      : `${collateral} ${stablecoin}`}
                  </span>
                  <span className="text-[#22c55e]">✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Stablecoin */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Stablecoin for Strike Payment</label>
            <div className="flex gap-2">
              {(["USE", "SigUSD"] as const).map((s) => (
                <button key={s} onClick={() => setStablecoin(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    stablecoin === s
                      ? "bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/30"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}>
                  {s} (${s === "USE" ? "1.000" : "1.00"})
                </button>
              ))}
            </div>
            {strike && (
              <p className="mt-1 text-xs text-[#94a3b8]">
                Strike payment per contract: {strikeUsdPerContract.toFixed(stablecoin === "USE" ? 3 : 2)} {stablecoin}
              </p>
            )}
          </div>

          {/* B-S Suggested Premium */}
          <div className="p-4 bg-[#0a0e17] rounded-lg border border-[#1e293b]">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-2">
              Suggested Premium (Black-Scholes)
            </h3>
            <div className="flex items-center gap-3">
              <input type="number" value={premium || (suggestedPremium > 0 ? suggestedPremium.toFixed(6) : "")}
                onChange={(e) => setPremium(e.target.value)}
                placeholder="0.000000"
                step={(() => {
                  const val = Number(premium) || suggestedPremium;
                  if (val <= 0) return "0.001";
                  const mag = Math.floor(Math.log10(val));
                  return Math.pow(10, mag).toString();
                })()}
                className="w-40 bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-2 text-[#eab308] font-mono focus:border-[#3b82f6] focus:outline-none" />
              <span className="text-sm text-[#94a3b8]">{stablecoin}/contract</span>
              {premium && suggestedPremium > 0 && (
                <button
                  onClick={() => setPremium("")}
                  className="text-xs text-[#3b82f6] hover:underline"
                >
                  Reset to B-S
                </button>
              )}
              {suggestedPremium > 0 && !premium && (
                <span className="text-xs text-[#94a3b8]">
                  (σ={(oracleVolToDecimal(oracleVol) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
            {suggestedPremium <= 0 && spotPrice <= 0 && (
              <p className="mt-1 text-xs text-[#f59e0b]">
                Connect wallet and wait for oracle price to compute suggested premium
              </p>
            )}
          </div>

          {/* Summary */}
          {contracts > 0 && (
            <div className="p-4 bg-[#0a0e17] rounded-lg border border-[#1e293b] space-y-2">
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">Summary</h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <span className="text-[#94a3b8]">Lock:</span>
                <span className="text-[#e2e8f0] font-mono">
                  {collateral} {optionType === "call" && settlement === "physical" ? info.unit : stablecoin}
                  {info.index !== ERG_ORACLE_INDEX && (
                    <span className="text-[#94a3b8]"> + {ergDeposit.toFixed(4)} ERG (fees)</span>
                  )}
                </span>

                <span className="text-[#94a3b8]">Receive:</span>
                <span className="text-[#e2e8f0] font-mono">{contracts} option tokens</span>

                <span className="text-[#94a3b8]">If all exercised:</span>
                <span className="text-[#22c55e] font-mono">
                  you receive {totalStrikeUsd.toFixed(stablecoin === "USE" ? 3 : 2)} {stablecoin}
                </span>

                <span className="text-[#94a3b8]">If expired:</span>
                <span className="text-[#e2e8f0] font-mono">you keep all {optionType === "call" && settlement === "physical" ? info.unit : stablecoin}</span>
              </div>
            </div>
          )}

          {/* Auto-list checkbox */}
          <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
            <input type="checkbox" checked={autoList} onChange={(e) => setAutoList(e.target.checked)}
              className="w-4 h-4 rounded border-[#1e293b] bg-[#0a0e17] text-[#3b82f6] focus:ring-[#3b82f6]" />
            Auto-list on market at {premium || suggestedPremium.toFixed(6) || "—"} {stablecoin} after minting
          </label>

          {/* Submit */}
          <button
            onClick={handleWrite}
            className="w-full py-3 bg-[#3b82f6] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            disabled={!strike || !collateral || contracts <= 0}>
            Lock Collateral &amp; Mint
          </button>
        </div>
      ) : (
        /* Step progress for TX chain */
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">
            {step >= 4 ? "Option Created" : "Creating Option..."}
          </h2>
          {[
            { label: "Create Definition Box", desc: "Locking collateral at contract address", num: 1, txKey: "create" as const },
            { label: "Mint Option Tokens", desc: `Minting ${contracts + 1} tokens (${contracts} tradeable + 1 singleton)`, num: 2, txKey: "mint" as const },
            { label: "Deliver to Wallet", desc: "Sending option tokens to your wallet", num: 3, txKey: "deliver" as const },
          ].map((s) => (
            <div key={s.num} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                step > s.num ? "bg-[#22c55e] text-white"
                  : step === s.num && !writeError ? "bg-[#3b82f6] text-white animate-pulse"
                  : step === s.num && writeError ? "bg-[#ef4444] text-white"
                  : "bg-[#1e293b] text-[#94a3b8]"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <div className="min-w-0 flex-1">
                <span className={step >= s.num ? "text-[#e2e8f0]" : "text-[#94a3b8]"}>
                  {s.label}
                </span>
                <p className="text-xs text-[#94a3b8]">{s.desc}</p>
                {txIds[s.txKey] && (
                  <p className="text-xs text-[#3b82f6] font-mono mt-0.5 truncate">
                    TX: {txIds[s.txKey]}
                  </p>
                )}
              </div>
            </div>
          ))}

          {writeError && (
            <div className="mt-4 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-sm text-[#ef4444]">
              <p className="font-semibold mb-1">Error at step {step}:</p>
              <p className="break-words">{writeError}</p>
            </div>
          )}

          {step >= 4 && !writeError && (
            <div className="mt-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg text-sm text-[#22c55e]">
              Option created successfully! {contracts} tokens are in your wallet.
            </div>
          )}

          {step < 4 && !writeError && (
            <p className="text-xs text-[#f59e0b] mt-2">
              Do not close this page until all steps complete. Each step requires a wallet signature.
            </p>
          )}

          {/* Back / Retry buttons */}
          {(writeError || step >= 4) && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={resetWrite}
                className="px-4 py-2 bg-[#1e293b] text-[#e2e8f0] rounded-lg text-sm hover:bg-[#334155] transition-colors">
                {writeError ? "Back to Form" : "Write Another"}
              </button>
              {writeError && step < 4 && (
                <p className="self-center text-xs text-[#94a3b8]">
                  Check your portfolio for stuck boxes before retrying.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
