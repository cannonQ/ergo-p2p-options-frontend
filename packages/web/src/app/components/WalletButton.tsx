"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import { waitForErgoConnector, type ErgoAPI } from "@/lib/wallet";

interface DetectedWallet {
  name: string;
  id: string; // key in window.ergoConnector
  icon?: string;
}

export function WalletButton() {
  const { connected, address, setConnected, setAddress, setApi, setErgBalance, disconnect } = useWalletStore();
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);

  // Detect available wallets on mount
  useEffect(() => {
    async function detect() {
      const available = await waitForErgoConnector(3000);
      if (!available || !window.ergoConnector) return;

      const detected: DetectedWallet[] = [];
      for (const [key, value] of Object.entries(window.ergoConnector)) {
        if (value && typeof value === "object" && "connect" in value) {
          detected.push({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            id: key,
          });
        }
      }
      setWallets(detected);
    }
    detect();
  }, []);

  const connectToWallet = useCallback(async (walletId: string) => {
    setConnecting(true);
    setShowMenu(false);
    try {
      const connector = (window.ergoConnector as any)?.[walletId];
      if (!connector) {
        throw new Error(`Wallet "${walletId}" not found`);
      }

      const ok = await connector.connect({ createErgoObject: true });
      if (!ok) {
        throw new Error("Connection declined");
      }

      const api: ErgoAPI = await connector.getContext();
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
  }, [setConnected, setAddress, setApi, setErgBalance]);

  const handleDisconnect = useCallback(() => {
    // Try to disconnect from the wallet extension
    if (window.ergoConnector) {
      for (const [, value] of Object.entries(window.ergoConnector)) {
        if (value && typeof value === "object" && "disconnect" in value) {
          try { (value as any).disconnect(); } catch { /* ignore */ }
        }
      }
    }
    disconnect();
    setShowMenu(false);
  }, [disconnect]);

  // Connected state — show address with dropdown
  if (connected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1e2330] text-[#e8eaf0] rounded-lg text-sm font-mono hover:bg-[#334155] transition-colors"
        >
          <span className="text-xs text-[#8891a5] hidden sm:inline">
            {useWalletStore.getState().ergBalance
              ? `${(Number(useWalletStore.getState().ergBalance) / 1e9).toFixed(2)} ERG`
              : ""}
          </span>
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          <svg className="w-3 h-3 text-[#8891a5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-[#0a0c10] border border-[#1e2330] rounded-lg shadow-xl z-50"
            onMouseLeave={() => setShowMenu(false)}
          >
            {/* Connected address (full, copyable) */}
            <div className="px-3 py-2 border-b border-[#1e2330]">
              <p className="text-[10px] text-[#8891a5] uppercase tracking-wider mb-1">Connected</p>
              <p
                className="text-xs font-mono text-[#e8eaf0] cursor-pointer hover:text-[#c87941] truncate"
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  setShowMenu(false);
                }}
                title="Click to copy full address"
              >
                {address}
              </p>
            </div>

            {/* Balance */}
            <div className="px-3 py-2 border-b border-[#1e2330]">
              <p className="text-xs text-[#8891a5]">
                Balance: <span className="text-[#e09a5f] font-mono">
                  {useWalletStore.getState().ergBalance
                    ? `${(Number(useWalletStore.getState().ergBalance) / 1e9).toFixed(4)} ERG`
                    : "—"}
                </span>
              </p>
            </div>

            {/* Switch wallet */}
            {wallets.length > 1 && (
              <div className="border-b border-[#1e2330]">
                <p className="px-3 py-1 text-[10px] text-[#8891a5] uppercase tracking-wider">Switch Wallet</p>
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      handleDisconnect();
                      setTimeout(() => connectToWallet(w.id), 300);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 text-sm text-[#f87171] hover:bg-[#1e2330] transition-colors rounded-b-lg"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not connected — show connect button or wallet picker
  if (connecting) {
    return (
      <button disabled className="px-4 py-1.5 bg-[#c87941] text-white rounded-lg text-sm font-medium opacity-50">
        Connecting...
      </button>
    );
  }

  // If only one wallet detected, connect directly. If multiple, show picker.
  if (wallets.length === 0) {
    return (
      <button
        onClick={async () => {
          // Wait a bit more in case extension is slow
          const available = await waitForErgoConnector(3000);
          if (available) {
            const detected: DetectedWallet[] = [];
            for (const [key, value] of Object.entries(window.ergoConnector || {})) {
              if (value && typeof value === "object" && "connect" in value) {
                detected.push({ name: key.charAt(0).toUpperCase() + key.slice(1), id: key });
              }
            }
            setWallets(detected);
            if (detected.length === 1) {
              connectToWallet(detected[0].id);
            } else if (detected.length > 1) {
              setShowMenu(true);
            } else {
              alert("No Ergo wallet found. Please install Nautilus.");
            }
          } else {
            alert("No Ergo wallet found. Please install the Nautilus browser extension.");
          }
        }}
        className="px-4 py-1.5 bg-[#c87941] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  // Multiple wallets available — show picker
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-1.5 bg-[#c87941] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
      >
        Connect Wallet
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-[#0a0c10] border border-[#1e2330] rounded-lg shadow-xl z-50 py-1"
          onMouseLeave={() => setShowMenu(false)}
        >
          <p className="px-3 py-1 text-[10px] text-[#c87941] uppercase tracking-wider font-bold">
            Select Wallet
          </p>
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => connectToWallet(w.id)}
              className="w-full text-left px-3 py-2 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
            >
              {w.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
