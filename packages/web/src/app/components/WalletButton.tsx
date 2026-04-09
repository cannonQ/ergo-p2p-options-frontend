"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useWalletStore } from "@/stores/wallet-store";
import { waitForErgoConnector, type ErgoAPI } from "@/lib/wallet";
import { useToast } from "./Toast";
import { QRCodeSVG } from "qrcode.react";
import { pollErgoPayTxStatus, isMobileDevice } from "@/lib/ergopay";

interface DetectedWallet {
  name: string;
  id: string; // key in window.ergoConnector
  icon?: string;
}

export function WalletButton() {
  const { connected, address, setConnected, setAddress, setApi, setErgBalance, setWalletType, disconnect } = useWalletStore();
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
      if (!connected) {
        const lastWallet = localStorage.getItem("etcha_last_wallet");

        // ErgoPay auto-reconnect: restore address from localStorage
        if (lastWallet === "ergopay") {
          const savedAddr = localStorage.getItem("etcha_ergopay_address");
          if (savedAddr) {
            setConnected(true);
            setAddress(savedAddr);
            setWalletType("ergopay");
            // Fetch balance via node proxy
            fetch(`/api/boxes?address=${savedAddr}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (data?.boxes) {
                  const totalNano = data.boxes.reduce((sum: number, b: any) => sum + Number(b.value || 0), 0);
                  setErgBalance(String(totalNano));
                }
              })
              .catch(() => {});
          }
        }

        // Nautilus auto-reconnect: connect() auto-approves silently
        if (lastWallet && lastWallet !== "ergopay") {
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
                setWalletType("nautilus");
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
      setWalletType("nautilus");
      localStorage.setItem("etcha_last_wallet", walletId);
    } catch (err: any) {
      console.error("Wallet connect error:", err);
      toast(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [setConnected, setAddress, setApi, setErgBalance, setWalletType, toast]);

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
            const walletAddr = status.txId; // the address
            setConnected(true);
            setAddress(walletAddr);
            setWalletType("ergopay");
            localStorage.setItem("etcha_last_wallet", "ergopay");
            localStorage.setItem("etcha_ergopay_address", walletAddr);
            setConnecting(false);
            // Fetch balance via our API proxy (Explorer has CORS restrictions)
            try {
              const balRes = await fetch(`/api/boxes?address=${walletAddr}`);
              if (balRes.ok) {
                const { boxes } = await balRes.json();
                const totalNano = (boxes || []).reduce((sum: number, b: any) => sum + Number(b.value || 0), 0);
                setErgBalance(String(totalNano));
              }
            } catch { /* non-critical */ }
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
          // On mobile, skip the dropdown and go straight to ErgoPay
          if (isMobileDevice()) { connectViaErgoPay(); return; }
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
        className="px-2.5 py-1 md:px-4 md:py-1.5 bg-[#c87941] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#2563eb] transition-colors"
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
          {!isMobileDevice() && wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => connectToWallet(w.id)}
              className="w-full text-left px-3 py-2 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
            >
              {w.name}
            </button>
          ))}
          <div className={!isMobileDevice() && wallets.length > 0 ? "border-t border-[#1e2330] mt-1 pt-1" : ""}>
            <button
              onClick={connectViaErgoPay}
              className="w-full text-left px-3 py-2 text-sm text-[#e8eaf0] hover:bg-[#1e2330] transition-colors"
            >
              {isMobileDevice() ? "Connect with Wallet App" : "Mobile Wallet (ErgoPay)"}
            </button>
          </div>
        </div>
      )}

    </div>

    {/* ErgoPay QR connect modal — portaled to document.body */}
    {ergoPayQr && typeof document !== "undefined" && createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)" }} onClick={() => {
          if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
          setErgoPayQr(null);
          setConnecting(false);
        }} />
        <div style={{ position: "relative", zIndex: 1, background: "#12151c", border: "1px solid #1e2330", borderRadius: "12px", maxWidth: "400px", width: "calc(100% - 32px)", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#e8eaf0", margin: 0 }}>Connect Mobile Wallet</h2>
            <button
              onClick={() => {
                if (ergoPayPollRef.current) clearInterval(ergoPayPollRef.current);
                setErgoPayQr(null);
                setConnecting(false);
              }}
              style={{ background: "none", border: "none", color: "#8891a5", fontSize: "24px", cursor: "pointer", padding: "0 4px" }}
              aria-label="Close"
            >&times;</button>
          </div>
          <p style={{ fontSize: "14px", color: "#8891a5", marginBottom: "20px" }}>
            {isMobileDevice()
              ? "Tap the button below to open your Ergo wallet app."
              : "Scan this QR code with your Ergo mobile wallet (Terminus or Minotaur) to connect."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            {isMobileDevice() ? (
              <a
                href={ergoPayQr.url}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "8px", background: "#c87941", color: "white", fontWeight: 500, fontSize: "15px", textDecoration: "none" }}
              >
                Open in Wallet
              </a>
            ) : (
              <div style={{ background: "white", borderRadius: "12px", padding: "16px" }}>
                <QRCodeSVG value={ergoPayQr.url} size={220} level="M" />
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#8891a5", fontSize: "14px" }}>
            <div style={{ width: "16px", height: "16px", border: "2px solid #c87941", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span>Waiting for wallet...</span>
          </div>
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
