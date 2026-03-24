"use client";

import { useEffect, useState } from "react";

interface StatsData {
  activeContracts: number;
  callCount: number;
  putCount: number;
  openInterestErg: number;
}

function formatERG(value: number): string {
  if (value === 0) return "0 ERG";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ERG`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ERG`;
  if (value >= 1) return `${value.toFixed(2)} ERG`;
  return `${value.toFixed(4)} ERG`;
}

export function StatsBar() {
  const [stats, setStats] = useState<StatsData>({
    activeContracts: 0,
    callCount: 0,
    putCount: 0,
    openInterestErg: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    // Refresh every 60s
    const interval = setInterval(fetchStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-[#0a0e17] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-4 gap-4">
        {/* 24h Volume */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            24h Volume
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {"\u2014"}
          </div>
          <div className="text-[#94a3b8] text-xs">
            coming soon
          </div>
        </div>

        {/* Open Interest */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Open Interest
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {loading ? "\u2014" : formatERG(stats.openInterestErg)}
          </div>
          <div className="text-[#94a3b8] text-xs">
            across {stats.activeContracts} contract{stats.activeContracts !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Active Contracts */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Active Contracts
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {loading ? "\u2014" : stats.activeContracts}
          </div>
          <div className="text-[#94a3b8] text-xs">
            {stats.callCount} call{stats.callCount !== 1 ? "s" : ""} / {stats.putCount} put{stats.putCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Avg IV (30d) */}
        <div>
          <div className="text-[#94a3b8] text-xs uppercase tracking-wider mb-1">
            Avg IV (30d)
          </div>
          <div className="text-[#e2e8f0] text-lg font-mono font-bold">
            {"\u2014"}
          </div>
          <div className="text-[#94a3b8] text-xs">
            {"\u2014"}
          </div>
        </div>
      </div>
    </div>
  );
}
