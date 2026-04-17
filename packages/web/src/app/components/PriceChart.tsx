"use client";

import { useState, useRef, useCallback } from "react";

interface PriceChartProps {
  data: { price: number; timestamp: string }[];
  assetName: string;
  strikePrice?: number; // optional horizontal line for strike
  change7d?: number;
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PriceChart({ data, assetName, strikePrice, change7d }: PriceChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Handle mouse/touch interaction — must be before any early return
  const handleMove = useCallback((clientX: number) => {
    if (!svgRef.current || data.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 600;
    const idx = Math.round((x / 600) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

  if (data.length < 2) {
    return (
      <div className="bg-etcha-surface border border-etcha-border rounded-lg px-4 py-6 text-center text-sm text-etcha-text-secondary">
        Price history unavailable
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const currentPrice = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  // SVG dimensions
  const W = 600;
  const H = 160;
  const padT = 8;
  const padB = 20;
  const chartW = W;
  const chartH = H - padT - padB;

  const toX = (i: number) => (i / (prices.length - 1)) * chartW;
  const toY = (p: number) => padT + (1 - (p - min) / range) * chartH;

  const points = prices.map((p, i) => `${toX(i)},${toY(p)}`).join(" ");
  const areaPath = `M ${points.split(" ").map((p, i) => (i === 0 ? p : `L ${p}`)).join(" ")} L ${toX(prices.length - 1)},${padT + chartH} L 0,${padT + chartH} Z`;

  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? "#34d399" : "#f87171";

  // Day labels along x-axis
  const dayLabels: { x: number; label: string }[] = [];
  let lastDay = "";
  for (let i = 0; i < data.length; i++) {
    const day = formatDate(data[i].timestamp);
    if (day !== lastDay) {
      dayLabels.push({ x: toX(i), label: day });
      lastDay = day;
    }
  }

  const hoverPrice = hoverIdx !== null ? prices[hoverIdx] : null;
  const hoverTs = hoverIdx !== null ? data[hoverIdx]?.timestamp : null;

  return (
    <div className="bg-etcha-surface border border-etcha-border rounded-lg px-4 pt-3 pb-2 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-etcha-text">{assetName}/USD</span>
          <span className="text-xs text-etcha-text-secondary">7D</span>
        </div>
        <div className="flex items-center gap-3">
          {hoverPrice !== null ? (
            <>
              <span className="text-sm font-mono text-etcha-copper-light">${formatPrice(hoverPrice)}</span>
              {hoverTs && (
                <span className="text-xs text-etcha-text-secondary">
                  {new Date(hoverTs).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-mono text-etcha-copper-light">${formatPrice(currentPrice)}</span>
              {change7d !== undefined && (
                <span className={`text-xs font-mono font-semibold ${change7d >= 0 ? "text-etcha-green" : "text-etcha-red"}`}>
                  {change7d >= 0 ? "+" : ""}{change7d.toFixed(1)}%
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chart SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: "160px" }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIdx(null)}
      >
        {/* Area fill */}
        <path d={areaPath} fill={`${color}10`} />

        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />

        {/* Strike price line */}
        {strikePrice !== undefined && strikePrice > 0 && strikePrice >= min * 0.8 && strikePrice <= max * 1.2 && (
          <>
            <line
              x1={0}
              y1={toY(strikePrice)}
              x2={chartW}
              y2={toY(strikePrice)}
              stroke="#c87941"
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.6}
            />
            <text
              x={chartW - 4}
              y={toY(strikePrice) - 4}
              fill="#c87941"
              fontSize="10"
              textAnchor="end"
              opacity={0.8}
            >
              strike
            </text>
          </>
        )}

        {/* Current price dot */}
        <circle
          cx={toX(prices.length - 1)}
          cy={toY(currentPrice)}
          r={3}
          fill={color}
        />

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <>
            <line
              x1={toX(hoverIdx)}
              y1={padT}
              x2={toX(hoverIdx)}
              y2={padT + chartH}
              stroke="#9da5b8"
              strokeWidth={0.5}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <circle
              cx={toX(hoverIdx)}
              cy={toY(prices[hoverIdx])}
              r={4}
              fill={color}
              stroke="#12151c"
              strokeWidth={2}
            />
          </>
        )}

        {/* Y-axis labels: min and max */}
        <text x={4} y={padT + 10} fill="#9da5b8" fontSize="9" opacity={0.6}>${formatPrice(max)}</text>
        <text x={4} y={padT + chartH - 2} fill="#9da5b8" fontSize="9" opacity={0.6}>${formatPrice(min)}</text>

        {/* X-axis day labels */}
        {dayLabels.map((d, i) => (
          <text
            key={i}
            x={d.x}
            y={H - 4}
            fill="#9da5b8"
            fontSize="9"
            textAnchor="middle"
            opacity={0.5}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
