"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import type { ParsedSellOrder } from "@/lib/sell-order-scanner";
import { TxStatus } from "@/app/components/TxStatus";

interface TradePanelProps {
  assetName: string;
  spotPrice: number;
  strike: number;
  type: "call" | "put";
  expiry: string;
  premium: number;      // USD per contract (from cheapest sell order)
  available: number;    // total contracts available
  sellOrder?: ParsedSellOrder; // cheapest sell order to buy from
  onClose: () => void;
}

/** Determine stablecoin name from payment token ID */
function stablecoinName(paymentTokenId: string): string {
  return paymentTokenId.startsWith("a55b") ? "USE" : "SigUSD";
}

/** Stablecoin decimals: USE=3, SigUSD=2 */
function stablecoinDecimals(paymentTokenId: string): number {
  return paymentTokenId.startsWith("a55b") ? 3 : 2;
}

export function TradePanel({
  assetName,
  spotPrice,
  strike,
  type,
  expiry,
  premium,
  available,
  sellOrder,
  onClose,
}: TradePanelProps) {
  const { connected, api } = useWalletStore();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<string>("1");
  const [slippage, setSlippage] = useState<string>("1.0");
  const [status, setStatus] = useState<string>("");
  const [txId, setTxId] = useState<string>("");

  // Derive stablecoin info from sell order
  const coin = sellOrder ? stablecoinName(sellOrder.paymentTokenId) : "USE";
  const stableDecimals = sellOrder ? stablecoinDecimals(sellOrder.paymentTokenId) : 3;

  const qty = parseInt(quantity) || 0;
  const total = qty * premium;
  const isCall = type === "call";
  const accentColor = isCall ? "#34d399" : "#f87171";
  const typeLabel = isCall ? "Call" : "Put";

  // Exercise math
  const exerciseReceive = isCall
    ? `${qty} ${assetName}`
    : `${(qty * strike).toFixed(stableDecimals)} ${coin}`;
  const exercisePay = isCall
    ? `${(qty * strike).toFixed(stableDecimals)} ${coin}`
    : `${qty} ${assetName}`;
  const breakeven = isCall
    ? strike + premium * spotPrice
    : strike - premium * spotPrice;

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ═══════════════════════════════════════════════════════════════
  // BUY TX FLOW
  // ═══════════════════════════════════════════════════════════════

  const handleConfirmBuy = useCallback(async () => {
    if (!sellOrder) {
      setStatus("No sell order available");
      return;
    }
    if (!connected || !api) {
      setStatus("Connect wallet first");
      return;
    }
    if (qty <= 0 || qty > available) {
      setStatus("Invalid quantity");
      return;
    }

    setStatus("Fetching sell order...");

    try {
      // 1. Fetch fresh sell box from node
      const boxRes = await fetch(`/api/box-by-id?boxId=${sellOrder.boxId}`);
      if (!boxRes.ok) throw new Error("Sell order box not found — may already be purchased");
      const nodeBox = await boxRes.json();

      // 2. Get buyer's wallet UTXOs
      const { getWalletUtxos } = await import("@/lib/wallet");
      const { nautilusBoxToFleet, nodeBoxToFleet } = await import("@/lib/box-utils");
      const rawUtxos = await getWalletUtxos(api);
      const buyerBoxes = rawUtxos.map(nautilusBoxToFleet);
      const sellBoxFleet = nodeBoxToFleet(nodeBox);

      // 3. Get wallet change address ErgoTree
      const walletErgoTree = rawUtxos[0]?.ergoTree;
      if (!walletErgoTree) throw new Error("No wallet UTXOs found");

      // 4. Get current height (must be >= max creationHeight of all inputs)
      const { fetchHeight } = await import("@/lib/api");
      let height = await fetchHeight();
      for (const b of [sellBoxFleet, ...buyerBoxes]) {
        const ch = Number(b.creationHeight ?? 0);
        if (ch > height) height = ch;
      }

      // 5. Parse seller ErgoTree from R4 (SigmaProp → P2PK ErgoTree)
      // R4 is a SigmaProp serialized as "08cd" + 33-byte EC point
      // The corresponding P2PK ErgoTree is "0008cd" + the same 33-byte EC point
      const r4hex = sellOrder.sellerPropBytes;
      let sellerErgoTree: string;
      if (r4hex.startsWith("08cd")) {
        sellerErgoTree = "0008cd" + r4hex.slice(4);
      } else {
        // Fallback: try using it as-is (might already be an ErgoTree)
        sellerErgoTree = r4hex;
      }

      // 6. Parse dApp UI fee ErgoTree from R6
      // R6 is Coll[Byte] — sigma type 0x0e + VLQ length + raw bytes
      // The raw bytes are the ErgoTree hex
      const { hexToBytes } = await import("@ergo-options/core");
      const r6bytes = hexToBytes(sellOrder.dAppUIFeeTree);
      let dAppUIFeeErgoTree: string;
      if (r6bytes[0] === 0x0e) {
        // Parse VLQ length then extract raw bytes
        let offset = 1;
        let len = 0;
        let shift = 0;
        while (offset < r6bytes.length) {
          const b = r6bytes[offset++];
          len |= (b & 0x7f) << shift;
          if ((b & 0x80) === 0) break;
          shift += 7;
        }
        const rawBytes = r6bytes.slice(offset, offset + len);
        dAppUIFeeErgoTree = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback: raw hex
        dAppUIFeeErgoTree = sellOrder.dAppUIFeeTree;
      }

      // 7. Build buy TX
      setStatus("Building transaction...");
      const { buildBuyFromSellOrderTx } = await import("@ergo-options/core");

      const unsignedTx = buildBuyFromSellOrderTx(
        {
          sellBox: sellBoxFleet,
          amount: BigInt(qty),
          premiumPerToken: BigInt(sellOrder.premiumPerToken),
          dAppUIFeePer1000: BigInt(sellOrder.dAppUIFeePer1000),
          contractTxFee: BigInt(sellOrder.txFee),
          paymentTokenId: sellOrder.paymentTokenId,
          sellerErgoTree,
          dAppUIFeeErgoTree,
          registers: sellOrder.registers,
          buyerBoxes,
          changeErgoTree: walletErgoTree,
        },
        height,
      );

      // 8. Sign via Nautilus
      setStatus("Sign in wallet...");
      const eip12Tx = unsignedTx.toEIP12Object();
      const { signTx } = await import("@/lib/wallet");
      const signedTx = await signTx(api, eip12Tx);

      // 9. Submit
      setStatus("Submitting...");
      const { submitTransaction } = await import("@/lib/api");
      const submittedTxId = await submitTransaction(signedTx);

      setTxId(submittedTxId);
      setStatus("Success!");
      console.log("Buy TX submitted:", submittedTxId);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("Buy TX failed:", err);
      if (msg.includes("declined") || msg.includes("Refused")) {
        setStatus("Signing declined");
      } else {
        setStatus(`Error: ${msg.slice(0, 60)}`);
      }
    }
  }, [sellOrder, connected, api, qty, available]);

  const canBuy = qty > 0 && qty <= available && !!sellOrder;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#12151c] border-l border-[#1e2330] z-50 overflow-y-auto shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330]">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 text-xs font-bold rounded"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {typeLabel}
            </span>
            <span className="font-bold text-[#e8eaf0]">{assetName}</span>
            <span className="text-[#e09a5f] font-mono">${strike >= 100 ? strike.toFixed(0) : strike >= 1 ? strike.toFixed(2) : strike.toFixed(4)}</span>
            <span className="text-[#8891a5] text-sm">Exp: {expiry}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8891a5] hover:text-[#e8eaf0] text-xl leading-none px-2"
          >
            x
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Buy / Sell toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                side === "buy"
                  ? "bg-[#c87941] text-white"
                  : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                side === "sell"
                  ? "bg-[#c87941] text-white"
                  : "bg-[#1e2330] text-[#8891a5] hover:text-[#e8eaf0]"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Available / Premium */}
          <div className="bg-[#0a0c10] rounded-lg px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#8891a5]">Available</span>
              <span className="text-[#e8eaf0] font-mono">{available} contracts</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8891a5]">Premium</span>
              <span className="text-[#e09a5f] font-mono">
                {premium > 0 ? `${premium.toFixed(stableDecimals)} ${coin}` : "—"}
              </span>
            </div>
          </div>

          {/* Quantity input */}
          <div>
            <label className="text-sm text-[#8891a5] block mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max={available}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-4 py-2 text-[#e8eaf0] font-mono text-lg focus:border-[#c87941] focus:outline-none transition-colors"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[#8891a5] text-sm">Total</span>
            <span className="text-[#e09a5f] font-mono text-xl font-bold">
              {total > 0 ? `${total.toFixed(stableDecimals)} ${coin}` : "—"}
            </span>
          </div>

          {/* Exercise info */}
          <div className="border border-[#1e2330] rounded-lg px-4 py-3 space-y-2">
            <div className="text-sm text-[#8891a5] font-medium border-b border-[#1e2330] pb-1 mb-1">
              If Exercised
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8891a5]">You receive</span>
              <span className="text-[#34d399] font-mono">{exerciseReceive}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8891a5]">You pay</span>
              <span className="text-[#f87171] font-mono">{exercisePay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8891a5]">Breakeven</span>
              <span className="text-[#e8eaf0] font-mono">
                ${breakeven.toFixed(4)}/{assetName}
              </span>
            </div>
          </div>

          {/* Slippage & Stablecoin (read-only for buy) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#8891a5] block mb-1">Slippage</label>
              <div className="relative">
                <input
                  type="text"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono text-sm focus:border-[#c87941] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8891a5] text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#8891a5] block mb-1">Stablecoin</label>
              <div className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg px-3 py-2 text-[#8891a5] text-sm">
                {coin} {sellOrder ? "(fixed by order)" : ""}
              </div>
            </div>
          </div>

          {/* Confirm button */}
          {side === "buy" ? (
            <button
              disabled={!canBuy || !!txId || status === "Submitting..." || status === "Sign in wallet..." || status === "Building transaction..."}
              onClick={handleConfirmBuy}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                canBuy && !txId
                  ? "bg-[#c87941] hover:bg-[#e09a5f] cursor-pointer"
                  : "bg-[#c87941]/30 cursor-not-allowed"
              }`}
            >
              {!connected
                ? "Connect Wallet"
                : !sellOrder
                ? "No Orders Available"
                : txId
                ? "Purchased!"
                : "Confirm Purchase"}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-lg font-bold text-white bg-[#c87941]/30 cursor-not-allowed"
            >
              Sell (Coming Soon)
            </button>
          )}

          {/* Status / TX ID */}
          <TxStatus status={status} txId={txId} />

          {/* Spot price footer */}
          <div className="text-center text-xs text-[#8891a5]">
            Spot: ${spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            {" "} | Oracle feed
          </div>
        </div>
      </div>
    </>
  );
}
