"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav>
      <div className="container">
        <Link href="/" className="nav-logo">
          <Image src="/etcha-icon.svg" alt="Etcha" width={36} height={36} className="logo-mark" />
          <span className="logo-text">Etcha</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#markets">Markets</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#how-it-works">Deep Dive</a></li>
          <li><a href="#learn">Learn</a></li>
          <li><a href="#compare">Compare</a></li>
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Hamburger — visible only on mobile (nav-links hidden at 768px) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="landing-hamburger"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/app" className="btn-launch">Launch App &rarr;</Link>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="landing-mobile-menu" style={{
          display: "flex",
          flexDirection: "column",
          padding: "12px 24px 20px",
        }}>
          <a href="#products" onClick={() => setMenuOpen(false)}>Products</a>
          <a href="#markets" onClick={() => setMenuOpen(false)}>Markets</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>Deep Dive</a>
          <a href="#learn" onClick={() => setMenuOpen(false)}>Learn</a>
          <a href="#compare" onClick={() => setMenuOpen(false)}>Compare</a>
        </div>
      )}
    </nav>
  );
}
