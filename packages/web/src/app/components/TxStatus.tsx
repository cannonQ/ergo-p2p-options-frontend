"use client";

import { useState } from "react";

const EXPLORER_BASE = "https://ergexplorer.com/transactions#";

export function TxStatus({ status, txId }: { status: string; txId: string }) {
  const [copied, setCopied] = useState(false);

  if (!status && !txId) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const truncated = txId
    ? `${txId.slice(0, 10)}...${txId.slice(-8)}`
    : "";

  return (
    <div className="space-y-2">
      {status && (
        <div className={`text-center text-sm ${txId ? "text-[#34d399]" : "text-[#8891a5]"}`}>
          {status}
        </div>
      )}
      {txId && (
        <div
          className="flex items-center gap-2 bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2"
          title={txId}
        >
          <span className="text-xs text-[#8891a5] font-mono flex-1 truncate">
            TX: {truncated}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-[#8891a5] hover:text-[#e8eaf0] transition-colors shrink-0"
            aria-label="Copy transaction ID"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={`${EXPLORER_BASE}${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#c87941] hover:text-[#e09a5f] transition-colors shrink-0"
            aria-label="View transaction on block explorer"
          >
            View ↗
          </a>
        </div>
      )}
    </div>
  );
}
