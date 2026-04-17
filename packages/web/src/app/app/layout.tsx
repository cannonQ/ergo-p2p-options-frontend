import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { StatsBar } from "../components/StatsBar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastProvider } from "../components/Toast";
import { WizardBanner } from "../components/WizardBanner";

export const metadata: Metadata = {
  title: {
    template: "%s — Etcha",
    default: "Etcha — Decentralized Options on Ergo",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-etcha-copper focus:text-white focus:rounded-lg">
        Skip to main content
      </a>
      <Navbar />
      <StatsBar />
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-6">
        <WizardBanner />
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <footer className="border-t border-etcha-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-etcha-text-secondary">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-etcha-copper font-semibold">Etcha</span>
            <span className="text-[#9da5b8]/50">|</span>
            <span>Decentralized options on Ergo</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs">
            <Link href="/learn/calls-and-puts" className="hover:text-etcha-text transition-colors">Learn</Link>
            <Link href="/how-it-works/writing-an-option" className="hover:text-etcha-text transition-colors">How It Works</Link>
            <a href="https://github.com/cannonQ/ergo-p2p-options-frontend" target="_blank" rel="noopener noreferrer" className="hover:text-etcha-text transition-colors">GitHub</a>
            <a href="https://t.me/degensworld_official" target="_blank" rel="noopener noreferrer" className="hover:text-etcha-text transition-colors">Telegram</a>
          </div>
        </div>
      </footer>
    </ToastProvider>
  );
}
