"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      className="px-3 py-2 bg-[#1e2330] text-[#8891a5] rounded-lg text-sm hover:text-[#e8eaf0] transition-colors"
      title="Refresh data"
    >
      <span className={spinning ? "inline-block animate-spin" : ""}>&#x21bb;</span>
    </button>
  );
}
