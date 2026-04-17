"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { WalletButton } from "./WalletButton";

const ASSET_CATEGORIES = [
  {
    label: "CRYPTO — PHYSICAL DELIVERY",
    assets: [
      { name: "ERG", slug: "erg", badge: "Native" },
      { name: "ETH", slug: "eth", badge: "rsETH" },
      { name: "BTC", slug: "btc", badge: "rsBTC" },
      { name: "BNB", slug: "bnb", badge: "rsBNB" },
      { name: "DOGE", slug: "doge", badge: "rsDOGE" },
      { name: "ADA", slug: "ada", badge: "rsADA" },
    ],
  },
  {
    label: "CRYPTO — CASH SETTLEMENT",
    assets: [
      { name: "HNS", slug: "hns" },
      { name: "CKB", slug: "ckb" },
      { name: "ATOM", slug: "atom" },
      { name: "RON", slug: "ron" },
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

// Flat list of all trade assets for keyboard navigation
const ALL_ASSETS = ASSET_CATEGORIES.flatMap((cat) => cat.assets);

export function Navbar() {
  const pathname = usePathname();
  const [tradeOpen, setTradeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset focus index when menu opens/closes
  useEffect(() => {
    if (!tradeOpen) setFocusIdx(-1);
  }, [tradeOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIdx >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll<HTMLAnchorElement>("[role='menuitem']");
      items[focusIdx]?.focus();
    }
  }, [focusIdx]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!tradeOpen) return;
    const total = ALL_ASSETS.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusIdx((prev) => (prev + 1) % total);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIdx((prev) => (prev - 1 + total) % total);
        break;
      case "Escape":
        e.preventDefault();
        setTradeOpen(false);
        break;
      case "Home":
        e.preventDefault();
        setFocusIdx(0);
        break;
      case "End":
        e.preventDefault();
        setFocusIdx(total - 1);
        break;
    }
  }, [tradeOpen]);

  return (
    <nav className="border-b border-etcha-border bg-[#0a0c10]/85 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/etcha-icon.svg" alt="Etcha" width={28} height={28} />
          <span className="font-mono text-base font-medium tracking-[3px] uppercase text-etcha-copper-light">
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
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && !tradeOpen) {
                  e.preventDefault();
                  setTradeOpen(true);
                  setFocusIdx(0);
                }
              }}
              className={`${pathname.startsWith("/app/trade") ? "text-etcha-text" : "text-etcha-text-secondary"} hover:text-etcha-text transition-colors flex items-center gap-1 font-mono text-sm`}
              aria-label="Trade menu"
              aria-haspopup="menu"
              aria-expanded={tradeOpen}
              {...(pathname.startsWith("/app/trade") ? { "aria-current": "page" as const } : {})}
            >
              Trade
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tradeOpen && (
              <div className="absolute top-full left-0 pt-2 w-72 z-50">
              <div ref={menuRef} onKeyDown={handleMenuKeyDown} className="bg-etcha-bg border border-etcha-border rounded-lg shadow-xl py-1" role="menu">
                {(() => {
                  let idx = 0;
                  return ASSET_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <div className="px-3 py-2 text-[10px] font-bold text-etcha-copper uppercase tracking-widest border-b border-[#1e2330]/50 bg-etcha-surface" role="presentation">
                        {cat.label}
                      </div>
                      {cat.assets.map((asset) => {
                        const thisIdx = idx++;
                        return (
                          <Link
                            key={asset.slug}
                            href={`/app/trade/${asset.slug}`}
                            role="menuitem"
                            tabIndex={focusIdx === thisIdx ? 0 : -1}
                            className={`flex items-center justify-between px-4 py-2 text-sm text-etcha-text transition-colors ${
                              focusIdx === thisIdx ? "bg-etcha-border" : "hover:bg-etcha-border"
                            }`}
                            onClick={() => setTradeOpen(false)}
                          >
                            <span>{asset.name}</span>
                            {"badge" in asset && asset.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#34d399]/10 text-etcha-green rounded">
                                {asset.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
              </div>
            )}
          </div>

          <Link href="/app" className={`${pathname === "/app" ? "text-etcha-text border-b-2 border-etcha-copper pb-0.5" : "text-etcha-text-secondary"} hover:text-etcha-text transition-colors font-mono text-sm`} {...(pathname === "/app" ? { "aria-current": "page" as const } : {})}>
            Dashboard
          </Link>

          <Link href="/app/market" className={`${pathname.startsWith("/app/market") ? "text-etcha-text border-b-2 border-etcha-copper pb-0.5" : "text-etcha-text-secondary"} hover:text-etcha-text transition-colors font-mono text-sm`} {...(pathname.startsWith("/app/market") ? { "aria-current": "page" as const } : {})}>
            Market
          </Link>

          <Link href="/app/portfolio" className={`${pathname.startsWith("/app/portfolio") ? "text-etcha-text border-b-2 border-etcha-copper pb-0.5" : "text-etcha-text-secondary"} hover:text-etcha-text transition-colors font-mono text-sm`} {...(pathname.startsWith("/app/portfolio") ? { "aria-current": "page" as const } : {})}>
            Portfolio
          </Link>

          <Link href="/app/wizard" className={`${pathname.startsWith("/app/wizard") ? "text-etcha-copper-light border-b-2 border-etcha-copper pb-0.5" : "text-etcha-copper"} hover:text-etcha-copper-light transition-colors font-mono text-sm`} {...(pathname.startsWith("/app/wizard") ? { "aria-current": "page" as const } : {})}>
            Wizard
          </Link>

          <WalletButton />
        </div>

        {/* Mobile: wallet + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <WalletButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-etcha-text-secondary hover:text-etcha-text p-2.5"
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
        <div className="md:hidden border-t border-etcha-border bg-etcha-bg px-4 py-4 space-y-3">
          <Link
            href="/app"
            className={`block ${pathname === "/app" ? "text-etcha-text border-l-2 border-etcha-copper pl-2" : "text-etcha-text-secondary"} hover:text-etcha-text font-mono text-sm py-2`}
            onClick={() => setMobileOpen(false)}
            {...(pathname === "/app" ? { "aria-current": "page" as const } : {})}
          >
            Dashboard
          </Link>
          <Link
            href="/app/market"
            className={`block ${pathname.startsWith("/app/market") ? "text-etcha-text border-l-2 border-etcha-copper pl-2" : "text-etcha-text-secondary"} hover:text-etcha-text font-mono text-sm py-2`}
            onClick={() => setMobileOpen(false)}
            {...(pathname.startsWith("/app/market") ? { "aria-current": "page" as const } : {})}
          >
            Market
          </Link>
          <Link
            href="/app/portfolio"
            className={`block ${pathname.startsWith("/app/portfolio") ? "text-etcha-text border-l-2 border-etcha-copper pl-2" : "text-etcha-text-secondary"} hover:text-etcha-text font-mono text-sm py-2`}
            onClick={() => setMobileOpen(false)}
            {...(pathname.startsWith("/app/portfolio") ? { "aria-current": "page" as const } : {})}
          >
            Portfolio
          </Link>
          <Link
            href="/app/wizard"
            className={`block ${pathname.startsWith("/app/wizard") ? "text-etcha-copper-light border-l-2 border-etcha-copper pl-2" : "text-etcha-copper"} hover:text-etcha-copper-light font-mono text-sm py-2`}
            onClick={() => setMobileOpen(false)}
            {...(pathname.startsWith("/app/wizard") ? { "aria-current": "page" as const } : {})}
          >
            Wizard
          </Link>
          <div className="border border-[#c87941]/30 rounded-lg p-3 mt-1 bg-[#c87941]/5">
            <div className="text-[10px] font-bold text-etcha-copper uppercase tracking-widest mb-2">Trade</div>
            {ASSET_CATEGORIES.map((cat, catIdx) => (
              <div key={cat.label}>
                <p className={`text-[10px] uppercase tracking-wider text-[#9da5b8]/60 col-span-3 ${catIdx > 0 ? "mt-2" : ""}`}>
                  {cat.label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {cat.assets.map((asset) => (
                    <Link
                      key={asset.slug}
                      href={`/app/trade/${asset.slug}`}
                      className="text-xs text-etcha-text hover:text-etcha-copper font-mono py-2.5"
                      onClick={() => setMobileOpen(false)}
                    >
                      {asset.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
