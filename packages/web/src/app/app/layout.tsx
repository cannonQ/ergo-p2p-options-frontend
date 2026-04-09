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
      <Navbar />
      <StatsBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <WizardBanner />
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </ToastProvider>
  );
}
