"use client";

import { useState } from "react";
import type { AssetCategory } from "@/lib/asset-map";

export interface WizardAsset {
  slug: string;
  name: string;
  displayName: string;
  price: number;
  change24h?: number;
  oracleIndex: number;
  category: AssetCategory;
}

const CATEGORY_LABELS: { id: AssetCategory; label: string }[] = [
  { id: "crypto", label: "Crypto" },
  { id: "index", label: "Indices" },
  { id: "commodity", label: "Commodities" },
];

interface AssetPickerProps {
  mode: "buy" | "write";
  assets: WizardAsset[];
  selectedAsset: WizardAsset | null;
  direction: "bull" | "bear" | null;
  onAssetSelect: (asset: WizardAsset) => void;
  onDirectionSelect: (dir: "bull" | "bear") => void;
  onContinue: () => void;
}

function fmt(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toFixed(2);
  return "$" + p.toFixed(4);
}

export function AssetPicker({
  mode,
  assets,
  selectedAsset,
  direction,
  onAssetSelect,
  onDirectionSelect,
  onContinue,
}: AssetPickerProps) {
  const isBuy = mode === "buy";
  const spot = selectedAsset?.price ?? 0;
  const [category, setCategory] = useState<AssetCategory>("crypto");
  const filteredAssets = assets.filter((a) => a.category === category);

  return (
    <div>
      <div className="text-[11px] text-etcha-copper font-mono mb-1">STEP 2 OF 4</div>
      <h2 className="text-[22px] font-extrabold mb-1">Pick an asset &amp; direction</h2>
      <p className="text-etcha-text-dim text-sm mb-5">
        {isBuy ? "Pick the market you have a view on." : "Pick the market you want to write contracts on."}
      </p>

      {/* Category filter */}
      <div className="flex gap-2 mb-3">
        {CATEGORY_LABELS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-colors cursor-pointer ${
              category === cat.id
                ? "bg-etcha-copper text-[#0a0c10]"
                : "bg-etcha-surface border border-etcha-border text-etcha-text-secondary hover:border-etcha-copper"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {filteredAssets.map((a) => (
          <button
            key={a.slug}
            onClick={() => onAssetSelect(a)}
            className={`w-full text-left rounded-lg bg-etcha-surface border p-3 transition-colors cursor-pointer ${
              selectedAsset?.slug === a.slug
                ? "border-etcha-copper bg-[#161610]"
                : "border-etcha-border hover:border-etcha-copper"
            }`}
          >
            <div className="flex justify-between">
              <span className="font-bold text-sm">{a.name}</span>
              {a.change24h !== undefined && (
                <span
                  className={`text-[11px] font-mono ${
                    a.change24h >= 0 ? "text-etcha-green" : "text-etcha-red"
                  }`}
                >
                  {a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-[11px] text-etcha-text-dim mt-0.5">{a.displayName}</div>
            <div className="font-mono text-xs text-etcha-text-secondary mt-1">{fmt(a.price)}</div>
          </button>
        ))}
      </div>

      {/* Direction — only shown after asset selected */}
      {selectedAsset && (
        <>
          <div className="text-[11px] text-etcha-text-secondary font-mono mb-2">
            {selectedAsset.name} is at{" "}
            <span className="text-etcha-text-primary font-mono">{fmt(spot)}</span>.{" "}
            {isBuy ? "Where do you think it's headed?" : "Which side do you want to write?"}
          </div>

          <div className="flex flex-col gap-2.5 mb-5">
            {/* Bullish / Write Call */}
            <button
              onClick={() => onDirectionSelect("bull")}
              className={`w-full text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                direction === "bull"
                  ? isBuy
                    ? "border-etcha-green/40 bg-[#0d1a15]"
                    : "border-etcha-copper/40 bg-[#1a1810]"
                  : "border-etcha-border bg-etcha-surface hover:border-etcha-copper"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[26px]">{isBuy ? "\u{1F4C8}" : "\u{1F4CB}"}</span>
                <div>
                  <div
                    className="font-bold text-[15px]"
                    style={{
                      color:
                        direction === "bull"
                          ? isBuy ? "#34d399" : "#c87941"
                          : undefined,
                    }}
                  >
                    {isBuy
                      ? "Going UP \u2014 I'm bullish"
                      : "Write a call \u2014 collect if it stays flat/rises slowly"}
                  </div>
                  <div className="text-[13px] text-etcha-text-dim mt-0.5">
                    {isBuy
                      ? `I think ${selectedAsset.name} is going higher`
                      : `Buyer bets ${selectedAsset.name} rises above strike. You collect premium \u2014 and deliver if they're right.`}
                  </div>
                </div>
              </div>
              {direction === "bull" && (
                <div
                  className="mt-3 p-2.5 rounded-md border"
                  style={{
                    background: isBuy ? "#10B98115" : "#c8794115",
                    borderColor: isBuy ? "#10B98130" : "#c8794130",
                  }}
                >
                  <div
                    className="text-xs font-mono font-semibold"
                    style={{ color: isBuy ? "#34d399" : "#c87941" }}
                  >
                    {isBuy ? "\u2192 YOUR PLAY: BUY A CALL" : "\u2192 YOUR PLAY: WRITE A CALL"}
                  </div>
                  <div className="text-xs text-etcha-text-dim mt-1 leading-relaxed">
                    {isBuy
                      ? `You pay a premium for the right to buy ${selectedAsset.name} at the strike. If price rises above breakeven, you profit. Max loss = premium paid.`
                      : `You lock ${selectedAsset.name} tokens as collateral and collect premium upfront. If price stays below strike at expiry, you keep everything. If it rises above, you deliver at strike.`}
                  </div>
                </div>
              )}
            </button>

            {/* Bearish / Write Put */}
            <button
              onClick={() => onDirectionSelect("bear")}
              className={`w-full text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                direction === "bear"
                  ? isBuy
                    ? "border-etcha-red/40 bg-[#1a0d0d]"
                    : "border-etcha-copper/40 bg-[#1a1810]"
                  : "border-etcha-border bg-etcha-surface hover:border-etcha-copper"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[26px]">{isBuy ? "\u{1F4C9}" : "\u{1F4CB}"}</span>
                <div>
                  <div
                    className="font-bold text-[15px]"
                    style={{
                      color:
                        direction === "bear"
                          ? isBuy ? "#f87171" : "#c87941"
                          : undefined,
                    }}
                  >
                    {isBuy
                      ? "Going DOWN \u2014 I'm bearish"
                      : "Write a put \u2014 collect if it stays flat/falls slowly"}
                  </div>
                  <div className="text-[13px] text-etcha-text-dim mt-0.5">
                    {isBuy
                      ? `I think ${selectedAsset.name} is going lower`
                      : `Buyer bets ${selectedAsset.name} drops below strike. You collect premium \u2014 and pay out if they're right.`}
                  </div>
                </div>
              </div>
              {direction === "bear" && (
                <div
                  className="mt-3 p-2.5 rounded-md border"
                  style={{
                    background: isBuy ? "#EF444415" : "#c8794115",
                    borderColor: isBuy ? "#EF444430" : "#c8794130",
                  }}
                >
                  <div
                    className="text-xs font-mono font-semibold"
                    style={{ color: isBuy ? "#f87171" : "#c87941" }}
                  >
                    {isBuy ? "\u2192 YOUR PLAY: BUY A PUT" : "\u2192 YOUR PLAY: WRITE A PUT"}
                  </div>
                  <div className="text-xs text-etcha-text-dim mt-1 leading-relaxed">
                    {isBuy
                      ? `You pay a premium for the right to sell ${selectedAsset.name} at the strike. If price drops below breakeven, you profit. Max loss = premium paid.`
                      : `You lock stablecoins as collateral and collect premium upfront. If price stays above strike at expiry, you keep everything. If it drops below, you pay the difference.`}
                  </div>
                </div>
              )}
            </button>
          </div>
        </>
      )}

      <button
        disabled={!selectedAsset || !direction}
        onClick={onContinue}
        className="w-full rounded-lg bg-etcha-copper text-[#0a0c10] font-bold text-[15px] py-3.5 transition-all disabled:bg-etcha-border disabled:text-etcha-text-dim disabled:cursor-not-allowed hover:enabled:opacity-90 cursor-pointer"
      >
        Continue &rarr;
      </button>
    </div>
  );
}
