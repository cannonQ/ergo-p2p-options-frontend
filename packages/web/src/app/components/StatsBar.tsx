"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";

interface StatsData {
  activeContracts: number;
  callCount: number;
  putCount: number;
  openInterestErg: number;
  currentHeight?: number;
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
    const interval = setInterval(fetchStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="hidden md:block bg-etcha-bg border-b border-etcha-border">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 gap-4">
        {/* Open Interest */}
        <div>
          <div className="text-etcha-text-dim text-[11px] font-mono uppercase tracking-[1.5px] mb-1">
            Open Interest
          </div>
          <div className="text-etcha-text text-lg font-mono font-bold">
            {loading ? <Skeleton className="h-6 w-24 inline-block" /> : formatERG(stats.openInterestErg)}
          </div>
          <div className="text-etcha-text-secondary text-xs">
            across {stats.activeContracts} contract{stats.activeContracts !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Active Contracts */}
        <div>
          <div className="text-etcha-text-dim text-[11px] font-mono uppercase tracking-[1.5px] mb-1">
            Active Contracts
          </div>
          <div className="text-etcha-text text-lg font-mono font-bold">
            {loading ? <Skeleton className="h-6 w-12 inline-block" /> : stats.activeContracts}
          </div>
          <div className="text-etcha-text-secondary text-xs">
            {stats.callCount} call{stats.callCount !== 1 ? "s" : ""} / {stats.putCount} put{stats.putCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Block Height */}
        <div>
          <div className="text-etcha-text-dim text-[11px] font-mono uppercase tracking-[1.5px] mb-1">
            Block Height
          </div>
          <div className="text-etcha-text text-lg font-mono font-bold">
            {loading ? <Skeleton className="h-6 w-28 inline-block" /> : (stats.currentHeight?.toLocaleString() ?? "\u2014")}
          </div>
          <div className="text-etcha-text-secondary text-xs">
            ~2 min/block
          </div>
        </div>
      </div>
    </div>
  );
}
