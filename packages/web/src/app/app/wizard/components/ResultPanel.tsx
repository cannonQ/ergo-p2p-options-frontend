"use client";

import Link from "next/link";
import { PayoffChart } from "./PayoffChart";

export interface MarketListing {
  strike: number;
  premium: number;
  available: number;
  writer: string;
  expiryDays: number;
}

export interface MarketResult {
  found: boolean;
  listings: MarketListing[];
}

function fmt(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toFixed(2);
  return "$" + p.toFixed(4);
}

function Tag({ children, color = "#c87941" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-[11px] font-mono font-semibold"
      style={{ background: color + "22", color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex gap-1 justify-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-etcha-copper"
          style={{
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.4,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}

interface ResultPanelProps {
  mode: "buy" | "write";
  direction: "bull" | "bear";
  assetSlug: string;
  assetLabel: string;
  spotPrice: number;
  strike: number;
  premium: number;
  sigmaPct: number;
  expiryLabel: string;
  expiryDays: number;
  checking: boolean;
  marketResult: MarketResult | null;
  onReset: () => void;
  onSwitchToWrite: () => void;
}

export function ResultPanel({
  mode,
  direction,
  assetSlug,
  assetLabel,
  spotPrice,
  strike,
  premium,
  sigmaPct,
  expiryLabel,
  expiryDays,
  checking,
  marketResult,
  onReset,
  onSwitchToWrite,
}: ResultPanelProps) {
  const isBuy = mode === "buy";
  const isBull = direction === "bull";
  const chartType = isBuy
    ? isBull ? "buy_call" as const : "buy_put" as const
    : isBull ? "write_call" as const : "write_put" as const;
  const chartColor = isBuy ? (isBull ? "#34d399" : "#f87171") : "#c87941";

  const writeUrl = `/app/trade/${assetSlug}/write?strike=${strike.toFixed(
    strike >= 100 ? 0 : strike >= 1 ? 2 : 4
  )}&expiry=${expiryDays}&type=${isBull ? "call" : "put"}`;

  return (
    <div>
      {/* Strategy badge */}
      <div className="bg-etcha-surface border border-etcha-border rounded-lg p-3.5 mb-5">
        <div className="text-[11px] text-etcha-text-secondary font-mono mb-2">YOUR STRATEGY</div>
        <div className="flex gap-2 flex-wrap">
          <Tag color={chartColor}>
            {isBuy ? (isBull ? "BUY CALL" : "BUY PUT") : (isBull ? "WRITE CALL" : "WRITE PUT")}
          </Tag>
          <Tag color="#c87941">{assetLabel} &middot; {expiryLabel}</Tag>
          <Tag color="#8891a5">strike {fmt(strike)}</Tag>
        </div>
      </div>

      {/* ── BUY PATH ── */}
      {isBuy && checking && (
        <div className="text-center py-10">
          <div className="text-[26px] mb-4">&#x1F50D;</div>
          <div className="text-base font-bold mb-2">Scanning the market...</div>
          <div className="text-[13px] text-etcha-text-dim mb-5">
            Looking for {isBull ? "calls" : "puts"} on {assetLabel} near strike {fmt(strike)}
          </div>
          <Spinner />
        </div>
      )}

      {isBuy && !checking && marketResult?.found && (
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">&#x2705;</span>
            <h2 className="text-[22px] font-extrabold text-etcha-green">Match found!</h2>
          </div>
          <p className="text-etcha-text-dim text-sm mb-4">
            Someone already wrote this contract. Buy it right now — no waiting.
          </p>

          {marketResult.listings.map((l, i) => (
            <div
              key={i}
              className="bg-[#0d1a15] border border-etcha-green/25 rounded-lg p-4 mb-4"
            >
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "PREMIUM", value: fmt(l.premium) + "/token", color: "#34d399" },
                  { label: "STRIKE", value: fmt(l.strike), color: "#aaa" },
                  { label: "AVAILABLE", value: l.available + " tokens", color: "#aaa" },
                ].map((k) => (
                  <div key={k.label}>
                    <div className="text-[10px] text-etcha-text-dim font-mono tracking-wide mb-0.5">
                      {k.label}
                    </div>
                    <div
                      className="text-[13px] font-bold font-mono"
                      style={{ color: k.color }}
                    >
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-etcha-text-dim font-mono mb-3">
                Writer: {l.writer} &middot; {isBull ? "Call" : "Put"} &middot; {expiryLabel}
              </div>
              <PayoffChart
                type={chartType}
                spot={spotPrice}
                strike={l.strike}
                premium={l.premium}
                assetLabel={assetLabel}
              />
            </div>
          ))}

          <Link
            href={`/app/trade/${assetSlug}`}
            className="block w-full rounded-lg bg-etcha-green text-[#0a0c10] font-bold text-[15px] py-3.5 text-center mb-2.5 hover:opacity-90 transition-opacity"
          >
            Buy this contract on Etcha &rarr;
          </Link>
          <button
            onClick={onReset}
            className="w-full rounded-lg bg-transparent text-etcha-copper font-bold text-sm py-3 border-[1.5px] border-etcha-copper hover:bg-etcha-copper/10 transition-colors cursor-pointer"
          >
            &#x21BA; Start over
          </button>
        </div>
      )}

      {isBuy && !checking && marketResult && !marketResult.found && (
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">&#x1F4ED;</span>
            <h2 className="text-[22px] font-extrabold">Nothing listed yet</h2>
          </div>
          <p className="text-etcha-text-dim text-sm mb-5">
            No one has written this contract yet.
          </p>

          {/* Nudge to write */}
          <div className="bg-etcha-surface border border-etcha-copper/30 rounded-lg p-4 mb-3">
            <div className="font-bold text-[15px] text-etcha-copper mb-1.5">
              &#x1F4A1; Flip it — write it yourself
            </div>
            <div className="text-[13px] text-etcha-text-dim leading-relaxed mb-3">
              No one has listed this contract yet, which means the market needs
              someone to write it. You can be that person — lock collateral,
              collect premium, and let someone else buy your contract.
            </div>
            <button
              onClick={onSwitchToWrite}
              className="w-full rounded-lg bg-etcha-copper text-[#0a0c10] font-bold text-sm py-3 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Switch to write mode &rarr;
            </button>
          </div>

          {/* Check back */}
          <div className="bg-etcha-surface border border-etcha-border rounded-lg p-4 mb-5">
            <div className="font-bold text-[15px] mb-1.5">
              &#x1F440; Check back later
            </div>
            <div className="text-[13px] text-etcha-text-dim leading-relaxed">
              New contracts get written regularly as the market grows.
            </div>
            <Link
              href={`/app/trade/${assetSlug}`}
              className="inline-block mt-2.5 text-[13px] text-etcha-copper font-mono hover:underline"
            >
              Browse {assetLabel} chain &rarr;
            </Link>
          </div>

          <button
            onClick={onReset}
            className="w-full rounded-lg bg-transparent text-etcha-copper font-bold text-sm py-3 border-[1.5px] border-etcha-copper hover:bg-etcha-copper/10 transition-colors cursor-pointer"
          >
            &#x21BA; Start over
          </button>
        </div>
      )}

      {/* ── WRITE PATH ── */}
      {!isBuy && (
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">&#x270D;&#xFE0F;</span>
            <h2 className="text-[22px] font-extrabold text-etcha-copper">
              Your contract summary
            </h2>
          </div>
          <p className="text-etcha-text-dim text-sm mb-5">
            Lock collateral, mint the contract, collect premium. Here&apos;s
            exactly what happens.
          </p>

          {/* Writer payoff chart */}
          <PayoffChart
            type={chartType}
            spot={spotPrice}
            strike={strike}
            premium={premium}
            assetLabel={assetLabel}
          />

          {/* Plain English */}
          <div className="bg-etcha-surface border border-etcha-border rounded-lg p-4 mt-4 mb-4">
            <div className="text-[11px] text-etcha-copper font-mono font-semibold mb-2">
              PLAIN ENGLISH
            </div>
            <p className="text-sm text-etcha-text-secondary leading-relaxed">
              You collect{" "}
              <strong className="text-etcha-text-primary">
                {fmt(premium)} per {assetLabel}
              </strong>{" "}
              upfront. You lock{" "}
              <strong className="text-etcha-text-primary">
                {isBull ? `${assetLabel} tokens` : "stablecoins"}
              </strong>{" "}
              as collateral. If {assetLabel}{" "}
              {isBull ? "stays below" : "stays above"}{" "}
              <strong className="text-etcha-text-primary">{fmt(strike)}</strong> at
              expiry, you keep the premium and collateral is returned. If it{" "}
              {isBull ? "rises above" : "drops below"} strike, you{" "}
              {isBull
                ? "deliver the tokens at that price"
                : "cover the difference in stablecoins"}
              .
            </p>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "EST. PREMIUM", value: fmt(premium) + " per " + assetLabel, color: "#34d399", sub: `B-S (\u03c3=${sigmaPct.toFixed(1)}%) \u00b7 actual set on write page` },
              { label: "YOU LOCK", value: isBull ? assetLabel + " tokens" : "Stablecoins", color: "#aaa", sub: "released at expiry" },
              { label: "MAX GAIN", value: fmt(premium) + " per " + assetLabel, color: "#c87941", sub: "if expires worthless" },
              { label: "MAX RISK", value: isBull ? "deliver at " + fmt(strike) : "pay difference", color: "#f87171", sub: "if deeply in the money" },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-etcha-surface border border-etcha-border rounded-lg p-3"
              >
                <div className="text-[10px] text-etcha-text-dim font-mono tracking-wide mb-1">
                  {k.label}
                </div>
                <div
                  className="text-[13px] font-bold font-mono"
                  style={{ color: k.color }}
                >
                  {k.value}
                </div>
                <div className="text-[11px] text-etcha-text-dim mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <Link
            href={writeUrl}
            className="block w-full rounded-lg bg-etcha-copper text-[#0a0c10] font-bold text-[15px] py-3.5 text-center mb-2.5 hover:opacity-90 transition-opacity"
          >
            Write this contract on Etcha &rarr;
          </Link>
          <button
            onClick={onReset}
            className="w-full rounded-lg bg-transparent text-etcha-copper font-bold text-sm py-3 border-[1.5px] border-etcha-copper hover:bg-etcha-copper/10 transition-colors cursor-pointer"
          >
            &#x21BA; Start over
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-etcha-border mt-4 font-mono leading-relaxed">
        Estimated premium only. Actual prices set by market.
        <br />
        Options involve risk. Only risk what you can afford to lose.
      </p>
    </div>
  );
}
