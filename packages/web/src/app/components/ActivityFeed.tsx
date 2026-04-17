"use client";

import { useState, useEffect } from "react";

interface ActivityItem {
  type: "BUY" | "WRITE" | "EXERCISE" | "SELL" | "CLOSE";
  timestamp: string;       // relative time ("2m", "8m", "1h")
  description: string;     // e.g. "1x ETH $2050 Call"
  amount?: string;         // e.g. "0.08 USE"
  txId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  BUY: "text-etcha-green",
  WRITE: "text-etcha-copper",
  EXERCISE: "text-etcha-copper-light",
  SELL: "text-etcha-purple",
  CLOSE: "text-etcha-text-secondary",
};

interface ActivityFeedProps {
  /** Maximum items to show */
  maxItems?: number;
}

export function ActivityFeed({ maxItems = 8 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent activity from API
    // For now, returns empty — will populate when options exist on-chain
    fetch("/api/activity")
      .then((r) => {
        if (r.ok) return r.json();
        return { items: [] };
      })
      .then((data) => {
        setActivities((data.items ?? []).slice(0, maxItems));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [maxItems]);

  return (
    <div className="bg-etcha-surface border border-etcha-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-etcha-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-etcha-text">Live Activity</h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${activities.length > 0 ? "bg-etcha-green animate-pulse" : "bg-etcha-text-secondary"}`} />
          <span className="text-xs text-etcha-text-secondary">
            {activities.length > 0 ? "Live" : "Waiting for activity"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-etcha-text-secondary text-sm">Loading...</div>
      ) : activities.length > 0 ? (
        <div className="divide-y divide-[#1e2330]/50">
          {activities.map((item, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#1e2330]/30 transition-colors">
              <span className={`text-xs font-bold w-16 ${TYPE_COLORS[item.type] ?? "text-etcha-text-secondary"}`}>
                {item.type}
              </span>
              <span className="text-xs text-etcha-text-secondary w-8">
                {item.timestamp}
              </span>
              <span className="text-sm text-etcha-text flex-1 truncate">
                {item.description}
              </span>
              {item.amount && (
                <span className="text-sm font-mono text-etcha-copper-light whitespace-nowrap">
                  {item.amount}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-etcha-text-secondary text-sm">
          <p>No recent activity</p>
          <p className="text-xs text-[#9da5b8]/60 mt-1">
            Writes, buys, and exercises will appear here in real-time
          </p>
        </div>
      )}
    </div>
  );
}
