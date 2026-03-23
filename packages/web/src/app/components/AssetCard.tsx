"use client";

import Link from "next/link";

interface AssetCardProps {
  name: string;
  slug: string;
  price?: number;
  optionCount?: number;
  badge?: string;
  change24h?: number;
  sparkline?: number[];
  openInterest?: number;
  ivRank?: number;
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function MiniSparkline({ data, isUp }: { data: number[]; isUp?: boolean }) {
  if (data.length < 2) return null;

  const width = 60;
  const height = 20;
  const padding = 1;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (v - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  // Sparkline color follows its own visible shape (last vs first point)
  // This matches what the user sees — line going up = green, down = red
  const color = data[data.length - 1] >= data[0] ? "#22c55e" : "#ef4444";

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AssetCard({
  name,
  slug,
  price,
  optionCount = 0,
  badge,
  change24h,
  sparkline,
  openInterest,
  ivRank,
}: AssetCardProps) {
  return (
    <Link
      href={`/trade/${slug}`}
      className="block p-4 bg-[#131a2a] border border-[#1e293b] rounded-lg hover:border-[#3b82f6] transition-colors group"
    >
      {/* Name + Badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg font-bold text-[#e2e8f0] group-hover:text-[#3b82f6] transition-colors">
          {name}
        </span>
        {badge && (
          <span className="text-[9px] px-1 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded">
            {badge}
          </span>
        )}
      </div>

      {/* Sparkline + 24h change */}
      {(sparkline || change24h !== undefined) && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex-shrink-0">
            {sparkline && sparkline.length >= 2 && (
              <MiniSparkline data={sparkline} isUp={change24h !== undefined ? change24h >= 0 : undefined} />
            )}
          </div>
          {change24h !== undefined && (
            <span
              className={`text-xs font-mono font-semibold ${
                change24h >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {formatChange(change24h)}
            </span>
          )}
        </div>
      )}

      <div className="text-xl font-mono text-[#eab308] mb-2">
        {price !== undefined && price > 0 ? `$${formatPrice(price)}` : "\u2014"}
      </div>

      <div className="text-sm text-[#94a3b8]">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>

      {(openInterest !== undefined || ivRank !== undefined) && (
        <div className="text-xs text-[#94a3b8] mt-1">
          {openInterest !== undefined && (
            <span>OI: {openInterest.toLocaleString()} USE</span>
          )}
          {openInterest !== undefined && ivRank !== undefined && (
            <span>{"  "}</span>
          )}
          {ivRank !== undefined && (
            <span>IV rank: {ordinalSuffix(ivRank)}</span>
          )}
        </div>
      )}
    </Link>
  );
}
