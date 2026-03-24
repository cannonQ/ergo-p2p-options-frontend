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
import {
  connectNautilus,
  signTx,
  getWalletUtxos,
  getChangeAddress,
} from "@/lib/wallet";
import { fetchHeight, submitTransaction, checkMempoolTx } from "@/lib/api";
import type { PollResponse } from "@/app/api/poll/[boxId]/route";

/** Parameters the write page passes to the hook */
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
  /** For token collateral (non-ERG physical call, physical put, cash-settled) */
  collateralToken?: { tokenId: string; amount: bigint };
  /** For ERG call only */
  ergCollateral?: bigint;
  /** dApp UI mint fee (nanoERG) */
  dAppUIMintFee: bigint;
  /** dApp UI fee ErgoTree bytes */
  dAppUIFeeTree: Uint8Array;
}

export interface WriteOptionResult {
  /** 0=form, 1=signing create, 2=bot minting, 3=bot delivering, 4=done */
  step: number;
  error: string | null;
  txIds: { create?: string };
  execute: (input: WriteOptionInput) => Promise<void>;
  reset: () => void;
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds
const POLL_TIMEOUT_MS = 5 * 60_000; // 5 minutes

/**
 * Wait for a TX to appear in the mempool or get confirmed.
 * Polls every 2 seconds, up to maxAttempts.
 */
async function waitForMempool(txId: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await checkMempoolTx(txId);
      if (result.found) return;
    } catch {
      // ignore transient errors
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`TX ${txId} not found in mempool after ${maxAttempts * 2}s`);
}

/**
 * Convert a Nautilus UTXO (EIP-12 format) to Fleet SDK Box format.
 * Nautilus returns amounts as strings; Fleet SDK expects them as-is.
 */
function nautilusBoxToFleet(box: any): any {
  return {
    boxId: box.boxId,
    transactionId: box.transactionId,
    index: box.index,
    ergoTree: box.ergoTree,
    creationHeight: box.creationHeight,
    value: box.value.toString(),
    assets: (box.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: box.additionalRegisters || {},
  };
}

/**
 * Fetch the definition box from the create TX outputs.
 * The definition box is the one sent to the contract address.
 */
function findOutputBox(
  signedTx: any,
  contractErgoTree: string,
): any {
  // Signed TX has outputs array
  const outputs = signedTx.outputs || [];
  for (const output of outputs) {
    if (output.ergoTree === contractErgoTree) {
      return output;
    }
  }
  throw new Error("Definition box not found in create TX outputs");
}

/**
 * Extract the EC point from the wallet's change address ErgoTree.
 * P2PK ErgoTree = 0x0008cd + 33 bytes.
 */
function ergoTreeToECPoint(ergoTreeHex: string): Uint8Array {
  const bytes = hexToBytes(ergoTreeHex);
  if (bytes.length !== 36 || bytes[0] !== 0x00 || bytes[1] !== 0x08 || bytes[2] !== 0xcd) {
    throw new Error("Not a P2PK ErgoTree — cannot extract EC point");
  }
  return bytes.slice(3);
}

/**
 * Convert an Ergo address (base58) to its ErgoTree hex.
 * Uses the node API to resolve the address.
 */
async function addressToErgoTree(address: string): Promise<string> {
  const res = await fetch(`/api/address-to-tree?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    throw new Error("Could not resolve address to ErgoTree");
  }
  const data = await res.json();
  return data.ergoTree;
}

/**
 * Extract the ErgoTree from a Nautilus address by asking the wallet for UTXOs.
 * All wallet UTXOs have the same ErgoTree, so we can use any.
 * Falls back to fetching from the node API.
 */
async function getErgoTreeFromWallet(api: any): Promise<string> {
  const utxos = await getWalletUtxos(api);
  if (utxos.length > 0) {
    return utxos[0].ergoTree;
  }
  // Fallback: use the change address via node
  const addr = await getChangeAddress(api);
  return addressToErgoTree(addr);
}

/**
 * Poll the definition box state via the /api/poll/[boxId] route.
 * Returns the current state of the box.
 */
async function pollBoxState(
  boxId: string,
  contractAddress: string,
): Promise<PollResponse> {
  const res = await fetch(
    `/api/poll/${boxId}?contractAddress=${encodeURIComponent(contractAddress)}`,
  );
  if (!res.ok) {
    throw new Error(`Poll failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Wait for the definition box to reach a target state by polling.
 * Calls onStateChange when the state transitions.
 */
async function waitForState(
  boxId: string,
  contractAddress: string,
  targetStates: string[],
  abortSignal: AbortSignal,
  onStateChange?: (state: string) => void,
): Promise<PollResponse> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (abortSignal.aborted) {
      throw new Error("Operation cancelled");
    }

    try {
      const response = await pollBoxState(boxId, contractAddress);

      if (onStateChange) {
        onStateChange(response.state);
      }

      if (targetStates.includes(response.state)) {
        return response;
      }
    } catch {
      // ignore transient poll errors, will retry
    }

    // Wait before next poll
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, POLL_INTERVAL_MS);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("Operation cancelled"));
      };
      abortSignal.addEventListener("abort", onAbort, { once: true });
    });
  }

  throw new Error(
    "Timed out waiting for bot to process the option (5 minutes). " +
    "Check your portfolio — the definition box may need manual recovery.",
  );
}

