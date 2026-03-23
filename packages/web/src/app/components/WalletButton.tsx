"use client";

import { useState } from "react";
import { useWalletStore } from "@/stores/wallet-store";

export function WalletButton() {
  const { connected, address, setConnected, setAddress, setApi, setErgBalance, disconnect } = useWalletStore();
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (connected) {
      disconnect();
      return;
    }

    setConnecting(true);
    try {
      // Poll for extension injection (async, per EIP-12 best practice)
      const { connectNautilus } = await import("@/lib/wallet");
      const api = await connectNautilus();
      const addrs = await api.get_used_addresses();
      const addr = addrs[0] ?? (await api.get_change_address());
      const balance = await api.get_balance("ERG");

      setConnected(true);
      setAddress(addr);
      setApi(api);
      setErgBalance(balance);
    } catch (err: any) {
      console.error("Wallet connect error:", err);
      alert(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#94a3b8] font-mono hidden sm:inline">
          {useWalletStore.getState().ergBalance
            ? `${(Number(useWalletStore.getState().ergBalance) / 1e9).toFixed(2)} ERG`
            : ""}
        </span>
        <button
          onClick={handleConnect}
          className="px-3 py-1.5 bg-[#1e293b] text-[#e2e8f0] rounded-lg text-sm font-mono hover:bg-[#334155] transition-colors"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="px-4 py-1.5 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
