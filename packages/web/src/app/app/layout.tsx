import type { Metadata } from "next";
import { Navbar } from "../components/Navbar";
import { StatsBar } from "../components/StatsBar";
import { ErrorBoundary } from "../components/ErrorBoundary";

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
    <>
      <Navbar />
      <StatsBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