/**
 * Get the contract address for the current deployment.
 * Uses the first CONTRACT_ADDRESSES entry.
 */
function getContractErgoTree(): string {
  if (CONTRACT_ADDRESSES.length === 0) {
    throw new Error("No contract addresses configured");
  }
  return CONTRACT_ADDRESSES[0].ergoTree;
}

export function useWriteOption(): WriteOptionResult {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txIds, setTxIds] = useState<{ create?: string }>({});
  const executingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStep(0);
    setError(null);
    setTxIds({});
    executingRef.current = false;
  }, []);

  const execute = useCallback(async (input: WriteOptionInput) => {
    if (executingRef.current) return;
    executingRef.current = true;
    setError(null);
    setTxIds({});

    // Create an abort controller for the polling phase
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      // Connect wallet
      const api = await connectNautilus();
      const changeErgoTree = await getErgoTreeFromWallet(api);
      const issuerECPoint = ergoTreeToECPoint(changeErgoTree);
      const currentHeight = await fetchHeight();

      // Underlying token ID for the register
      const underlyingId =
        input.oracleIndex === ERG_ORACLE_INDEX
          ? ""
          : REGISTRY_TOKEN_IDS[input.oracleIndex] ?? "";

      // Decimals string (matches oracle decimal format)
      const decimals = "0";

      // ---------------------------------------------------------------
      // Step 1: Create Definition Box (user signs with Nautilus)
      // ---------------------------------------------------------------
      setStep(1);

      const createParams = {
        contractErgoTree: input.contractErgoTree,
        optionName: input.optionName,
        underlyingId,
        decimals,
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
      };

      // Get wallet UTXOs via Nautilus
      const rawUtxos = await getWalletUtxos(api);
      const fleetBoxes = rawUtxos.map(nautilusBoxToFleet);

      // Build unsigned create TX
      const unsignedCreateTx = buildCreateOptionTx(
        fleetBoxes,
        createParams,
        currentHeight,
      );

      // Convert to EIP-12 format for Nautilus signing
      const createEip12 = unsignedCreateTx.toEIP12Object();

      // Sign via Nautilus (this is the ONLY wallet signature)
      const signedCreateTx = await signTx(api, createEip12);

      // Submit via API route
      const createTxId = await submitTransaction(signedCreateTx);
      setTxIds({ create: createTxId });

      // Wait for mempool acceptance
      await waitForMempool(createTxId);

      // Get the definition box ID from the signed TX
      const definitionBox = findOutputBox(signedCreateTx, input.contractErgoTree);
      if (!definitionBox.boxId) {
        throw new Error("Signed TX output missing boxId — cannot track state");
      }
      const definitionBoxId: string = definitionBox.boxId;

      // ---------------------------------------------------------------
      // Step 2: Wait for bot to mint (automatic — no user action)
      // ---------------------------------------------------------------
      setStep(2);

      const contractAddress = getContractErgoTree();

      // Poll until the box transitions to MINTED or DELIVERED
      // (bot may mint+deliver so fast we skip straight to DELIVERED)
      await waitForState(
        definitionBoxId,
        contractAddress,
        ["MINTED", "DELIVERED"],
        abortController.signal,
        (state) => {
          // If we see MINTED, advance to step 3
          if (state === "MINTED") {
            setStep(3);
          }
        },
      );

      // ---------------------------------------------------------------
      // Step 3: Wait for bot to deliver (automatic — no user action)
      // ---------------------------------------------------------------
      setStep(3);

      // If already DELIVERED from the previous poll, this returns immediately
      await waitForState(
        definitionBoxId,
        contractAddress,
        ["DELIVERED"],
        abortController.signal,
      );

      // ---------------------------------------------------------------
      // Step 4: Done — tokens delivered to wallet
      // User can list for sale from the Portfolio page
      // ---------------------------------------------------------------
      setStep(4);
    } catch (err: any) {
      const message =
        err?.message || err?.info || String(err);
      setError(message);
    } finally {
      executingRef.current = false;
      abortRef.current = null;
    }
  }, []);

  return { step, error, txIds, execute, reset };
}
