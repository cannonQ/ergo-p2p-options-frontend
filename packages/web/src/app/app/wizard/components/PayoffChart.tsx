"use client";

function buildPayoff(
  type: "buy_call" | "buy_put" | "write_call" | "write_put",
  spot: number,
  strike: number,
  premium: number,
): { price: number; pnl: number }[] {
  return Array.from({ length: 61 }, (_, i) => {
    const px = spot * 0.5 + spot * 1.1 * (i / 60);
    let pnl: number;
    switch (type) {
      case "buy_call":   pnl = Math.max(0, px - strike) - premium; break;
      case "buy_put":    pnl = Math.max(0, strike - px) - premium; break;
      case "write_call": pnl = premium - Math.max(0, px - strike); break;
      case "write_put":  pnl = premium - Math.max(0, strike - px); break;
    }
    return { price: px, pnl: parseFloat(pnl.toFixed(6)) };
  });
}

function fmt(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toFixed(2);
  return "$" + p.toFixed(4);
}

interface PayoffChartProps {
  type: "buy_call" | "buy_put" | "write_call" | "write_put";
  spot: number;
  strike: number;
  premium: number;
  assetLabel: string;
}

export function PayoffChart({ type, spot, strike, premium, assetLabel }: PayoffChartProps) {
  const data = buildPayoff(type, spot, strike, premium);
  const isBuy = type.startsWith("buy");
  const isCall = type.includes("call");
  const breakeven = isCall ? strike + premium : strike - premium;

  const color = isBuy ? (isCall ? "#34d399" : "#f87171") : "#c87941";

  // SVG dimensions
  const W = 400;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 48 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Scales
  const prices = data.map((d) => d.price);
  const pnls = data.map((d) => d.pnl);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minPnl = Math.min(...pnls);
  const maxPnl = Math.max(...pnls);
  const pnlRange = maxPnl - minPnl || 1;

  const xScale = (v: number) => PAD.left + ((v - minP) / (maxP - minP)) * plotW;
  const yScale = (v: number) => PAD.top + (1 - (v - minPnl) / pnlRange) * plotH;

  // Build polyline
  const points = data.map((d) => `${xScale(d.price)},${yScale(d.pnl)}`).join(" ");

  // Fill area: close the polygon along the zero line or bottom
  const zeroY = yScale(0);
  const clampedZeroY = Math.max(PAD.top, Math.min(PAD.top + plotH, zeroY));
  const areaPoints = data
    .map((d) => `${xScale(d.price)},${yScale(d.pnl)}`)
    .join(" ");
  const firstX = xScale(data[0].price);
  const lastX = xScale(data[data.length - 1].price);
  const areaPath = `M ${areaPoints.split(" ").map((p) => p).join(" L ")} L ${lastX},${clampedZeroY} L ${firstX},${clampedZeroY} Z`;

  // Reference line positions
  const spotX = xScale(spot);
  const beX = xScale(breakeven);

  // Profit/loss zone descriptions
  const profitZone = isBuy
    ? isCall
      ? `profit if ${assetLabel} rises above ${fmt(breakeven)}`
      : `profit if ${assetLabel} drops below ${fmt(breakeven)}`
    : isCall
      ? `keep premium if ${assetLabel} stays below ${fmt(strike)}`
      : `keep premium if ${assetLabel} stays above ${fmt(strike)}`;
  const lossZone = isBuy
    ? `max loss: ${fmt(premium)} per ${assetLabel} (your premium)`
    : "loss if deeply in the money";

  const bePct = (((breakeven - spot) / spot) * 100).toFixed(1);

  return (
    <div className="bg-[#0f0f0f] border border-etcha-border rounded-lg p-3">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 px-1">
        <span className="text-[11px] font-mono font-semibold tracking-wide text-etcha-copper">
          PAYOFF AT EXPIRY
        </span>
        <span className="text-[11px] font-mono" style={{ color }}>
          breakeven {fmt(breakeven)} ({Number(bePct) >= 0 ? "+" : ""}{bePct}%)
        </span>
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wizGradUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="wizGradDn" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="wizGradCopper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c87941" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#c87941" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={isBuy ? "url(#wizGradUp)" : type.includes("write") ? "url(#wizGradCopper)" : "url(#wizGradDn)"}
        />

        {/* Zero line (P&L = 0) */}
        <line
          x1={PAD.left} y1={clampedZeroY} x2={PAD.left + plotW} y2={clampedZeroY}
          stroke="#333" strokeDasharray="4 3"
        />
        <text x={PAD.left + plotW - 2} y={clampedZeroY - 4} fill="#444" fontSize={8} fontFamily="monospace" textAnchor="end">
          $0
        </text>

        {/* Spot reference — label at bottom to avoid overlap */}
        <line x1={spotX} y1={PAD.top} x2={spotX} y2={PAD.top + plotH} stroke="#c87941" strokeDasharray="4 3" />
        <text x={spotX} y={PAD.top + plotH + 10} fill="#c87941" fontSize={8} fontFamily="monospace" textAnchor="middle">
          now
        </text>

        {/* Breakeven reference — label at top */}
        <line x1={beX} y1={PAD.top} x2={beX} y2={PAD.top + plotH} stroke={color} strokeDasharray="2 3" />
        <text x={beX} y={PAD.top - 2} fill={color} fontSize={8} fontFamily="monospace" textAnchor="middle">
          B/E
        </text>

        {/* Payoff curve */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis labels */}
        <text x={PAD.left - 4} y={PAD.top + 10} fill="#34d399" fontSize={9} fontFamily="monospace" textAnchor="end">
          profit
        </text>
        <text x={PAD.left - 4} y={PAD.top + plotH} fill="#f87171" fontSize={9} fontFamily="monospace" textAnchor="end">
          loss
        </text>

        {/* X-axis label */}
        <text x={PAD.left + plotW / 2} y={H - 4} fill="#555" fontSize={9} fontFamily="monospace" textAnchor="middle">
          {assetLabel} price at expiry
        </text>

        {/* X-axis ticks */}
        <text x={PAD.left} y={H - 14} fill="#444" fontSize={8} fontFamily="monospace" textAnchor="start">
          {fmt(minP)}
        </text>
        <text x={PAD.left + plotW} y={H - 14} fill="#444" fontSize={8} fontFamily="monospace" textAnchor="end">
          {fmt(maxP)}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 px-1 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-etcha-green/25 border border-etcha-green/40 shrink-0" />
          <span className="text-[11px] font-mono text-etcha-green">{profitZone}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-etcha-red/25 border border-etcha-red/40 shrink-0" />
          <span className="text-[11px] font-mono text-etcha-red">{lossZone}</span>
        </div>
      </div>
    </div>
  );
}
