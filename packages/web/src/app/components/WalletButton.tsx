"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import { waitForErgoConnector, type ErgoAPI } from "@/lib/wallet";
import { useToast } from "./Toast";
import { QRCodeSVG } from "qrcode.react";
import { pollErgoPayTxStatus } from "@/lib/ergopay";

interface DetectedWallet {
  name: string;
  id: string; // key in window.ergoConnector
  icon?: string;
}

export function WalletButton() {
  const { connected, address, setConnected, setAddress, setApi, setErgBalance, disconnect } = useWalletStore();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [ergoPayQr, setErgoPayQr] = useState<{ url: string; sessionId: string } | null>(null);
  const ergoPayPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect available wallets on mount + auto-reconnect
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

      // Auto-reconnect if we had a previous session
      // Nautilus remembers approved dApps — connect() auto-approves silently
      if (!connected) {
        const lastWallet = localStorage.getItem("etcha_last_wallet");
        if (lastWallet) {
          const connector = (window.ergoConnector as any)?.[lastWallet];
          if (connector && typeof connector.connect === "function") {
            try {
              const ok = await connector.connect({ createErgoObject: true });
              if (ok) {
                const api: ErgoAPI = await connector.getContext();
                const addrs = await api.get_used_addresses();
                const addr = addrs[0] ?? (await api.get_change_address());
                const balance = await api.get_balance("ERG");
                setConnected(true);
                setAddress(addr);
                setApi(api);
                setErgBalance(balance);
              }
            } catch {
              // Auto-reconnect failed silently — user can connect manually
              localStorage.removeItem("etcha_last_wallet");
            }
          }
        }
      }
    }
    detect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      localStorage.setItem("etcha_last_wallet", walletId);
    } catch (err: any) {
      console.error("Wallet connect error:", err);
      toast(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [setConnected, setAddress, setApi, setErgBalance, toast]);

  const connectViaErgoPay = useCallback(async () => {
    try {
      setConnecting(true);
      setShowMenu(false);

      // Create session
      const res = await fetch("/api/ergopay/init", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create ErgoPay session");
      const { sessionId, ergoPayUrl } = await res.json();

      setErgoPayQr({ url: ergoPayUrl, sessionId });

      // Poll for address
      ergoPayPollRef.current = setInterval(async () => {
        try {
          const status = await pollErgoPayTxStatus(sessionId);
          if (status.status === "signed" && status.txId) {
            // "txId" is actually the wallet address in the connect flow
            if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
            ergoPayPollRef.current = null;
            setErgoPayQr(null);
            setConnected(true);
            setAddress(status.txId); // the address
            setErgBalance("0"); // unknown via ErgoPay
            localStorage.setItem("etcha_last_wallet", "ergopay");
            localStorage.setItem("etcha_ergopay_address", status.txId);
            setConnecting(false);
          } else if (status.status === "expired") {
            if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
            ergoPayPollRef.current = null;
            setErgoPayQr(null);
            setConnecting(false);
            toast("Connection expired. Please try again.", "info");
          }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (err: any) {
      setConnecting(false);
      toast(err.message || "Failed to connect via ErgoPay");
    }
  }, [setConnected, setAddress, setErgBalance, toast]);

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
    localStorage.removeItem("etcha_last_wallet");
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
  if (connecting && !ergoPayQr) {
    return (
      <button disabled className="px-4 py-1.5 bg-[#c87941] text-white rounded-lg text-sm font-medium opacity-50">
        Connecting...
      </button>
    );
  }

  // Connect button + wallet picker (always includes ErgoPay option)
  return (
    <><div className="relative">
      <button
        onClick={async () => {
          if (showMenu) { setShowMenu(false); return; }
          // Detect browser extension wallets
          const available = await waitForErgoConnector(1500);
          if (available) {
            const detected: DetectedWallet[] = [];
            for (const [key, value] of Object.entries(window.ergoConnector || {})) {
              if (value && typeof value === "object" && "connect" in value) {
                detected.push({ name: key.charAt(0).toUpperCase() + key.slice(1), id: key });
              }
            }
            setWallets(detected);
          }
          setShowMenu(true);
        }}
        className="px-4 py-1.5 bg-[#c87941] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
      >
        Connect Wallet
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-[#0a0c10] border border-[#1e2330] rounded-lg shadow-xl z-50 py-1"
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
          <div className="border-t border-[#1e2330] mt-1 pt-1">
            <button
              onClick={connectViaErgoPay}
              className="w-full text-left px-3 py-2 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
            >
              Mobile Wallet (ErgoPay)
            </button>
          </div>
        </div>
      )}

    </div>

    {/* ErgoPay QR connect modal — rendered outside the relative container */}
    {ergoPayQr && (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => {
          if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
          setErgoPayQr(null);
          setConnecting(false);
        }} />
        <div style={{ position: "relative", zIndex: 1 }} className="bg-[#12151c] border border-[#1e2330] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#e8eaf0]">Connect Mobile Wallet</h2>
            <button
              onClick={() => {
                if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
                setErgoPayQr(null);
                setConnecting(false);
              }}
              className="text-[#8891a5] hover:text-[#e8eaf0] text-xl"
              aria-label="Close"
            >&times;</button>
          </div>
          <p className="text-sm text-[#8891a5]">
            Scan this QR code with your Ergo mobile wallet (Terminus or Minotaur) to connect.
          </p>
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-4">
              <QRCodeSVG value={ergoPayQr.url} size={220} level="M" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-[#8891a5] text-sm">
            <div className="w-4 h-4 border-2 border-[#c87941] border-t-transparent rounded-full animate-spin" />
            <span>Waiting for wallet...</span>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
