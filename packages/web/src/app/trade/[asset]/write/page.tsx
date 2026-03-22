"use client";

import { useState } from "react";
import Link from "next/link";

const ASSET_MAP: Record<string, { name: string; index: number }> = {
  eth: { name: "ETH", index: 0 }, btc: { name: "BTC", index: 1 },
  bnb: { name: "BNB", index: 2 }, doge: { name: "DOGE", index: 3 },
  ada: { name: "ADA", index: 4 }, erg: { name: "ERG", index: 17 },
  gold: { name: "Gold", index: 18 }, brent: { name: "Brent", index: 13 },
  wti: { name: "WTI", index: 14 }, natgas: { name: "NatGas", index: 15 },
  lithium: { name: "Lithium", index: 16 }, spx: { name: "S&P 500", index: 9 },
  dji: { name: "DJI", index: 10 },
};

export default function WritePage({ params }: { params: { asset: string } }) {
  const info = ASSET_MAP[params.asset];
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [style, setStyle] = useState<"european" | "american">("european");
  const [settlement, setSettlement] = useState<"physical" | "cash">("physical");
  const [strike, setStrike] = useState("");
  const [collateral, setCollateral] = useState("");
  const [stablecoin, setStablecoin] = useState<"USE" | "SigUSD">("USE");
  const [step, _setStep] = useState(0); // 0=form, 1=create, 2=mint, 3=deliver

  if (!info) {
    return <div className="text-center py-20 text-[#94a3b8]">Asset not found</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link href={`/trade/${params.asset}`} className="text-sm text-[#3b82f6] hover:underline">
          &larr; Back to {info.name} chain
        </Link>
        <h1 className="text-xl font-bold mt-2">Write an Option on {info.name}</h1>
      </div>

      {step === 0 ? (
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Type</label>
            <div className="flex gap-3">
              {(["call", "put"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOptionType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    optionType === t
                      ? t === "call"
                        ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                        : "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Style with explanation */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Style</label>
            <div className="flex gap-3">
              {(["european", "american"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    style === s
                      ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-2 p-3 bg-[#0a0e17] rounded text-xs text-[#94a3b8]">
              {style === "european" ? (
                <>
                  <strong className="text-[#e2e8f0]">European:</strong> Buyer can only exercise during
                  the window after maturity (~24h). Better for writers — price spikes during the term
                  don&apos;t matter, only the price at maturity.
                </>
              ) : (
                <>
                  <strong className="text-[#e2e8f0]">American:</strong> Buyer can exercise at any time
                  before maturity. Better for buyers — they can capture price movements whenever they
                  occur.
                </>
              )}
            </div>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Settlement</label>
            <div className="flex gap-3">
              {(["physical", "cash"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSettlement(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settlement === s
                      ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Strike */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Strike Price (USD)</label>
            <input
              type="number"
              value={strike}
              onChange={(e) => setStrike(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-4 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none"
            />
          </div>

          {/* Collateral */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Collateral Amount</label>
            <input
              type="number"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder="0"
              className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg px-4 py-2 text-[#e2e8f0] font-mono focus:border-[#3b82f6] focus:outline-none"
            />
          </div>

          {/* Stablecoin */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-2">Stablecoin for Strike Payment</label>
            <div className="flex gap-3">
              {(["USE", "SigUSD"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStablecoin(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    stablecoin === s
                      ? "bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/30"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}
                >
                  {s} ({s === "USE" ? "$1 = 1000 raw" : "$1 = 100 raw"})
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            className="w-full py-3 bg-[#3b82f6] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            disabled={!strike || !collateral}
          >
            Lock Collateral &amp; Mint
          </button>
        </div>
      ) : (
        /* Step progress for TX chain */
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-6 space-y-4">
          {[
            { label: "Create Definition Box", num: 1 },
            { label: "Mint Option Tokens", num: 2 },
            { label: "Deliver to Wallet", num: 3 },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.num
                    ? step === s.num
                      ? "bg-[#3b82f6] text-white animate-pulse"
                      : "bg-[#22c55e] text-white"
                    : "bg-[#1e293b] text-[#94a3b8]"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span
                className={
                  step >= s.num ? "text-[#e2e8f0]" : "text-[#94a3b8]"
                }
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
