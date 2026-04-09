"use client";

import { useState, useCallback, useRef } from "react";
import {
  buildCreateOptionTx,
  ERG_ORACLE_INDEX,
  REGISTRY_TOKEN_IDS,
  hexToBytes,
  CONTRACT_ADDRESSES,
  type OptionType,
  type OptionStyle,
  type SettlementType,
} from "@ergo-options/core";
import { fetchHeight, checkMempoolTx } from "@/lib/api";
import { useWalletStore } from "@/stores/wallet-store";
import { adaptTxForErgoPay } from "@/lib/ergopay-adapter";
import { requestErgoPayTx } from "@/lib/ergopay";
import type { PollResponse } from "@/app/api/poll/[boxId]/route";

const EXPLORER_API = "https://api.ergoplatform.com/api/v1";
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 15 * 60_000;
const POLL_SOFT_WARNING_MS = 5 * 60_000;
const MINER_FEE = 1_100_000;

/** Same input interface as useWriteOption */
export interface WriteOptionInput {
  contractErgoTree: string;
  optionName: string;
  optionType: OptionType;
  style: OptionStyle;
  settlementType: SettlementType;
  oracleIndex: number;
  shareSize: bigint;
  maturityHeight: bigint;
  strikePrice: bigint;
  collateralCap: bigint;
  stablecoinDecimal: bigint;
  collateralToken?: { tokenId: string; amount: bigint };
  ergCollateral?: bigint;
  dAppUIMintFee: bigint;
  dAppUIFeeTree: Uint8Array;
  autoList?: number;
  premiumRaw?: bigint;
}

export interface WriteOptionErgoPayResult {
  /** 0=form, 1=awaiting QR scan, 2=bot minting, 3=bot delivering, 4=done */
  step: number;
  error: string | null;
  warning: string | null;
  txIds: { create?: string };
  /** ErgoPay URL for QR code / deep link */
  ergoPayUrl: string | null;
  /** Request ID for polling */
  ergoPayRequestId: string | null;
  execute: (input: WriteOptionInput, walletAddress: string) => Promise<void>;
  onErgoPaySigned: (txId: string) => void;
  reset: () => void;
}

