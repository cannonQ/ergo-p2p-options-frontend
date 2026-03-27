"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-[#1e2330] bg-[#0a0c10]/85 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/etcha-icon.svg" alt="Etcha" width={28} height={28} />
          <span className="font-mono text-base font-medium tracking-[3px] uppercase text-[#e09a5f]">
            Etcha
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {/* Trade dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setTradeOpen(false)}
          >
            <button
              onClick={() => setTradeOpen(!tradeOpen)}
              className="text-[#8891a5] hover:text-[#e8eaf0] transition-colors flex items-center gap-1 font-mono text-sm"
              aria-label="Trade menu"
              aria-haspopup="menu"
              aria-expanded={tradeOpen}
            >
              Trade
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tradeOpen && (
              <div className="absolute top-full left-0 pt-2 w-72 z-50">
              <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg shadow-xl py-1" role="menu">
                {ASSET_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <div className="px-3 py-2 text-[10px] font-bold text-[#c87941] uppercase tracking-widest border-b border-[#1e2330]/50 bg-[#12151c]">
                      {cat.label}
                    </div>
                    {cat.assets.map((asset) => (
                      <Link
                        key={asset.slug}
                        href={`/app/trade/${asset.slug}`}
                        className="flex items-center justify-between px-4 py-2 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
                        onClick={() => setTradeOpen(false)}
                      >
                        <span>{asset.name}</span>
                        {"badge" in asset && asset.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#34d399]/10 text-[#34d399] rounded">
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

          <Link href="/app" className="text-[#8891a5] hover:text-[#e8eaf0] transition-colors font-mono text-sm">
            Dashboard
          </Link>

          <Link href="/app/market" className="text-[#8891a5] hover:text-[#e8eaf0] transition-colors font-mono text-sm">
            Market
          </Link>

          <Link href="/app/portfolio" className="text-[#8891a5] hover:text-[#e8eaf0] transition-colors font-mono text-sm">
            Portfolio
          </Link>

          <WalletButton />
        </div>

        {/* Mobile: wallet + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <WalletButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-[#8891a5] hover:text-[#e8eaf0] p-1"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1e2330] bg-[#0a0c10] px-4 py-4 space-y-3">
          <Link
            href="/app"
            className="block text-[#8891a5] hover:text-[#e8eaf0] font-mono text-sm py-2"
            onClick={() => setMobileOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/app/market"
            className="block text-[#8891a5] hover:text-[#e8eaf0] font-mono text-sm py-2"
            onClick={() => setMobileOpen(false)}
          >
            Market
          </Link>
          <Link
            href="/app/portfolio"
            className="block text-[#8891a5] hover:text-[#e8eaf0] font-mono text-sm py-2"
            onClick={() => setMobileOpen(false)}
          >
            Portfolio
          </Link>
          <div className="border-t border-[#1e2330] pt-3">
            <div className="text-[10px] font-bold text-[#c87941] uppercase tracking-widest mb-2">Trade</div>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_CATEGORIES.flatMap((cat) =>
                cat.assets.map((asset) => (
                  <Link
                    key={asset.slug}
                    href={`/app/trade/${asset.slug}`}
                    className="text-xs text-[#e8eaf0] hover:text-[#c87941] font-mono py-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    {asset.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
