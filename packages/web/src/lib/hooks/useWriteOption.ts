"use client";

import { useState, useCallback, useRef } from "react";
import {
  buildCreateOptionTx,
  buildMintOptionTx,
  buildDeliverOptionTx,
  MINER_FEE,
  ERG_ORACLE_INDEX,
  REGISTRY_RATES,
  REGISTRY_TOKEN_IDS,
  hexToBytes,
  type OptionType,
  type OptionStyle,
  type SettlementType,
  type OptionParams,
} from "@ergo-options/core";
import {
  connectNautilus,
  signTx,
  getWalletUtxos,
  getChangeAddress,
} from "@/lib/wallet";
import { fetchHeight, submitTransaction, checkMempoolTx } from "@/lib/api";

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
  step: number; // 0=idle, 1=create, 2=mint, 3=deliver, 4=done
  error: string | null;
  txIds: { create?: string; mint?: string; deliver?: string };
  execute: (input: WriteOptionInput) => Promise<void>;
  reset: () => void;
}

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
    // Fallback: Nautilus addresses are P2PK — we can decode inline
    // For P2PK: network byte (1) + ergoTree (36 bytes) + checksum (4) = 41 bytes base58
    // But decoding base58 in JS without a lib is messy, so we use a different approach.
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

export function useWriteOption(): WriteOptionResult {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txIds, setTxIds] = useState<{
    create?: string;
    mint?: string;
    deliver?: string;
  }>({});
  const executingRef = useRef(false);

  const reset = useCallback(() => {
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
      // Step 1: Create Definition Box
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

      // Sign via Nautilus
      const signedCreateTx = await signTx(api, createEip12);

      // Submit via API route
      const createTxId = await submitTransaction(signedCreateTx);
      setTxIds((prev) => ({ ...prev, create: createTxId }));

      // Wait for mempool acceptance
      await waitForMempool(createTxId);

      // ---------------------------------------------------------------
      // Step 2: Mint Option Tokens
      // ---------------------------------------------------------------
      setStep(2);

      // The definition box is the output at the contract address
      const definitionBox = findOutputBox(signedCreateTx, input.contractErgoTree);

      // The definition box ID is the create TX's first output at contract addr
      // We need to construct the box ID. In Ergo, output box IDs are computed
      // by the node. The signed TX should have output box IDs.
      // Nautilus signed TX outputs have boxId field.
      if (!definitionBox.boxId) {
        throw new Error("Signed TX output missing boxId — cannot proceed to mint");
      }

      // Parse the R8 params for mint
      const optionParams: OptionParams = {
        optionType: input.optionType,
        style: input.style,
        shareSize: input.shareSize,
        maturityDate: input.maturityHeight,
        strikePrice: input.strikePrice,
        dAppUIMintFee: input.dAppUIMintFee,
        txFee: MINER_FEE,
        oracleIndex: input.oracleIndex,
        settlementType: input.settlementType,
        collateralCap: input.collateralCap,
        stablecoinDecimal: input.stablecoinDecimal,
      };

      // We need serialized register values from the definition box
      const defRegisters = definitionBox.additionalRegisters;
      if (!defRegisters?.R4 || !defRegisters?.R5 || !defRegisters?.R6 || !defRegisters?.R8 || !defRegisters?.R9) {
        throw new Error("Definition box missing required registers");
      }

      // Convert the definition box to Fleet SDK format for the mint builder
      const defBoxFleet = nautilusBoxToFleet(definitionBox);

      const mintParams = {
        definitionBox: defBoxFleet,
        contractErgoTree: input.contractErgoTree,
        params: optionParams,
        registryRates: REGISTRY_RATES,
        registers: {
          R4: defRegisters.R4,
          R5: defRegisters.R5,
          R6: defRegisters.R6,
          R8: defRegisters.R8,
          R9: defRegisters.R9,
        },
        changeErgoTree,
      };

      // Build unsigned mint TX
      const unsignedMintTx = buildMintOptionTx(mintParams, currentHeight);
      const mintEip12 = unsignedMintTx.toEIP12Object();

      // Sign via Nautilus
      const signedMintTx = await signTx(api, mintEip12);

      // Submit
      const mintTxId = await submitTransaction(signedMintTx);
      setTxIds((prev) => ({ ...prev, mint: mintTxId }));

      // Wait for mempool acceptance
      await waitForMempool(mintTxId);

      // ---------------------------------------------------------------
      // Step 3: Deliver Option Tokens
      // ---------------------------------------------------------------
      setStep(3);

      // The reserve box is the output at the contract address from the mint TX
      const reserveBox = findOutputBox(signedMintTx, input.contractErgoTree);

      if (!reserveBox.boxId) {
        throw new Error("Signed mint TX output missing boxId — cannot proceed to deliver");
      }

      const reserveRegisters = reserveBox.additionalRegisters;
      if (!reserveRegisters) {
        throw new Error("Reserve box missing registers");
      }

      const reserveBoxFleet = nautilusBoxToFleet(reserveBox);

      const deliverParams = {
        reserveBox: reserveBoxFleet,
        issuerECPoint,
        registers: reserveRegisters,
        changeErgoTree,
      };

      // Build unsigned deliver TX
      const unsignedDeliverTx = buildDeliverOptionTx(deliverParams, currentHeight);
      const deliverEip12 = unsignedDeliverTx.toEIP12Object();

      // Sign via Nautilus
      const signedDeliverTx = await signTx(api, deliverEip12);

      // Submit
      const deliverTxId = await submitTransaction(signedDeliverTx);
      setTxIds((prev) => ({ ...prev, deliver: deliverTxId }));

      // Wait for mempool acceptance
      await waitForMempool(deliverTxId);

      // ---------------------------------------------------------------
      // Step 4: Done
      // ---------------------------------------------------------------
      setStep(4);
    } catch (err: any) {
      const message =
        err?.message || err?.info || String(err);
      setError(message);
    } finally {
      executingRef.current = false;
    }
  }, []);

  return { step, error, txIds, execute, reset };
}
