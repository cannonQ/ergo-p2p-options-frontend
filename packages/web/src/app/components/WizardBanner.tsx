"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function WizardBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("wizardBannerDismissed")) setDismissed(true);
  }, []);

  // Don't show on the wizard page itself
  if (pathname === "/app/wizard") return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("wizardBannerDismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="bg-etcha-surface border border-etcha-border rounded-lg px-4 py-3 flex items-center justify-between mb-6 relative">
      <div>
        <span className="font-semibold text-sm">New to options?</span>
        <span className="text-sm text-etcha-text-secondary ml-2">
          Our strategy wizard walks you through step by step.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/app/wizard"
          className="px-4 py-2 bg-etcha-copper text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Start Wizard
        </Link>
        <button
          onClick={handleDismiss}
          className="text-etcha-text-secondary hover:text-etcha-text transition-colors text-lg leading-none px-1"
          aria-label="Dismiss banner"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
