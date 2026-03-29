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
  OPTION_RESERVE_ERGOTREE,
  hasPhysicalDelivery,
  type OptionType as OptionTypeNum,
  type OptionStyle as OptionStyleNum,
  type SettlementType as SettlementTypeNum,
} from "@ergo-options/core";
import { bsCall, bsPut, blocksToYears, oracleVolToDecimal } from "@ergo-options/core";
import { useWriteOption, type WriteOptionInput } from "@/lib/hooks/useWriteOption";
import { useWriteOptionErgoPay } from "@/lib/hooks/useWriteOptionErgoPay";
import { Tooltip } from "@/app/components/Tooltip";
import { TxStatus } from "@/app/components/TxStatus";
import { ErgoPayModal } from "@/app/components/ErgoPayModal";
import { fetchHeight } from "@/lib/api";
import { useToast } from "@/app/components/Toast";
import { useWalletStore } from "@/stores/wallet-store";

/** Safe Number→BigInt: guards against Infinity, NaN, and precision loss beyond 2^53 */
function safeToBigInt(n: number): bigint {
  if (!isFinite(n) || isNaN(n)) throw new Error(`Cannot convert ${n} to BigInt`);
  if (Math.abs(n) > Number.MAX_SAFE_INTEGER) throw new Error(`Value ${n} exceeds safe integer range`);
  return BigInt(Math.round(n));
}

const ASSET_MAP: Record<string, { name: string; index: number; unit: string; oracleUnit?: string }> = {
  // Crypto — Physical Delivery (Rosen Bridge)
  eth: { name: "ETH", index: 0, unit: "rsETH" },
  btc: { name: "BTC", index: 1, unit: "rsBTC" },
  bnb: { name: "BNB", index: 2, unit: "rsBNB" },
  doge: { name: "DOGE", index: 3, unit: "rsDOGE" },
  ada: { name: "ADA", index: 4, unit: "rsADA" },
  erg: { name: "ERG", index: 17, unit: "ERG" },
  // Crypto — Cash Settlement only
  hns: { name: "HNS", index: 5, unit: "HNS" },
  ckb: { name: "CKB", index: 6, unit: "CKB" },
  atom: { name: "ATOM", index: 7, unit: "ATOM" },
  firo: { name: "FIRO", index: 19, unit: "FIRO" },
  // Commodities & Metals
  gold: { name: "Gold", index: 18, unit: "DexyGold", oracleUnit: "Troy Oz" },
  silver: { name: "Silver", index: 11, unit: "Silver" },
  copper: { name: "Copper", index: 12, unit: "Copper" },
  brent: { name: "Brent", index: 13, unit: "Brent" },
  wti: { name: "WTI", index: 14, unit: "WTI" },
  natgas: { name: "NatGas", index: 15, unit: "NatGas" },
  // Indices
  spx: { name: "S&P 500", index: 9, unit: "S&P 500" },
  dji: { name: "DJI", index: 10, unit: "DJI" },
};

const BLOCKS_PER_DAY = 720;

// OptionReserveV2 contract ErgoTree (hex) — production deployment
const OPTION_CONTRACT_ERGOTREE = OPTION_RESERVE_ERGOTREE;

// dApp UI fee address: 9ewpUXoFqTomiiAxkj7P5x1FLvQ5Ldsn95XZiTpJaVpgUr3VZeS
// P2PK ErgoTree = 0x0008cd + 33-byte EC point (36 bytes / 72 hex chars)
const DAPP_UI_FEE_TREE_HEX = '0008cd02383747243fed0a3ae9fcf0f3936d92447b57bb34c53faf5c5c0a105fbf42b4c8';
if (DAPP_UI_FEE_TREE_HEX.length !== 72 || !DAPP_UI_FEE_TREE_HEX.startsWith('0008cd')) {
  throw new Error('DAPP_UI_FEE_TREE_HEX is not a valid P2PK ErgoTree');
}
const DAPP_UI_FEE_TREE = new Uint8Array(
  DAPP_UI_FEE_TREE_HEX.match(/.{2}/g)!.map(b => parseInt(b, 16))
);
// Mint fee: 0.01 ERG (covers bot's miner fees for mint + deliver)
const DAPP_UI_MINT_FEE = 10_000_000n;

