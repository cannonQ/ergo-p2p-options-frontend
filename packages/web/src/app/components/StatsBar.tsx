"use client";

interface StatsBarProps {
  volume?: number;
  openInterest?: number;
  activeContracts?: number;
  callCount?: number;
  putCount?: number;
  avgIV?: number | null;
}

function formatUSE(value: number): string {
  if (value === 0) return "0 USE";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M USE`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K USE`;
  return `${value.toLocaleString()} USE`;
}

export function StatsBar({
  volume = 0,
  openInterest = 0,
  activeContracts = 0,
  callCount = 0,
  putCount = 0,
  avgIV = null,
}: StatsBarProps) {
  return (
    <div className="bg-[#0a0e17] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-4 gap-4">
        {/* 24h Volume */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            24h Volume
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {formatUSE(volume)}
          </div>
          <div className="text-[#94a3b8] text-xs">
            {volume === 0 ? "\u2014" : ""}
          </div>
        </div>

        {/* Open Interest */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Open Interest
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {formatUSE(openInterest)}
          </div>
          <div className="text-[#94a3b8] text-xs">
            across {activeContracts} asset{activeContracts !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Active Contracts */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Active Contracts
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {activeContracts}
          </div>
          <div className="text-[#94a3b8] text-xs">
            {callCount} call{callCount !== 1 ? "s" : ""} / {putCount} put{putCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Avg IV (30d) */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Avg IV (30d)
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {avgIV !== null && avgIV !== undefined ? `${avgIV.toFixed(1)}%` : "\u2014"}
          </div>
          <div className="text-[#94a3b8] text-xs">
            {avgIV !== null && avgIV !== undefined ? "" : "\u2014"}
          </div>
        </div>
      </div>
    </div>
  );
}