/** Fetch UTXOs via our API proxy (Explorer has CORS restrictions) */
async function fetchExplorerUtxos(address: string): Promise<any[]> {
  const res = await fetch(`/api/boxes?address=${address}`);
  if (!res.ok) throw new Error("Failed to fetch wallet UTXOs");
  const data = await res.json();
  return (data.boxes || []).map((b: any) => ({
    boxId: b.boxId,
    transactionId: b.transactionId,
    index: b.index,
    ergoTree: b.ergoTree,
    creationHeight: b.creationHeight,
    value: b.value.toString(),
    assets: (b.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: b.additionalRegisters || {},
  }));
}

/** Convert Ergo address to ErgoTree via our API */
async function addressToErgoTree(address: string): Promise<string> {
  const res = await fetch(`/api/address-to-raw?address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error("Could not resolve address to ErgoTree");
  const data = await res.json();
  // address-to-raw returns the raw address; we need ErgoTree
  // For P2PK: ErgoTree = 0008cd + raw (without network byte + checksum)
  // Actually let's fetch from Explorer
  return "";
}

/** Extract ErgoTree from Explorer UTXO data */
function getErgoTreeFromBoxes(boxes: any[]): string {
  if (boxes.length === 0) throw new Error("Wallet has no UTXOs");
  return boxes[0].ergoTree;
}

/** Extract EC point from P2PK ErgoTree */
function ergoTreeToECPoint(ergoTreeHex: string): Uint8Array {
  const bytes = hexToBytes(ergoTreeHex);
  if (bytes.length !== 36 || bytes[0] !== 0x00 || bytes[1] !== 0x08 || bytes[2] !== 0xcd) {
    throw new Error("Not a P2PK ErgoTree — cannot extract EC point");
  }
  return bytes.slice(3);
}

function getContractErgoTree(): string {
  if (CONTRACT_ADDRESSES.length === 0) throw new Error("No contract addresses configured");
  return CONTRACT_ADDRESSES[0].ergoTree;
}

async function pollBoxState(boxId: string, contractAddress: string): Promise<PollResponse> {
  const res = await fetch(`/api/poll/${boxId}?contractAddress=${encodeURIComponent(contractAddress)}`);
  if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
  return res.json();
}

async function waitForState(
  boxId: string,
  contractAddress: string,
  targetStates: string[],
  abortSignal: AbortSignal,
  onStateChange?: (state: string) => void,
  onSoftWarning?: () => void,
): Promise<PollResponse> {
  const startTime = Date.now();
  const deadline = startTime + POLL_TIMEOUT_MS;
  let softWarningFired = false;

  while (Date.now() < deadline) {
    if (abortSignal.aborted) throw new Error("Operation cancelled");
    if (!softWarningFired && Date.now() - startTime >= POLL_SOFT_WARNING_MS) {
      softWarningFired = true;
      onSoftWarning?.();
    }
    try {
      const response = await pollBoxState(boxId, contractAddress);
      if (onStateChange) onStateChange(response.state);
      if (targetStates.includes(response.state)) return response;
    } catch { /* retry */ }
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, POLL_INTERVAL_MS);
      const onAbort = () => { clearTimeout(timer); reject(new Error("Cancelled")); };
      abortSignal.addEventListener("abort", onAbort, { once: true });
    });
  }
  throw new Error("The bot hasn't responded yet. Your collateral is safe — check Portfolio in a few minutes.");
}

export function useWriteOptionErgoPay(): WriteOptionErgoPayResult {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [txIds, setTxIds] = useState<{ create?: string }>({});
  const [ergoPayUrl, setErgoPayUrl] = useState<string | null>(null);
  const [ergoPayRequestId, setErgoPayRequestId] = useState<string | null>(null);
  const executingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  // Store context needed for post-signing steps
  const contextRef = useRef<{ contractErgoTree: string; definitionBoxErgoTree: string } | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setStep(0);
    setError(null);
    setWarning(null);
    setTxIds({});
    setErgoPayUrl(null);
    setErgoPayRequestId(null);
    executingRef.current = false;
    contextRef.current = null;
  }, []);

  const execute = useCallback(async (input: WriteOptionInput, walletAddress: string) => {
    if (executingRef.current) return;
    executingRef.current = true;
    setError(null);
    setTxIds({});

    try {
      // Fetch UTXOs from Explorer API
      const explorerBoxes = await fetchExplorerUtxos(walletAddress);
      if (explorerBoxes.length === 0) throw new Error("No UTXOs found for this address");

      const changeErgoTree = getErgoTreeFromBoxes(explorerBoxes);
      const issuerECPoint = ergoTreeToECPoint(changeErgoTree);
      const currentHeight = await fetchHeight();

      // Determine underlying token ID (same logic as useWriteOption)
      let underlyingId: string;
      if (input.settlementType === 1) {
        const { USE_TOKEN_ID, SIGUSD_TOKEN_ID } = await import("@ergo-options/core");
        underlyingId = input.stablecoinDecimal === 1000n ? USE_TOKEN_ID : SIGUSD_TOKEN_ID;
      } else if (input.oracleIndex === ERG_ORACLE_INDEX) {
        underlyingId = "";
      } else {
        underlyingId = REGISTRY_TOKEN_IDS[input.oracleIndex] ?? "";
      }

      // Build the unsigned TX with Fleet SDK (same as Nautilus path)
      const createParams = {
        contractErgoTree: input.contractErgoTree,
        optionName: input.optionName,
        underlyingId,
        decimals: "0",
        optionType: input.optionType,
        style: input.style,
        shareSize: input.shareSize,
        maturityHeight: input.maturityHeight,
        strikePrice: input.strikePrice,
        dAppUIMintFee: input.dAppUIMintFee,
        oracleIndex: input.oracleIndex,
        settlementType: input.settlementType,
        collateralCap: input.collateralCap,
        stablecoinDecimal: input.stablecoinDecimal,
        collateralToken: input.collateralToken,
        ergCollateral: input.ergCollateral,
        issuerECPoint,
        dAppUIFeeTree: input.dAppUIFeeTree,
        changeErgoTree,
        autoList: input.autoList,
        premiumRaw: input.premiumRaw,
      };

      const unsignedTx = buildCreateOptionTx(explorerBoxes, createParams, currentHeight);
      const eip12Tx = unsignedTx.toEIP12Object();

      // Convert to ErgoPay format
      const ergoPayTx = adaptTxForErgoPay(eip12Tx, walletAddress, MINER_FEE);

      // Store context for post-signing
      contextRef.current = {
        contractErgoTree: input.contractErgoTree,
        definitionBoxErgoTree: getContractErgoTree(),
      };

      // POST to ergopay.duckdns.org
      setStep(1);
      const { requestId, ergoPayUrl: url } = await requestErgoPayTx({
        unsignedTx: ergoPayTx,
        address: walletAddress,
        message: `Etcha: Write ${input.optionName}`,
      });

      setErgoPayUrl(url);
      setErgoPayRequestId(requestId);
      // Now waiting for wallet to scan + sign (ErgoPayModal handles polling)

    } catch (err: any) {
      console.error("[ErgoPay Write] Error:", err);
      let msg = err?.message || String(err);
      // Make InsufficientInputs errors human-readable
      if (msg.includes("InsufficientInputs") || msg.includes("Insufficient inputs")) {
        msg = "Insufficient wallet balance. Check you have enough ERG and tokens for this option.";
      }
      setError(msg);
      executingRef.current = false;
    }
  }, []);

  /** Called by ErgoPayModal when the wallet signs the TX */
  const onErgoPaySigned = useCallback((txId: string) => {
    setTxIds({ create: txId });
    setErgoPayUrl(null);
    setErgoPayRequestId(null);

    const ctx = contextRef.current;
    if (!ctx) {
      setError("Missing context for post-signing steps");
      executingRef.current = false;
      return;
    }

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Continue with bot polling (same as Nautilus path steps 2-4)
    (async () => {
      try {
        // We don't know the exact definition box ID from ErgoPay
        // (wallet submitted directly, we only got txId back).
        // We need to fetch the TX and find the definition box output.
        const txRes = await fetch(`/api/box-by-token?tokenId=${txId}`);

        // Alternative: poll the contract address for a box with R7 matching the TX outputs
        // For now, use the TX ID as the definition box ID hint and poll
        setStep(2);
        const contractAddress = ctx.definitionBoxErgoTree;

        // The definition box's R7 will contain 32 zero bytes initially (pre-mint).
        // After mint, R7 = the creation box ID. We need to find the box.
        // Strategy: scan contract boxes and find one from our TX.
        // Simpler: poll using the TX ID and let the bot handle it.
        // The bot scans all contract boxes, so our option will be picked up.

        // Wait for any box at the contract to transition to MINTED or DELIVERED
        // We'll poll every 10s checking for new MINTED/DELIVERED boxes
        await waitForState(
          txId, // Use txId as a proxy — poll endpoint will scan
          contractAddress,
          ["MINTED", "DELIVERED"],
          abortController.signal,
          (state) => { if (state === "MINTED") setStep(3); },
          () => setWarning("Taking longer than usual \u2014 the bot is still working."),
        );

        setStep(3);
        await waitForState(txId, contractAddress, ["DELIVERED"], abortController.signal);
        setStep(4);

        // Refresh wallet balance after successful write
        useWalletStore.getState().refreshBalance();
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        executingRef.current = false;
        abortRef.current = null;
      }
    })();
  }, []);

  return { step, error, warning, txIds, ergoPayUrl, ergoPayRequestId, execute, onErgoPaySigned, reset };
}
