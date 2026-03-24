"use client";

import { useEffect, useState, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import {
  USE_TOKEN_ID,
  SIGUSD_TOKEN_ID,
  REGISTRY_TOKEN_IDS,
  SELL_CONTRACT_USE_ERGOTREE,
  SELL_CONTRACT_SIGUSD_ERGOTREE,
  MINER_FEE,
  MIN_BOX_VALUE,
  DAPP_FEE_ERGOTREE,
  hexToBytes,
} from "@ergo-options/core";
import {
  signTx,
  getWalletUtxos,
} from "@/lib/wallet";
import { fetchHeight, submitTransaction } from "@/lib/api";
import { ListForSaleModal } from "./components/ListForSaleModal";

// Known tokens with human-readable names and decimals
const KNOWN_TOKENS: Record<string, { name: string; decimals: number }> = {
  [USE_TOKEN_ID]: { name: "USE (Dexy USD)", decimals: 3 },
  [SIGUSD_TOKEN_ID]: { name: "SigUSD", decimals: 2 },
};

// Add Rosen Bridge tokens from registry
const ROSEN_NAMES: Record<number, string> = {
  0: "rsETH", 1: "rsBTC", 2: "rsBNB", 3: "rsDOGE", 4: "rsADA", 18: "DexyGold",
};
const ROSEN_DECIMALS: Record<number, number> = {
  0: 9, 1: 8, 2: 9, 3: 6, 4: 6, 18: 0,
};
for (let i = 0; i < REGISTRY_TOKEN_IDS.length; i++) {
  const tid = REGISTRY_TOKEN_IDS[i];
  if (tid && ROSEN_NAMES[i]) {
    KNOWN_TOKENS[tid] = {
      name: ROSEN_NAMES[i],
      decimals: ROSEN_DECIMALS[i] ?? 0,
    };
  }
}

// Tokens relevant to options trading (filter wallet to these + ERG)
const RELEVANT_TOKEN_IDS = new Set(Object.keys(KNOWN_TOKENS));

// dApp UI fee: 1% = 10 per 1000
const DAPP_UI_FEE_PER_1000 = 10n;

interface WalletToken {
  tokenId: string;
  rawAmount: bigint;
  name: string;
  displayAmount: string;
  isRelevant: boolean;
}

function PaginatedSection({
  title,
  children,
  total,
  pageSize = 5,
}: {
  title: string;
  children: (page: number) => React.ReactNode;
  total: number;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {title}
          {total > 0 && <span className="ml-2 text-sm font-normal text-[#94a3b8]">({total})</span>}
        </h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2 py-1 bg-[#1e293b] rounded text-[#94a3b8] hover:text-[#e2e8f0] disabled:opacity-30"
            >
              &larr;
            </button>
            <span className="text-[#94a3b8]">{page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 bg-[#1e293b] rounded text-[#94a3b8] hover:text-[#e2e8f0] disabled:opacity-30"
            >
              &rarr;
            </button>
          </div>
        )}
      </div>
      {children(page)}
    </section>
  );
}

interface ContractBox {
  boxId: string;
  state: "DEFINITION" | "MINTED_UNDELIVERED" | "RESERVE" | "EXPIRED";
  name: string;
  value: number;
  optionType?: string;
  style?: string;
  settlement?: string;
  strikePrice?: number;
  maturityDate?: number;
  oracleIndex?: number;
  tokenCount?: number;
  collateralTokenId?: string;
  collateralAmount?: string;
}

function formatBlocksToTime(blocks: number): string {
  if (blocks <= 0) return "expired";
  const minutes = blocks * 2;
  if (minutes < 60) return `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `~${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `~${days}d ${hours % 24}h`;
}

/**
 * Convert a Nautilus UTXO (EIP-12 format) to Fleet SDK Box format.
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
 * Fetch a box by ID from the node (via our API proxy).
 */
async function fetchBoxById(boxId: string): Promise<any> {
  const res = await fetch(`/api/box-by-id?boxId=${boxId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch box ${boxId}: ${text}`);
  }
  return res.json();
}

/**
 * Convert node box format to Fleet SDK box format.
 */
function nodeBoxToFleet(box: any): any {
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

export default function PortfolioPage() {
  const { connected, address, api, ergBalance } = useWalletStore();
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [contractBoxes, setContractBoxes] = useState<ContractBox[]>([]);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [exerciseWindow, setExerciseWindow] = useState(720);
  const [loading, setLoading] = useState(false);

  // List for Sale modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellModalBox, setSellModalBox] = useState<ContractBox | null>(null);
  const [sellModalTokenBalance, setSellModalTokenBalance] = useState(0n);

  // Action status for Reclaim/Close buttons
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  const loadTokens = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const utxos = await api.get_utxos();
      if (!utxos) { setLoading(false); return; }

      const tokenMap = new Map<string, bigint>();
      for (const utxo of utxos) {
        if (utxo.assets) {
          for (const asset of utxo.assets) {
            const prev = tokenMap.get(asset.tokenId) ?? 0n;
            tokenMap.set(asset.tokenId, prev + BigInt(asset.amount));
          }
        }
      }

      const tokenList: WalletToken[] = [];
      for (const [tokenId, rawAmount] of tokenMap) {
        const known = KNOWN_TOKENS[tokenId];
        const isRelevant = RELEVANT_TOKEN_IDS.has(tokenId);
        const name = known?.name ?? tokenId.slice(0, 8) + "..." + tokenId.slice(-6);
        const decimals = known?.decimals ?? 0;
        const displayAmount = decimals > 0
          ? (Number(rawAmount) / Math.pow(10, decimals)).toFixed(decimals)
          : rawAmount.toString();

        tokenList.push({ tokenId, rawAmount, name, displayAmount, isRelevant });
      }

      // Sort: relevant first, then by amount descending
      tokenList.sort((a, b) => {
        if (a.isRelevant && !b.isRelevant) return -1;
        if (!a.isRelevant && b.isRelevant) return 1;
        return Number(b.rawAmount - a.rawAmount);
      });

      setTokens(tokenList);

      // Also scan contract address for boxes belonging to this wallet
      try {
        // Try all wallet addresses + all UTXOs to find EC points
        const addrs = await api.get_used_addresses();
        const allECPoints = new Set<string>();

        // Get EC point for each wallet address via node API
        // Ergo P2PK addresses decode to a raw 33-byte public key
        for (const addr of (addrs || []).slice(0, 5)) {
          try {
            const rawRes = await fetch(`/api/address-to-raw?address=${addr}`);
            if (rawRes.ok) {
              const rawData = await rawRes.json();
              if (rawData.raw && rawData.raw.length === 66) {
                allECPoints.add(rawData.raw);
              }
            }
          } catch { /* ignore */ }
        }

        // Also try extracting from UTXOs as fallback
        for (const utxo of (utxos || [])) {
          const tree = utxo.ergoTree as string | undefined;
          if (!tree) continue;
          const idx = tree.indexOf("0008cd");
          if (idx >= 0 && tree.length >= idx + 6 + 66) {
            allECPoints.add(tree.slice(idx + 6, idx + 6 + 66));
          }
        }

        // Try each EC point against the my-boxes API
        for (const ecPoint of allECPoints) {
          const myBoxesRes = await fetch(`/api/my-boxes?ecPoint=${ecPoint}`);
          if (myBoxesRes.ok) {
            const data = await myBoxesRes.json();
            if (data.boxes && data.boxes.length > 0) {
              setContractBoxes(data.boxes);
              if (data.currentHeight) setCurrentHeight(data.currentHeight);
              if (data.exerciseWindow) setExerciseWindow(data.exerciseWindow);
              break;
            }
          }
        }
      } catch (err) {
        console.error("Failed to scan contract boxes:", err);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (connected && api) {
      loadTokens();
      const interval = setInterval(loadTokens, 120_000);
      return () => clearInterval(interval);
    }
  }, [connected, api, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // TX FLOW: List for Sale
  // ═══════════════════════════════════════════════════════════════

  const handleListForSaleClick = useCallback(async (box: ContractBox) => {
    if (!api) return;

    // The option token ID = the definition box ID (stored in R7 of the reserve box).
    // The reserve box has boxId but the token ID is the *creation* box ID.
    // For a RESERVE box, the singleton token ID = the token on the box.
    // We need to find how many tokens the user holds in their wallet.
    // The token ID is derived from the contract box's creation box ID (R7).
    // Since the my-boxes API already parsed this, we can look for any token
    // in the user's wallet that is NOT a known stablecoin/registry token.
    // More reliably: the option token was delivered to the user's wallet with
    // tokenId = the definition box ID. For RESERVE boxes, the singleton remains
    // on-chain. The delivered tokens share the same token ID.
    // We fetch the box to read R7 (creation box ID) = option token ID.

    try {
      const nodeBox = await fetchBoxById(box.boxId);
      const r7hex = nodeBox.additionalRegisters?.R7;
      if (!r7hex || !r7hex.startsWith("0e20")) {
        throw new Error("Cannot read option token ID from reserve box R7");
      }
      const optionTokenId = r7hex.slice(4); // 32 bytes hex

      // Find how many of this token the user holds
      const utxos = await api.get_utxos();
      let walletTokenBalance = 0n;
      if (utxos) {
        for (const utxo of utxos) {
          if (utxo.assets) {
            for (const asset of utxo.assets) {
              if (asset.tokenId === optionTokenId) {
                walletTokenBalance += BigInt(asset.amount);
              }
            }
          }
        }
      }

      if (walletTokenBalance <= 0n) {
        alert("You don't have any option tokens for this contract in your wallet. They may not have been delivered yet.");
        return;
      }

      setSellModalBox(box);
      setSellModalTokenBalance(walletTokenBalance);
      setSellModalOpen(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }, [api]);

  const handleListForSaleSubmit = useCallback(async (params: {
    stablecoin: "USE" | "SigUSD";
    premiumPerToken: bigint;
    tokenAmount: bigint;
  }) => {
    if (!api || !sellModalBox) throw new Error("Wallet not connected");

    // Dynamically import Fleet SDK (only needed for TX building)
    const { OutputBuilder, TransactionBuilder } = await import("@fleet-sdk/core");
    const { SColl, SLong, SByte } = await import("@fleet-sdk/serializer");

    // Determine which sell contract and payment token to use
    const sellContractErgoTree = params.stablecoin === "USE"
      ? SELL_CONTRACT_USE_ERGOTREE
      : SELL_CONTRACT_SIGUSD_ERGOTREE;

    // Get the option token ID from the reserve box
    const nodeBox = await fetchBoxById(sellModalBox.boxId);
    const r7hex = nodeBox.additionalRegisters?.R7;
    if (!r7hex || !r7hex.startsWith("0e20")) {
      throw new Error("Cannot read option token ID from reserve box R7");
    }
    const optionTokenId = r7hex.slice(4);

    // Get wallet ErgoTree for change address and seller SigmaProp
    const rawUtxos = await getWalletUtxos(api);
    const fleetBoxes = rawUtxos.map(nautilusBoxToFleet);

    // Find boxes containing the option token
    const tokenBoxes = fleetBoxes.filter((b: any) =>
      b.assets.some((a: any) => a.tokenId === optionTokenId),
    );
    if (tokenBoxes.length === 0) {
      throw new Error("No wallet boxes contain the option token");
    }

    // Use all wallet boxes as potential inputs (Fleet SDK selects what's needed)
    const walletErgoTree = rawUtxos[0].ergoTree;
    const height = await fetchHeight();

    const txFee = MINER_FEE;
    const sellBoxValue = MIN_BOX_VALUE + txFee; // enough for miner fee on buy TX

    // R4: Seller's SigmaProp — the ErgoTree hex is the pre-serialized representation
    // For a P2PK ErgoTree (0008cd...), Nautilus expects the SigmaProp serialization:
    // 08cd + 33-byte EC point (sigma type byte 0x08 = SigmaProp, cd = proveDlog)
    const sellerSigmaPropHex = "08cd" + walletErgoTree.slice(6);

    // R5: Coll[Long] = [premiumPerToken, dAppUIFeePer1000, txFee]
    const r5 = SColl(SLong, [params.premiumPerToken, DAPP_UI_FEE_PER_1000, txFee]);

    // R6: Coll[Byte] = dApp UI fee ErgoTree bytes
    const dappFeeTreeBytes = hexToBytes(DAPP_FEE_ERGOTREE);
    const r6 = SColl(SByte, dappFeeTreeBytes);

    // Build sell order output
    const sellOutput = new OutputBuilder(sellBoxValue, sellContractErgoTree)
      .addTokens({ tokenId: optionTokenId, amount: params.tokenAmount })
      .setAdditionalRegisters({
        R4: sellerSigmaPropHex,
        R5: r5,
        R6: r6,
      });

    // Build the TX with explicit miner fee
    const unsignedTx = new TransactionBuilder(height)
      .from(fleetBoxes)
      .to([sellOutput])
      .sendChangeTo(walletErgoTree)
      .payFee(txFee)
      .build();

    const eip12Tx = unsignedTx.toEIP12Object();
    const signedTx = await signTx(api, eip12Tx);
    const txId = await submitTransaction(signedTx);

    console.log("Sell order TX submitted:", txId);

    // Refresh after a short delay
    setTimeout(() => loadTokens(), 5000);
  }, [api, sellModalBox, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // TX FLOW: Reclaim (Refund definition box)
  // ═══════════════════════════════════════════════════════════════

  const handleReclaim = useCallback(async (box: ContractBox) => {
    if (!api) return;

    setActionStatus((prev) => ({ ...prev, [box.boxId]: "Preparing..." }));

    try {
      const { OutputBuilder, TransactionBuilder } = await import("@fleet-sdk/core");

      // Fetch the definition box from the node
      const nodeBox = await fetchBoxById(box.boxId);
      const contractBox = nodeBoxToFleet(nodeBox);

      // Get wallet UTXOs for additional ERG input (to cover miner fee)
      const rawUtxos = await getWalletUtxos(api);
      const fleetWalletBoxes = rawUtxos.map(nautilusBoxToFleet);
      const walletErgoTree = rawUtxos[0].ergoTree;

      const height = await fetchHeight();
      const txFee = MINER_FEE;

      // Include wallet boxes as inputs to cover miner fee
      const allInputs = [contractBox, ...fleetWalletBoxes];

      // Refund output: definition box value goes back to user.
      // Fleet SDK sendChangeTo handles wallet ERG change separately.
      const refundOutput = new OutputBuilder(
        BigInt(contractBox.value),
        walletErgoTree,
      );

      // Return all tokens from the definition box to user
      if (contractBox.assets && contractBox.assets.length > 0) {
        for (const asset of contractBox.assets) {
          if (BigInt(asset.amount) > 0n) {
            refundOutput.addTokens({
              tokenId: asset.tokenId,
              amount: asset.amount,
            });
          }
        }
      }

      const unsignedTx = new TransactionBuilder(height)
        .from(allInputs)
        .to([refundOutput])
        .sendChangeTo(walletErgoTree)
        .payFee(txFee)
        .build();

      setActionStatus((prev) => ({ ...prev, [box.boxId]: "Sign in wallet..." }));

      const eip12Tx = unsignedTx.toEIP12Object();
      const signedTx = await signTx(api, eip12Tx);
      const txId = await submitTransaction(signedTx);

      setActionStatus((prev) => ({ ...prev, [box.boxId]: `Submitted: ${txId.slice(0, 8)}...` }));
      console.log("Reclaim TX submitted:", txId);

      setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[box.boxId];
          return next;
        });
        loadTokens();
      }, 10000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setActionStatus((prev) => ({ ...prev, [box.boxId]: `Error: ${msg.slice(0, 40)}` }));
      console.error("Reclaim failed:", err);
      setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[box.boxId];
          return next;
        });
      }, 8000);
    }
  }, [api, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // TX FLOW: Close (Expired reserve)
  // ═══════════════════════════════════════════════════════════════

  const handleClose = useCallback(async (box: ContractBox) => {
    if (!api) return;

    setActionStatus((prev) => ({ ...prev, [box.boxId]: "Preparing..." }));

    try {
      const { OutputBuilder, TransactionBuilder } = await import("@fleet-sdk/core");

      // Fetch the expired reserve box from the node
      const nodeBox = await fetchBoxById(box.boxId);
      const reserveBox = nodeBoxToFleet(nodeBox);

      // Get wallet UTXOs for miner fee
      const rawUtxos = await getWalletUtxos(api);
      const fleetWalletBoxes = rawUtxos.map(nautilusBoxToFleet);
      const walletErgoTree = rawUtxos[0].ergoTree;

      const height = await fetchHeight();
      const txFee = MINER_FEE;

      // Extract issuer address from R9 — the first Coll[Byte] in Coll[Coll[Byte]]
      // The issuer is the user themselves (this is their box from portfolio)
      // Issuer ErgoTree = 0008cd + R9[0] EC point
      // Since this is the user's own box, the issuer ErgoTree = walletErgoTree
      const issuerErgoTree = walletErgoTree;

      // All inputs: the reserve box + wallet boxes for fee
      const allInputs = [reserveBox, ...fleetWalletBoxes];

      // Output[0]: collateral + ERG goes back to issuer (the user)
      const issuerOutputValue = BigInt(reserveBox.value);
      const issuerOutput = new OutputBuilder(issuerOutputValue, issuerErgoTree);

      // Add collateral tokens (tokens[1]) if present
      if (reserveBox.assets.length > 1) {
        issuerOutput.addTokens({
          tokenId: reserveBox.assets[1].tokenId,
          amount: reserveBox.assets[1].amount,
        });
      }

      // Singleton token (tokens[0]) is burned
      const singletonTokenId = reserveBox.assets[0]?.tokenId;
      const singletonAmount = reserveBox.assets[0]?.amount;

      const builder = new TransactionBuilder(height)
        .from(allInputs)
        .to([issuerOutput])
        .sendChangeTo(walletErgoTree)
        .payFee(txFee);

      // Burn the singleton option token
      if (singletonTokenId && BigInt(singletonAmount) > 0n) {
        builder.burnTokens({
          tokenId: singletonTokenId,
          amount: singletonAmount,
        });
      }

      const unsignedTx = builder.build();

      setActionStatus((prev) => ({ ...prev, [box.boxId]: "Sign in wallet..." }));

      const eip12Tx = unsignedTx.toEIP12Object();
      const signedTx = await signTx(api, eip12Tx);
      const txId = await submitTransaction(signedTx);

      setActionStatus((prev) => ({ ...prev, [box.boxId]: `Submitted: ${txId.slice(0, 8)}...` }));
      console.log("Close TX submitted:", txId);

      setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[box.boxId];
          return next;
        });
        loadTokens();
      }, 10000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setActionStatus((prev) => ({ ...prev, [box.boxId]: `Error: ${msg.slice(0, 40)}` }));
      console.error("Close failed:", err);
      setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[box.boxId];
          return next;
        });
      }, 8000);
    }
  }, [api, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-2">Portfolio</h1>
        <p className="text-[#94a3b8] mb-4">Connect your wallet to view positions</p>
        <p className="text-sm text-[#94a3b8]/60">
          Click &quot;Connect Wallet&quot; in the top right to get started
        </p>
      </div>
    );
  }

  const relevantTokens = tokens.filter((t) => t.isRelevant);
  const ergDisplay = ergBalance ? (Number(ergBalance) / 1e9).toFixed(4) : "0";
  const PAGE_SIZE = 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <button
          onClick={loadTokens}
          disabled={loading}
          className="px-3 py-1.5 bg-[#1e293b] text-[#94a3b8] rounded-lg text-sm hover:text-[#e2e8f0] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Active Options (Holding) */}
      <PaginatedSection title="Active Options (Holding)" total={0} pageSize={PAGE_SIZE}>
        {() => (
          <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e293b]">
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Qty</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#94a3b8]">
                    No active option positions
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </PaginatedSection>

      {/* Written Options (Issuer) */}
      <PaginatedSection title="Written Options (Issuer)" total={0} pageSize={PAGE_SIZE}>
        {() => (
          <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-8 text-center text-[#94a3b8]">
            No written options
          </div>
        )}
      </PaginatedSection>

      {/* Open Orders */}
      <PaginatedSection title="Open Orders" total={0} pageSize={PAGE_SIZE}>
        {() => (
          <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-8 text-center text-[#94a3b8]">
            No open orders
          </div>
        )}
      </PaginatedSection>

      {/* Stuck / Reclaimable + Active Reserves */}
      <PaginatedSection title="My Contract Boxes" total={contractBoxes.length} pageSize={PAGE_SIZE}>
        {(page) => {
          const pageBoxes = contractBoxes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
              {pageBoxes.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b]">
                      <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">State</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">ERG Locked</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageBoxes.map((box) => (
                      <tr key={box.boxId} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30">
                        <td className="py-2 px-4 text-[#e2e8f0]">{box.name}</td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            box.state === "DEFINITION" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                            box.state === "MINTED_UNDELIVERED" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                            box.state === "RESERVE" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                            "bg-[#ef4444]/20 text-[#ef4444]"
                          }`}>
                            {box.state === "DEFINITION" ? "Pending Mint" :
                             box.state === "MINTED_UNDELIVERED" ? "Pending Delivery" :
                             box.state === "RESERVE" ? "Active" :
                             "Expired"}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#eab308]">
                          {box.strikePrice ? `$${box.strikePrice >= 100 ? box.strikePrice.toFixed(0) : box.strikePrice.toFixed(4)}` : "\u2014"}
                        </td>
                        {/* Expiry info */}
                        <td className="py-2 px-4 text-right">
                          {box.maturityDate ? (() => {
                            const blocksToExpiry = box.maturityDate - currentHeight;
                            const expiryWithWindow = box.maturityDate + exerciseWindow;
                            const blocksToClose = expiryWithWindow - currentHeight;
                            const isExpired = currentHeight > expiryWithWindow;
                            const isExercisable = box.style === "american"
                              ? currentHeight <= expiryWithWindow
                              : currentHeight >= box.maturityDate && currentHeight <= expiryWithWindow;

                            return (
                              <div className="text-xs space-y-0.5">
                                <div className="font-mono text-[#94a3b8]">
                                  Block {box.maturityDate.toLocaleString()}
                                </div>
                                {isExpired ? (
                                  <div className="text-[#ef4444]">Expired</div>
                                ) : blocksToExpiry > 0 ? (
                                  <div className="text-[#e2e8f0]">
                                    {formatBlocksToTime(blocksToExpiry)} to maturity
                                  </div>
                                ) : (
                                  <div className="text-[#f59e0b]">
                                    Exercise window: {formatBlocksToTime(blocksToClose)}
                                  </div>
                                )}
                                {isExercisable && (
                                  <div className="text-[#22c55e] font-semibold">Exercisable</div>
                                )}
                              </div>
                            );
                          })() : "\u2014"}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#94a3b8]">
                          {(box.value / 1e9).toFixed(4)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {actionStatus[box.boxId] ? (
                            <span className="text-xs text-[#94a3b8]">{actionStatus[box.boxId]}</span>
                          ) : (
                            <>
                              {box.state === "DEFINITION" && (
                                <button
                                  onClick={() => handleReclaim(box)}
                                  className="text-xs px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded hover:bg-[#f59e0b]/30"
                                >
                                  Reclaim
                                </button>
                              )}
                              {box.state === "EXPIRED" && (
                                <button
                                  onClick={() => handleClose(box)}
                                  className="text-xs px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] rounded hover:bg-[#ef4444]/30"
                                >
                                  Close
                                </button>
                              )}
                              {box.state === "RESERVE" && (
                                <button
                                  onClick={() => handleListForSaleClick(box)}
                                  className="text-xs px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                                >
                                  List for Sale
                                </button>
                              )}
                              {box.state === "MINTED_UNDELIVERED" && (
                                <span className="text-xs text-[#3b82f6]">Bot handling...</span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-[#94a3b8]">
                  {loading ? "Scanning contract..." : "No boxes found at contract address"}
                </div>
              )}
            </div>
          );
        }}
      </PaginatedSection>

      {/* Wallet Balances — only relevant assets */}
      <PaginatedSection title="Wallet Balances" total={relevantTokens.length + 1} pageSize={PAGE_SIZE}>
        {(page) => {
          const allRows = [
            { tokenId: "ERG", name: "ERG", displayAmount: ergDisplay, isNative: true },
            ...relevantTokens.map((t) => ({ ...t, isNative: false })),
          ];
          const pageRows = allRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

          return (
            <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e293b]">
                    <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Token ID</th>
                    <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length > 0 ? pageRows.map((t) => (
                    <tr key={t.tokenId} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30">
                      <td className="py-2 px-4 text-[#e2e8f0] font-medium">
                        {t.name}
                      </td>
                      <td className="py-2 px-4 font-mono text-xs text-[#94a3b8]">
                        {t.isNative ? "native" : `${t.tokenId.slice(0, 12)}...${t.tokenId.slice(-6)}`}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-[#eab308]">
                        {t.displayAmount}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-[#94a3b8]">
                        {loading ? "Loading..." : "No relevant tokens found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        }}
      </PaginatedSection>

      {/* List for Sale Modal */}
      {sellModalBox && (
        <ListForSaleModal
          isOpen={sellModalOpen}
          onClose={() => {
            setSellModalOpen(false);
            setSellModalBox(null);
          }}
          optionTokenId={sellModalBox.boxId}
          maxTokens={sellModalTokenBalance}
          optionName={sellModalBox.name}
          optionType={sellModalBox.optionType}
          strikePrice={sellModalBox.strikePrice}
          maturityDate={sellModalBox.maturityDate}
          oracleIndex={sellModalBox.oracleIndex}
          onSubmit={handleListForSaleSubmit}
        />
      )}
    </div>
  );
}
