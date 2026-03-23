"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletButton } from "./WalletButton";

const ASSET_CATEGORIES = [
  {
    label: "CRYPTO — PHYSICAL DELIVERY",
    assets: [
      { name: "ETH", slug: "eth", badge: "rsETH" },
      { name: "BTC", slug: "btc", badge: "rsBTC" },
      { name: "BNB", slug: "bnb", badge: "rsBNB" },
      { name: "DOGE", slug: "doge", badge: "rsDOGE" },
      { name: "ADA", slug: "ada", badge: "rsADA" },
      { name: "ERG", slug: "erg", badge: "Native" },
    ],
  },
  {
    label: "CRYPTO — CASH SETTLEMENT",
    assets: [
      { name: "HNS", slug: "hns" },
      { name: "CKB", slug: "ckb" },
      { name: "ATOM", slug: "atom" },
      { name: "FIRO", slug: "firo" },
    ],
  },
  {
    label: "COMMODITIES & METALS",
    assets: [
      { name: "Gold", slug: "gold", badge: "DexyGold" },
      { name: "Silver", slug: "silver" },
      { name: "Copper", slug: "copper" },
      { name: "Brent", slug: "brent" },
      { name: "WTI", slug: "wti" },
      { name: "NatGas", slug: "natgas" },
    ],
  },
  {
    label: "INDICES",
    assets: [
      { name: "S&P 500", slug: "spx" },
      { name: "DJI", slug: "dji" },
    ],
  },
];

export function Navbar() {
  const [tradeOpen, setTradeOpen] = useState(false);

  return (
    <nav className="border-b border-[#1e293b] bg-[#131a2a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-[#3b82f6]">
          Ergo Options
        </Link>

        <div className="flex items-center gap-6">
          {/* Trade dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setTradeOpen(false)}
          >
            <button
              onClick={() => setTradeOpen(!tradeOpen)}
              className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors flex items-center gap-1"
            >
              Trade
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tradeOpen && (
              <div className="absolute top-full left-0 pt-2 w-72 z-50">
              <div className="bg-[#0a0e17] border border-[#1e293b] rounded-lg shadow-xl py-1">
                {ASSET_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <div className="px-3 py-2 text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest border-b border-[#1e293b]/50 bg-[#131a2a]">
                      {cat.label}
                    </div>
                    {cat.assets.map((asset) => (
                      <Link
                        key={asset.slug}
                        href={`/trade/${asset.slug}`}
                        className="flex items-center justify-between px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#1e293b] transition-colors"
                        onClick={() => setTradeOpen(false)}
                      >
                        <span>{asset.name}</span>
                        {"badge" in asset && asset.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded">
                            {asset.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
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
