"use client";

import { useState } from "react";

export function WalletButton() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (connected) {
      setConnected(false);
      setAddress(null);
      return;
    }

    setConnecting(true);
    try {
      if (!window.ergoConnector?.nautilus) {
        alert("Nautilus wallet not found. Please install the Nautilus extension.");
        return;
      }

      const ok = await window.ergoConnector.nautilus.connect({
        createErgoObject: true,
      });
      if (!ok) return;

      const api = await window.ergoConnector.nautilus.getContext();
      const addrs = await api.get_used_addresses();
      const addr = addrs[0] ?? (await api.get_change_address());

      setConnected(true);
      setAddress(addr);
    } catch (err: any) {
      console.error("Wallet connect error:", err);
      alert(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  if (connected && address) {
    return (
      <button
        onClick={handleConnect}
        className="px-3 py-1.5 bg-[#1e293b] text-[#e2e8f0] rounded-lg text-sm font-mono hover:bg-[#334155] transition-colors"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
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