export default function WritePage({ params }: { params: { asset: string } }) {
  const info = ASSET_MAP[params.asset];
  const { toast } = useToast();

  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [style, setStyle] = useState<"european" | "american">("european");
  const [settlement, setSettlement] = useState<"physical" | "cash">(
    info && !hasPhysicalDelivery(info.index) ? "cash" : "physical"
  );
  const [strike, setStrike] = useState("");
  const [numContracts, setNumContracts] = useState("10");
  const [stablecoin, setStablecoin] = useState<"USE" | "SigUSD">("USE");
  const [expiryInput, setExpiryInput] = useState("7");
  const [expiryUnit, setExpiryUnit] = useState<"days" | "blocks">("days");
  const [premium, setPremium] = useState("");
  const [contractSize, setContractSize] = useState("");

  // Write option hook — single signature, bot handles mint + deliver
  const {
    step,
    error: writeError,
    warning: writeWarning,
    txIds,
    execute: executeWrite,
    reset: resetWrite,
  } = useWriteOption();

  // ErgoPay hook for mobile wallet signing
  const ergoPay = useWriteOptionErgoPay();
  const { walletType, address: walletAddress } = useWalletStore();
  const isErgoPay = walletType === "ergopay";

  // Unified step/error across both hooks
  const activeStep = isErgoPay ? ergoPay.step : step;
  const activeError = isErgoPay ? ergoPay.error : writeError;
  const activeWarning = isErgoPay ? ergoPay.warning : writeWarning;
  const activeTxIds = isErgoPay ? ergoPay.txIds : txIds;

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
          // Default strike to current oracle price
          if (!strike) {
            const p = data.price;
            const decimals = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
            setStrike(p.toFixed(decimals));
          }
          // Default contract size: target ~$50 per contract, snap to clean number
          if (!contractSize) {
            const p = data.price;
            const rawSize = 50 / p; // $50 worth
            // Snap to a "nice" number
            const mag = Math.pow(10, Math.floor(Math.log10(rawSize)));
            const normalized = rawSize / mag;
            let snapped: number;
            if (normalized < 1.5) snapped = 1 * mag;
            else if (normalized < 3.5) snapped = 2 * mag;
            else if (normalized < 7.5) snapped = 5 * mag;
            else snapped = 10 * mag;
            // Format: show enough decimals
            const sizeDecimals = snapped >= 1 ? 0 : snapped >= 0.01 ? 3 : snapped >= 0.001 ? 4 : 6;
            setContractSize(snapped.toFixed(sizeDecimals));
          }
        }
        if (data.vol) setOracleVol(data.vol);
      })
      .catch(() => {});
  }, [info]);

  const stablecoinDecimal = stablecoin === "USE" ? 1000n : 100n;
  const expiryBlocks = expiryUnit === "days"
    ? Math.round(Number(expiryInput || 0) * BLOCKS_PER_DAY)
    : Math.round(Number(expiryInput || 0));

  // Contract size in human units (e.g. 0.001 BTC, 500 DOGE)
  const cSize = Number(contractSize) || 0;
  // USD value per contract
  const contractUsdValue = cSize * spotPrice;
  // Number of contracts
  const contracts = Math.max(0, Math.floor(Number(numContracts) || 0));

  // Auto-compute collateral from contracts × contract size
  const collateral = useMemo(() => {
    if (contracts <= 0 || cSize <= 0) return 0;
    if (optionType === "call" && settlement === "physical") {
      // Physical call: lock underlying tokens
      return contracts * cSize;
    }
    // Put or cash: lock stablecoin (strike × contractSize × contracts)
    const str = Number(strike) || 0;
    return contracts * str * cSize;
  }, [contracts, cSize, optionType, settlement, strike]);

  // B-S suggested premium (scaled by contract size)
  const suggestedPremium = useMemo(() => {
    const S = spotPrice;
    const K = Number(strike) || 0;
    const T = blocksToYears(expiryBlocks);
    const sigma = oracleVolToDecimal(oracleVol);
    if (S <= 0 || K <= 0 || T <= 0 || cSize <= 0) return 0;
    const pricePerUnit = optionType === "call" ? bsCall(S, K, sigma, T) : bsPut(S, K, sigma, T);
    // Scale by contract size (e.g. 0.001 BTC per contract)
    return Math.max(0, pricePerUnit * cSize);
  }, [spotPrice, strike, expiryBlocks, oracleVol, optionType, cSize]);

  // ERG deposit for non-ERG collateral options
  const ergDeposit = Number(4n * MINER_FEE + MIN_BOX_VALUE + 3n * MIN_BOX_VALUE) / 1e9;

  // Build the write input and kick off the 3-TX chain
  const handleWrite = useCallback(async () => {
    if (!info) return;
    const currentHeight = await fetchHeight();
    if (expiryBlocks <= 0) {
      toast("Expiry must be greater than 0");
      return;
    }
    const strikeNum = Number(strike) || 0;
    if (strikeNum <= 0 || !isFinite(strikeNum) || strikeNum > 1e12) {
      toast("Strike price must be between 0 and $1,000,000,000,000");
      return;
    }
    const cSizeNum = Number(contractSize) || 0;
    if (cSizeNum <= 0 || !isFinite(cSizeNum) || cSizeNum > 1e10) {
      toast("Contract size must be greater than 0");
      return;
    }
    const expiryHeight = BigInt(currentHeight + expiryBlocks);
    if (expiryHeight <= BigInt(currentHeight)) {
      toast(`Maturity height ${expiryHeight} is not in the future (current: ${currentHeight}). Check your expiry input.`);
      return;
    }
    console.log(`[Write] currentHeight=${currentHeight}, expiryBlocks=${expiryBlocks}, maturityHeight=${expiryHeight}`);

    // Convert UI strings to on-chain types
    const optTypeNum: OptionTypeNum = optionType === "call" ? 0 : 1;
    const styleNum: OptionStyleNum = style === "european" ? 0 : 1;
    const settlNum: SettlementTypeNum = settlement === "physical" ? 0 : 1;

    const oracleIdx = info.index;
    const rate = REGISTRY_RATES[oracleIdx] ?? 1_000_000n;

    // Strike price per contract in oracle units
    // For fractional contracts (e.g. 0.001 Troy Oz), scale strike by contractSize
    // so on-chain strikePerContract = strikePrice * stablecoinDecimal / ORACLE_DECIMAL is correct
    const contractSizeNum_ = Number(contractSize) || 1;
    const strikeBigint = safeToBigInt(Number(strike) * contractSizeNum_ * Number(ORACLE_DECIMAL));

    // Share size: always in oracle units (×10^6)
    // The on-chain contract uses shareSize in oracle units for exercise delivery
    const contractSizeNum = Number(contractSize) || 1;
    const shareSize = safeToBigInt(contractSizeNum * Number(ORACLE_DECIMAL));

    // Collateral cap for cash-settled (how much stablecoin per contract at max loss)
    // For physical, this is unused but must be > 0. Already scaled by contractSize.
    const collateralCap = strikeBigint > 0n ? strikeBigint : 1n;

    // Collateral token setup
    const colAmount = Number(collateral) || 0;
    let collateralToken: { tokenId: string; amount: bigint } | undefined;
    let ergCollateral: bigint | undefined;

    const isErgCall =
      optTypeNum === 0 && settlNum === 0 && oracleIdx === ERG_ORACLE_INDEX;

    if (isErgCall) {
      // ERG call: collateral in nanoERG
      ergCollateral = safeToBigInt(colAmount * 1e9);
    } else if (optTypeNum === 0 && settlNum === 0) {
      // Physical non-ERG call: collateral in underlying token
      const tokenId = REGISTRY_TOKEN_IDS[oracleIdx];
      if (!tokenId) throw new Error("No token ID for this asset");
      collateralToken = {
        tokenId,
        amount: safeToBigInt(colAmount * Number(rate)),
      };
    } else {
      // Put or cash-settled: collateral in stablecoin
      const stableId = stablecoin === "USE" ? USE_TOKEN_ID : SIGUSD_TOKEN_ID;
      const stableDecimal = stablecoin === "USE" ? 1000n : 100n;
      collateralToken = {
        tokenId: stableId,
        amount: safeToBigInt(colAmount * Number(stableDecimal)),
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

    if (isErgoPay && walletAddress) {
      await ergoPay.execute(input, walletAddress);
    } else {
      await executeWrite(input);
    }
  }, [
    isErgoPay,
    walletAddress,
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
    return <div className="text-center py-20 text-[#8891a5]">Asset not found</div>;
  }

  // Summary calculations
  // Strike payment per contract = strike price × contract size, in stablecoin
  // e.g. BTC $68696 strike × 0.0005 BTC/contract = $34.35/contract = 34.348 USE
  const strikePerContractUsd = Number(strike || 0) * cSize;
  const strikePaymentPerContract = Math.floor(strikePerContractUsd * Number(stablecoinDecimal));
  const totalStrikeIfExercised = strikePaymentPerContract * contracts;
  // Human-readable stablecoin amounts
  const strikeUsdPerContract = strikePaymentPerContract / Number(stablecoinDecimal);
  const totalStrikeUsd = totalStrikeIfExercised / Number(stablecoinDecimal);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/app/trade/${params.asset}`} className="text-sm text-[#c87941] hover:underline">
          &larr; Back to {info.name} chain
        </Link>
        <h1 className="text-xl font-bold mt-2">Write an Option on {info.name}</h1>
      </div>

      {(isErgoPay ? ergoPay.step <= 1 : step === 0) ? (
        <div className="bg-[#12151c] border border-[#1e2330] rounded-lg p-6 space-y-5">
          {/* Row 1: Type + Style */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#8891a5] mb-2">
                Type
                <Tooltip text="Call: You profit when the price goes UP. You lock the underlying asset and buyers pay the strike price to claim it. Put: You profit when the price goes DOWN. You lock stablecoin and buyers deliver the underlying asset to claim it." />
              </label>
              <div className="flex gap-2">
                {(["call", "put"] as const).map((t) => (
                  <button key={t} onClick={() => setOptionType(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      optionType === t
                        ? t === "call"
                          ? "bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30"
                          : "bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30"
                        : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
                    }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8891a5] mb-2">
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
                        ? "bg-[#c87941]/20 text-[#c87941] border border-[#c87941]/30"
                        : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
                    }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-sm text-[#8891a5] mb-2">Settlement</label>
            <div className="flex gap-2">
              {(["physical", "cash"] as const).map((s) => {
                const disabled = s === "physical" && !hasPhysicalDelivery(info.index);
                return (
                  <button key={s}
                    onClick={() => !disabled && setSettlement(s)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settlement === s
                        ? "bg-[#c87941]/20 text-[#c87941] border border-[#c87941]/30"
                        : disabled
                        ? "bg-[#1e2330]/50 text-[#8891a5]/40 cursor-not-allowed"
                        : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
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
              <label className="block text-sm text-[#8891a5] mb-2">
                Strike Price (USD)
                {spotPrice > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = spotPrice;
                      const d = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
                      setStrike(p.toFixed(d));
                    }}
                    className="ml-2 text-[#e09a5f] hover:underline cursor-pointer"
                  >
                    Current: ${spotPrice.toFixed(spotPrice >= 100 ? 2 : 4)}
                  </button>
                )}
              </label>
              <input type="number" value={strike} onChange={(e) => setStrike(e.target.value)}
                placeholder="0.00"
                step={(() => {
                  const val = Number(strike) || 0;
                  if (val <= 0) return "1";
                  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(val)) - 1));
                  return mag.toString();
                })()}
                className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-4 py-2 text-[#e8eaf0] font-mono focus:border-[#c87941] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[#8891a5] mb-2">Expiry</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={expiryInput} onChange={(e) => setExpiryInput(e.target.value)}
                  min="1" step={expiryUnit === "days" ? "1" : "10"}
                  className="w-24 bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono focus:border-[#c87941] focus:outline-none" />
                <div className="flex bg-[#0a0c10] border border-[#1e2330] rounded-lg overflow-hidden">
                  <button type="button"
                    onClick={() => { setExpiryUnit("days"); setExpiryInput("7"); }}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${expiryUnit === "days" ? "bg-[#c87941] text-white" : "text-[#8891a5] hover:text-[#e8eaf0]"}`}>
                    Days
                  </button>
                  <button type="button"
                    onClick={() => { setExpiryUnit("blocks"); setExpiryInput("720"); }}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${expiryUnit === "blocks" ? "bg-[#c87941] text-white" : "text-[#8891a5] hover:text-[#e8eaf0]"}`}>
                    Blocks
                  </button>
                </div>
                <span className="text-xs text-[#8891a5]">
                  {expiryUnit === "days" ? `${expiryBlocks} blocks` : `~${(expiryBlocks / BLOCKS_PER_DAY).toFixed(1)} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Size */}
          <div>
            <label className="block text-sm text-[#8891a5] mb-2">
              Contract Size ({optionType === "call" && settlement === "physical" ? (info.oracleUnit ?? info.unit) : "USD equivalent"})
            </label>
            <div className="flex items-center gap-3">
              <input type="number" value={contractSize} onChange={(e) => setContractSize(e.target.value)}
                placeholder="0"
                min="0"
                step={(() => {
                  const val = Number(contractSize) || 0;
                  if (val <= 0) return "0.001";
                  const mag = Math.pow(10, Math.floor(Math.log10(val)));
                  return mag.toString();
                })()}
                className="w-40 bg-[#0a0c10] border border-[#1e2330] rounded-lg px-4 py-2 text-[#e8eaf0] font-mono focus:border-[#c87941] focus:outline-none" />
              <span className="text-sm text-[#8891a5]">
                {optionType === "call" && settlement === "physical" ? (info.oracleUnit ?? info.unit) : "USD"} per contract
              </span>
            </div>
            {cSize > 0 && spotPrice > 0 && (
              <p className="mt-1 text-sm text-[#8891a5]">
                1 contract = <span className="text-[#e8eaf0] font-semibold">{contractSize} {info.oracleUnit ?? info.unit}</span>
                {" "}(~<span className="text-[#e09a5f]">${contractUsdValue.toFixed(2)}</span>)
              </p>
            )}
          </div>

          {/* Number of Contracts */}
          <div>
            <label className="block text-sm text-[#8891a5] mb-2">
              Number of Contracts
            </label>
            <input type="number" value={numContracts} onChange={(e) => setNumContracts(e.target.value)}
              placeholder="10" min="1" step="1"
              className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-4 py-2 text-[#e8eaf0] font-mono focus:border-[#c87941] focus:outline-none" />
          </div>

          {/* Collateral Required (auto-computed) */}
          {contracts > 0 && cSize > 0 && (
            <div className="p-4 bg-[#0a0c10] rounded-lg border border-[#1e2330]">
              <h3 className="text-sm font-semibold text-[#e8eaf0] mb-2">Collateral Required</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8891a5]">{contracts} contracts × {contractSize} {optionType === "call" && settlement === "physical" ? (info.oracleUnit ?? info.unit) : stablecoin}</span>
                  <span className="text-[#e8eaf0] font-mono font-semibold">
                    {collateral.toFixed(collateral >= 1 ? 4 : 6)} {optionType === "call" && settlement === "physical" ? (info.oracleUnit ?? info.unit) : stablecoin}
                  </span>
                </div>
                {spotPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#8891a5]">USD value</span>
                    <span className="text-[#e09a5f] font-mono">~${(collateral * (optionType === "call" && settlement === "physical" ? spotPrice : 1)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stablecoin */}
          <div>
            <label className="block text-sm text-[#8891a5] mb-2">Stablecoin for Strike Payment</label>
            <div className="flex gap-2">
              {(["USE", "SigUSD"] as const).map((s) => (
                <button key={s} onClick={() => setStablecoin(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    stablecoin === s
                      ? "bg-[#e09a5f]/20 text-[#e09a5f] border border-[#e09a5f]/30"
                      : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
                  }`}>
                  {s} (${s === "USE" ? "1.000" : "1.00"})
                </button>
              ))}
            </div>
            {strike && (
              <p className="mt-1 text-xs text-[#8891a5]">
                Strike payment per contract: {strikeUsdPerContract.toFixed(stablecoin === "USE" ? 3 : 2)} {stablecoin}
              </p>
            )}
          </div>

          {/* B-S Suggested Premium */}
          <div className="p-4 bg-[#0a0c10] rounded-lg border border-[#1e2330]">
            <h3 className="text-sm font-semibold text-[#e8eaf0] mb-2">
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
                className="w-40 bg-[#12151c] border border-[#1e2330] rounded-lg px-3 py-2 text-[#e09a5f] font-mono focus:border-[#c87941] focus:outline-none" />
              <span className="text-sm text-[#8891a5]">{stablecoin}/contract</span>
              {premium && suggestedPremium > 0 && (
                <button
                  onClick={() => setPremium("")}
                  className="text-xs text-[#c87941] hover:underline"
                >
                  Reset to B-S
                </button>
              )}
              {suggestedPremium > 0 && !premium && (
                <span className="text-xs text-[#8891a5]">
                  (σ={(oracleVolToDecimal(oracleVol) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
            {suggestedPremium <= 0 && spotPrice <= 0 && (
              <p className="mt-1 text-xs text-[#e09a5f]">
                Connect wallet and wait for oracle price to compute suggested premium
              </p>
            )}
          </div>

          {/* Summary */}
          {contracts > 0 && (
            <div className="p-4 bg-[#0a0c10] rounded-lg border border-[#1e2330] space-y-2">
              <h3 className="text-sm font-semibold text-[#e8eaf0] mb-3">Summary</h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <span className="text-[#8891a5]">Lock:</span>
                <span className="text-[#e8eaf0] font-mono">
                  {collateral.toFixed(collateral >= 1 ? 4 : 6)} {optionType === "call" && settlement === "physical" ? (info.oracleUnit ?? info.unit) : stablecoin}
                  {info.index !== ERG_ORACLE_INDEX && (
                    <span className="text-[#8891a5]"> + {ergDeposit.toFixed(4)} ERG (fees)</span>
                  )}
                </span>

                <span className="text-[#8891a5]">Receive:</span>
                <span className="text-[#e8eaf0] font-mono">{contracts} option tokens</span>

                <span className="text-[#8891a5]">If all exercised:</span>
                {settlement === "physical" ? (
                  <span className="text-[#34d399] font-mono">
                    you receive {totalStrikeUsd.toFixed(stablecoin === "USE" ? 3 : 2)} {stablecoin}
                  </span>
                ) : (
                  <span className="text-[#e09a5f] font-mono">
                    buyer receives payout from your {collateral.toFixed(collateral >= 1 ? 4 : 6)} {stablecoin} collateral
                  </span>
                )}

                <span className="text-[#8891a5]">If expired:</span>
                <span className="text-[#e8eaf0] font-mono">you keep all {optionType === "call" && settlement === "physical" ? info.unit : stablecoin}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-[#8891a5]">
            After minting, list your option for sale from the Portfolio page.
          </p>

          {/* Submit */}
          <button
            onClick={handleWrite}
            className="w-full py-3 bg-[#c87941] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            disabled={!strike || contracts <= 0 || cSize <= 0 || activeStep > 0}>
            {activeStep > 0 ? "Submitting..." : isErgoPay ? "Sign with Mobile Wallet" : "Lock Collateral & Mint"}
          </button>
          <p className="text-xs text-[#8891a5] text-center">
            {isErgoPay
              ? "A QR code will appear for you to scan with your Ergo wallet app."
              : "You sign once. Our bot handles the rest in ~1 minute."}
          </p>

          {/* ErgoPay error display */}
          {isErgoPay && ergoPay.error && (
            <div className="bg-[#2a1215] border border-[#4d1a1e] rounded-lg px-4 py-3 text-sm text-[#f87171]">
              {ergoPay.error}
            </div>
          )}

          {/* ErgoPay modal for mobile signing */}
          {ergoPay.ergoPayUrl && ergoPay.ergoPayRequestId && (
            <ErgoPayModal
              open={!!ergoPay.ergoPayUrl}
              onClose={() => ergoPay.reset()}
              ergoPayUrl={ergoPay.ergoPayUrl}
              requestId={ergoPay.ergoPayRequestId}
              message={`Writing option: ${info?.name || ""} ${optionType === "call" ? "Call" : "Put"} $${strike}`}
              onSigned={(txId) => ergoPay.onErgoPaySigned(txId)}
              onExpired={() => ergoPay.reset()}
            />
          )}
        </div>
      ) : (
        /* Step progress for TX chain */
        <div className="bg-[#12151c] border border-[#1e2330] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">
            {activeStep >= 4 ? "Option Created" : "Creating Option..."}
          </h2>
          {[
            {
              label: "Create Definition Box",
              desc: activeStep === 1 ? (isErgoPay ? "Sign with mobile wallet" : "Sign with Nautilus") : "Collateral locked at contract address",
              num: 1,
              isUserAction: true,
            },
            {
              label: "Mint Option Tokens",
              desc: step === 2
                ? "Bot is minting... (~30s)"
                : `${contracts + 1} tokens (${contracts} tradeable + 1 singleton)`,
              num: 2,
              isUserAction: false,
            },
            {
              label: "Deliver to Wallet",
              desc: step === 3
                ? "Bot is delivering... (~30s)"
                : "Option tokens sent to your wallet",
              num: 3,
              isUserAction: false,
            },
          ].map((s) => (
            <div key={s.num} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                step > s.num ? "bg-[#34d399] text-white"
                  : step === s.num && !writeError ? "bg-[#c87941] text-white animate-pulse"
                  : step === s.num && writeError ? "bg-[#f87171] text-white"
                  : "bg-[#1e2330] text-[#8891a5]"
              }`}>
                {step > s.num ? "\u2713" : s.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={step >= s.num ? "text-[#e8eaf0]" : "text-[#8891a5]"}>
                    {s.label}
                  </span>
                  {!s.isUserAction && step >= s.num && step <= s.num && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#c87941]/10 text-[#c87941]">
                      automatic
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8891a5]">{s.desc}</p>
                {s.num === 1 && txIds.create && (
                  <div className="mt-0.5">
                    <TxStatus status="" txId={txIds.create} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {writeWarning && !writeError && (
            <div className="mt-4 p-3 bg-[#e09a5f]/10 border border-[#e09a5f]/30 rounded-lg text-sm text-[#e09a5f]">
              <p className="break-words">{writeWarning}</p>
            </div>
          )}

          {writeError && (
            <div className="mt-4 p-3 bg-[#f87171]/10 border border-[#f87171]/30 rounded-lg text-sm text-[#f87171]">
              <p className="font-semibold mb-1">Error at step {step}:</p>
              <p className="break-words">{writeError}</p>
            </div>
          )}

          {step >= 4 && !writeError && (
            <div className="mt-4 p-3 bg-[#34d399]/10 border border-[#34d399]/30 rounded-lg text-sm text-[#34d399]">
              Option created successfully! {contracts} tokens are in your wallet.
            </div>
          )}

          {step < 4 && step >= 2 && !writeError && (
            <p className="text-xs text-[#8891a5] mt-2">
              You can safely wait. The bot handles minting and delivery automatically.
            </p>
          )}

          {step === 1 && !writeError && (
            <p className="text-xs text-[#e09a5f] mt-2">
              Approve the transaction in your Nautilus wallet.
            </p>
          )}

          {/* Back / Retry buttons */}
          {(writeError || step >= 4) && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={resetWrite}
                className="px-4 py-2 bg-[#1e2330] text-[#e8eaf0] rounded-lg text-sm hover:bg-[#334155] transition-colors">
                {writeError ? "Back to Form" : "Write Another"}
              </button>
              {writeError && step < 4 && (
                <p className="self-center text-xs text-[#8891a5]">
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
