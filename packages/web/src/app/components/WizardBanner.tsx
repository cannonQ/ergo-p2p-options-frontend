"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function WizardBanner() {
  const pathname = usePathname();

  // Don't show on the wizard page itself
  if (pathname === "/app/wizard") return null;

  return (
    <div className="bg-etcha-surface border border-etcha-border rounded-lg px-4 py-3 flex items-center justify-between mb-6">
      <div>
        <span className="font-semibold text-sm">New to options?</span>
        <span className="text-sm text-etcha-text-secondary ml-2">
          Our strategy wizard walks you through step by step.
        </span>
      </div>
      <Link
        href="/app/wizard"
        className="px-4 py-2 bg-etcha-copper text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
      >
        Start Wizard
      </Link>
    </div>
  );
}
