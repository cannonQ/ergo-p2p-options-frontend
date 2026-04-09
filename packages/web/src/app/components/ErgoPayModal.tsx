"use client";

import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { pollErgoPayTxStatus, isMobileDevice, type ErgoPayTxStatus } from "@/lib/ergopay";

interface ErgoPayModalProps {
  open: boolean;
  onClose: () => void;
  ergoPayUrl: string;
  requestId: string;
  message: string;
  onSigned: (txId: string) => void;
  onExpired: () => void;
}

type ModalState = "waiting" | "signed" | "expired";

export function ErgoPayModal({
  open,
  onClose,
  ergoPayUrl,
  requestId,
  message,
  onSigned,
  onExpired,
}: ErgoPayModalProps) {
  const [state, setState] = useState<ModalState>("waiting");
  const [txId, setTxId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = isMobileDevice();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open || !requestId) return;

    setState("waiting");
    setTxId(null);

    pollingRef.current = setInterval(async () => {
      try {
        const status: ErgoPayTxStatus = await pollErgoPayTxStatus(requestId);

        if (status.status === "signed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setTxId(status.txId);
          setState("signed");
          onSigned(status.txId);
        } else if (status.status === "expired") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setState("expired");
          onExpired();
        }
      } catch {
        // Keep polling on error
      }
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open, requestId, onSigned, onExpired]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)" }} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sign with mobile wallet"
        className="relative bg-[#12151c] border border-[#1e2330] rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e8eaf0]">
            {state === "signed" ? "Transaction Signed" :
             state === "expired" ? "Request Expired" :
             "Sign with Mobile Wallet"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#9da5b8] hover:text-[#e8eaf0] text-xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-[#9da5b8]">{message}</p>

        <div className="flex flex-col items-center gap-4">
          {/* Waiting state */}
          {state === "waiting" && (
            <>
              {/* QR Code (desktop) */}
              {!isMobile && (
                <div className="bg-white rounded-xl p-4">
                  <QRCodeSVG value={ergoPayUrl} size={200} level="M" />
                </div>
              )}

              {/* Deep link button (mobile) */}
              {isMobile && (
                <a
                  href={ergoPayUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c87941] text-white font-medium text-sm hover:bg-[#e09a5f] transition-colors"
                >
                  Open in Wallet
                </a>
              )}

              {/* Waiting spinner */}
              <div className="flex items-center gap-2 text-[#9da5b8] text-sm">
                <div className="w-4 h-4 border-2 border-[#c87941] border-t-transparent rounded-full animate-spin" />
                <span>Waiting for wallet to sign...</span>
              </div>

              <p className="text-xs text-[#7a82a0] text-center">
                {isMobile
                  ? "Tap the button above to open your Ergo wallet app."
                  : "Scan this QR code with your Ergo mobile wallet (Terminus or Minotaur)."}
              </p>
            </>
          )}

          {/* Signed state */}
          {state === "signed" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-[#34d399]/20 flex items-center justify-center">
                <span className="text-[#34d399] text-2xl">&#10003;</span>
              </div>
              <p className="text-sm text-[#34d399] font-semibold">Transaction signed and submitted!</p>
              {txId && (
                <a
                  href={`https://ergexplorer.com/transactions#${txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#9da5b8] hover:text-[#c87941] font-mono transition-colors"
                >
                  {txId.slice(0, 12)}...{txId.slice(-8)}
                </a>
              )}
            </div>
          )}

          {/* Expired state */}
          {state === "expired" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-[#f87171]/20 flex items-center justify-center">
                <span className="text-[#f87171] text-2xl">&#10007;</span>
              </div>
              <p className="text-sm text-[#f87171] font-semibold">Request expired</p>
              <p className="text-xs text-[#9da5b8] text-center">
                The signing request was not completed in time. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-[#9da5b8] hover:text-[#e8eaf0] border border-[#1e2330] rounded-lg transition-colors"
        >
          {state === "waiting" ? "Cancel" : "Close"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
