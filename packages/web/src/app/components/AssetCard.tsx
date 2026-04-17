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

function MiniSparkline({ data, isUp: _isUp }: { data: number[]; isUp?: boolean }) {
  if (data.length < 2) return null;

  const width = 120;
  const height = 28;
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

  const isPositive = _isUp ?? (data[data.length - 1] >= data[0]);
  const color = isPositive ? "#34d399" : "#f87171";
  const fillColor = isPositive ? "#34d39910" : "#f8717110";

  const areaPath = `M ${points.split(" ").join(" L ")} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} className="block w-full">
      <path d={areaPath} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
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
      href={`/app/trade/${slug}`}
      className="block p-4 bg-etcha-surface border border-etcha-border rounded-lg hover:border-etcha-copper transition-colors group"
    >
      {/* Name + Badge + 24h change */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-etcha-text group-hover:text-etcha-copper-light transition-colors">
            {name}
          </span>
          {badge && (
            <span className="text-[9px] px-1 py-0.5 bg-[#34d399]/10 text-etcha-green rounded">
              {badge}
            </span>
          )}
        </div>
        {change24h !== undefined && (
          <span
            className={`text-xs font-mono font-semibold ${
              change24h >= 0 ? "text-etcha-green" : "text-etcha-red"
            }`}
          >
            {formatChange(change24h)}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="text-xl font-mono text-etcha-copper-light mb-1">
        {price !== undefined && price > 0 ? `$${formatPrice(price)}` : "\u2014"}
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length >= 2 && (
        <div className="mb-1 -mx-1">
          <MiniSparkline data={sparkline} isUp={change24h !== undefined ? change24h >= 0 : undefined} />
        </div>
      )}

      <div className="text-sm text-etcha-text-secondary">
        {optionCount} option{optionCount !== 1 ? "s" : ""}
      </div>

      {(openInterest !== undefined || ivRank !== undefined) && (
        <div className="text-xs text-etcha-text-secondary mt-1">
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
