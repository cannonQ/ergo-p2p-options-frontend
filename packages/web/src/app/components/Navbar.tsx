"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletButton } from "./WalletButton";

const ASSET_CATEGORIES = {
  Crypto: [
    { name: "ETH", index: 0 },
    { name: "BTC", index: 1 },
    { name: "BNB", index: 2 },
    { name: "DOGE", index: 3 },
    { name: "ADA", index: 4 },
    { name: "ERG", index: 17 },
  ],
  "Commodities & Metals": [
    { name: "Gold", index: 18 },
    { name: "Brent", index: 13 },
    { name: "WTI", index: 14 },
    { name: "NatGas", index: 15 },
    { name: "Lithium", index: 16 },
  ],
  Indices: [
    { name: "S&P 500", index: 9 },
    { name: "DJI", index: 10 },
  ],
};

export function Navbar() {
  const [tradeOpen, setTradeOpen] = useState(false);

  return (
    <nav className="border-b border-[#1e293b] bg-[#131a2a]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-[#3b82f6]">
          Ergo Options
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          {/* Trade dropdown */}
          <div className="relative">
            <button
              onClick={() => setTradeOpen(!tradeOpen)}
              onBlur={() => setTimeout(() => setTradeOpen(false), 150)}
              className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors flex items-center gap-1"
            >
              Trade
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tradeOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#131a2a] border border-[#1e293b] rounded-lg shadow-xl z-50 py-2">
                {Object.entries(ASSET_CATEGORIES).map(([category, assets]) => (
                  <div key={category}>
                    <div className="px-3 py-1 text-xs text-[#94a3b8] uppercase tracking-wider">
                      {category}
                    </div>
                    {assets.map((asset) => (
                      <Link
                        key={asset.index}
                        href={`/trade/${asset.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        className="block px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#1e293b] transition-colors"
                        onClick={() => setTradeOpen(false)}
                      >
                        {asset.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link href="/market" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            Market
          </Link>

          <Link href="/portfolio" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            Portfolio
          </Link>

          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
