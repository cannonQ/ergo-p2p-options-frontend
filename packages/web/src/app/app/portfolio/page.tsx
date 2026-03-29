"use client";

import { useEffect, useState, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import { SkeletonRow } from "@/app/components/Skeleton";
import { useToast } from "@/app/components/Toast";
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
import { parseCollLong, hexToBytes as hexToBytesOracle } from "@/lib/oracle-parser";
import { ListForSaleModal } from "./components/ListForSaleModal";
import { ExerciseDialog } from "./components/ExerciseDialog";

// Known tokens with human-readable names and decimals
const KNOWN_TOKENS: Record<string, { name: string; decimals: number }> = {
  [USE_TOKEN_ID]: { name: "USE (Dexy USD)", decimals: 3 },
  [SIGUSD_TOKEN_ID]: { name: "SigUSD", decimals: 2 },
};

// Add Rosen Bridge tokens from registry
const ROSEN_NAMES: Record<number, string> = {
  0: "rsETH", 1: "rsBTC", 2: "rsBNB", 3: "rsDOGE", 4: "rsADA", 17: "ERG", 18: "DexyGold",
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
          {total > 0 && <span className="ml-2 text-sm font-normal text-[#8891a5]">({total})</span>}
        </h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2 py-1 bg-[#1e2330] rounded text-[#8891a5] hover:text-[#e8eaf0] disabled:opacity-30"
              aria-label="Previous page"
            >
              &larr;
            </button>
            <span className="text-[#8891a5]">{page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 bg-[#1e2330] rounded text-[#8891a5] hover:text-[#e8eaf0] disabled:opacity-30"
              aria-label="Next page"
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

/** Format collateral value: show token amount if present, otherwise ERG */
function formatCollateral(box: ContractBox): string {
  if (box.collateralTokenId && box.collateralAmount) {
    const known = KNOWN_TOKENS[box.collateralTokenId];
    if (known) {
      const raw = BigInt(box.collateralAmount);
      const display = known.decimals > 0
        ? (Number(raw) / Math.pow(10, known.decimals)).toFixed(known.decimals)
        : raw.toString();
      return `${display} ${known.name.replace(" (Dexy USD)", "")}`;
    }
    // Unknown token — show raw
    return `${box.collateralAmount} ???`;
  }
  return `${(box.value / 1e9).toFixed(4)} ERG`;
}

import { nautilusBoxToFleet, nodeBoxToFleet } from "@/lib/box-utils";
import type { ParsedSellOrder } from "@/lib/sell-order-scanner";

/** Read VLQ-encoded unsigned integer from bytes */
function readVLQ(bytes: Uint8Array, startOffset: number): { value: number; offset: number } {
  let value = 0;
  let shift = 0;
  let offset = startOffset;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return { value, offset };
}

/** Extract issuer EC point (33 bytes) from R9 Coll[Coll[Byte]] */
function extractECPointFromR9(bytes: Uint8Array): Uint8Array | null {
  let offset = 0;
  if (bytes[offset] !== 0x1a) return null; // type 0x1a = Coll[Coll[Byte]]
  offset++;
  const outer = readVLQ(bytes, offset);
  offset = outer.offset;
  if (outer.value < 1) return null;
  const inner = readVLQ(bytes, offset);
  offset = inner.offset;
  if (inner.value !== 33) return null;
  return bytes.slice(offset, offset + 33);
}

/** Parse Coll[Coll[Byte]] to array of hex strings (for registry R4 token IDs) */
function parseCollCollByteToHexStrings(bytes: Uint8Array): string[] | null {
  let offset = 0;
  if (bytes[offset] !== 0x1a) return null;
  offset++;
  const outer = readVLQ(bytes, offset);
  offset = outer.offset;
  const results: string[] = [];
  for (let i = 0; i < outer.value; i++) {
    const inner = readVLQ(bytes, offset);
    offset = inner.offset;
    const raw = bytes.slice(offset, offset + inner.value);
    results.push(Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(''));
    offset += inner.value;
  }
  return results;
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

interface HoldingPosition {
  optionTokenId: string;
  quantity: bigint;
  reserveBoxId: string;
  name: string;
  optionType: string;
  settlement: string;
  style: string;
  strikePrice: number;
  maturityHeight: number;
  oracleIndex: number;
  assetName: string;
  state: string;
}

export default function PortfolioPage() {
  const { connected, address: walletAddr, api, ergBalance, walletType } = useWalletStore();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [holdings, setHoldings] = useState<HoldingPosition[]>([]);
  const [contractBoxes, setContractBoxes] = useState<ContractBox[]>([]);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [exerciseWindow, setExerciseWindow] = useState(720);
  const [loading, setLoading] = useState(false);

  // List for Sale modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellModalBox, setSellModalBox] = useState<ContractBox | null>(null);
  const [sellModalTokenBalance, setSellModalTokenBalance] = useState(0n);
  const [sellModalContractSize, setSellModalContractSize] = useState<number | undefined>();

  // Exercise modal state
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseModalBox, setExerciseModalBox] = useState<ContractBox | null>(null);
  const [exerciseModalTokenBalance, setExerciseModalTokenBalance] = useState(0n);
  const [exerciseModalSpotPrice, setExerciseModalSpotPrice] = useState<number | undefined>();
  const [exerciseModalContractSize, setExerciseModalContractSize] = useState<number | undefined>();
  const [exerciseModalOracleIndex, setExerciseModalOracleIndex] = useState<number | undefined>();
  const [exerciseModalStablecoin, setExerciseModalStablecoin] = useState<"USE" | "SigUSD">("USE");

  // Open sell orders belonging to wallet
  const [openOrders, setOpenOrders] = useState<(ParsedSellOrder & { optionName?: string })[]>([]);

  // Lookup maps built during loadTokens
  const [tokenIdToName, setTokenIdToName] = useState<Map<string, string>>(new Map());
  const [reserveBoxIdToTokenId, setReserveBoxIdToTokenId] = useState<Map<string, string>>(new Map());
  const [walletTokenMap, setWalletTokenMap] = useState<Map<string, bigint>>(new Map());

  // Action status for Reclaim/Close/Cancel buttons
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  // Success banner for actions that remove the row (close, cancel)
  const [successBanner, setSuccessBanner] = useState<{ message: string; txId: string } | null>(null);

  // Error state for failed data loading
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    if (!api && walletType !== "ergopay") return;
    if (walletType === "ergopay" && !walletAddr) return;
    setLoading(true);
    setLoadError(null);
    try {
      // Always fetch current height first
      try {
        const h = await fetchHeight();
        if (h > 0) setCurrentHeight(h);
      } catch { /* ignore — height is non-critical */ }

      // Fetch UTXOs — either from Nautilus API or node for ErgoPay
      let utxos: any[];
      if (walletType === "ergopay" && walletAddr) {
        const boxRes = await fetch(`/api/boxes?address=${walletAddr}`);
        if (!boxRes.ok) throw new Error("Failed to fetch wallet boxes");
        const { boxes } = await boxRes.json();
        utxos = boxes || [];
      } else {
        utxos = await api.get_utxos();
      }
      if (!utxos || utxos.length === 0) { setLoading(false); return; }

      const tokenMap = new Map<string, bigint>();
      for (const utxo of utxos) {
        if (utxo.assets) {
          for (const asset of utxo.assets) {
            const prev = tokenMap.get(asset.tokenId) ?? 0n;
            tokenMap.set(asset.tokenId, prev + BigInt(asset.amount));
          }
        }
      }

      setWalletTokenMap(new Map(tokenMap));

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

      // Scan reserves and match wallet tokens to identify held options
      try {
        const reservesRes = await fetch("/api/reserves");
        if (reservesRes.ok) {
          const { reserves } = await reservesRes.json();
          const holdingPositions: HoldingPosition[] = [];
          const nameMap = new Map<string, string>();
          const boxToTokenMap = new Map<string, string>();

          for (const reserve of reserves) {
            // Build lookup maps for all reserves (not just RESERVE state)
            if (reserve.optionTokenId) {
              nameMap.set(reserve.optionTokenId, reserve.name);
              boxToTokenMap.set(reserve.boxId, reserve.optionTokenId);
            }

            if (!reserve.optionTokenId || reserve.state !== "RESERVE") continue;
            const walletQty = tokenMap.get(reserve.optionTokenId);
            if (walletQty && walletQty > 0n) {
              holdingPositions.push({
                optionTokenId: reserve.optionTokenId,
                quantity: walletQty,
                reserveBoxId: reserve.boxId,
                name: reserve.name,
                optionType: reserve.optionType,
                settlement: reserve.settlement,
                style: reserve.style,
                strikePrice: reserve.strikePrice,
                maturityHeight: reserve.maturityHeight,
                oracleIndex: reserve.oracleIndex,
                assetName: reserve.assetName,
                state: reserve.state,
              });
            }
          }

          setHoldings(holdingPositions);
          setTokenIdToName(nameMap);
          setReserveBoxIdToTokenId(boxToTokenMap);
        }
      } catch (err) {
        console.error("Failed to scan holdings:", err);
      }

      // Also scan contract address for boxes belonging to this wallet
      try {
        // Try all wallet addresses + all UTXOs to find EC points
        let addrs: string[] = [];
        if (walletType === "ergopay" && walletAddr) {
          addrs = [walletAddr];
        } else if (api) {
          addrs = await api.get_used_addresses();
        }
        const allECPoints = new Set<string>();

        // Get EC point for each wallet address via node API
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
        // Scan sell orders belonging to this wallet
        try {
          const ordersRes = await fetch("/api/sell-orders");
          if (ordersRes.ok) {
            const { orders } = await ordersRes.json() as { orders: ParsedSellOrder[] };
            // R4 = "08cd" + 33-byte EC point hex. Extract EC point and match wallet.
            const myOrders = orders.filter((o) => {
              const ecFromR4 = o.sellerPropBytes.slice(4); // strip "08cd"
              return allECPoints.has(ecFromR4);
            });
            setOpenOrders(myOrders);
          }
        } catch (err) {
          console.error("Failed to scan sell orders:", err);
        }
      } catch (err) {
        console.error("Failed to scan contract boxes:", err);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
      setLoadError("Failed to load portfolio data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [api, walletType, walletAddr]);

  useEffect(() => {
    if (connected && (api || walletType === "ergopay")) {
      loadTokens();
      const interval = setInterval(loadTokens, 120_000);
      return () => clearInterval(interval);
    }
  }, [connected, api, walletType, loadTokens]);

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
        toast("You don't have any option tokens for this contract in your wallet. They may not have been delivered yet.");
        return;
      }

      // Read R8 to get shareSize → contractSize
      let contractSize: number | undefined;
      const r8hex = nodeBox.additionalRegisters?.R8;
      if (r8hex) {
        const r8bytes = hexToBytesOracle(r8hex);
        const r8vals = parseCollLong(r8bytes);
        if (r8vals && r8vals.length >= 3) {
          const shareSize = Number(r8vals[2]);
          contractSize = shareSize / 1_000_000; // ORACLE_DECIMAL
        }
      }

      setSellModalBox(box);
      setSellModalTokenBalance(walletTokenBalance);
      setSellModalContractSize(contractSize);
      setSellModalOpen(true);
    } catch (err: any) {
      toast(`Error: ${err.message}`);
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

    return txId;
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

      // Contract refund path requires EXACTLY 2 outputs: refund + miner fee.
      // Do NOT add wallet boxes or use sendChangeTo — that creates a 3rd output.
      const allInputs = [contractBox];

      // Refund output: definition box value minus fee goes back to user
      const refundValue = BigInt(contractBox.value) - txFee;
      const refundOutput = new OutputBuilder(refundValue, walletErgoTree);

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

      // Ensure height >= max creationHeight of input
      let safeHeight = height;
      const ch = Number(contractBox.creationHeight ?? 0);
      if (ch > safeHeight) safeHeight = ch;

      const unsignedTx = new TransactionBuilder(safeHeight)
        .from(allInputs)
        .to([refundOutput])
        .payFee(txFee)
        .build();

      setActionStatus((prev) => ({ ...prev, [box.boxId]: "Sign in wallet..." }));

      const eip12Tx = unsignedTx.toEIP12Object();
      console.log("[Reclaim] EIP-12 TX:", JSON.stringify(eip12Tx, (_, v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 500));
      const signedTx = await signTx(api, eip12Tx);
      const txId = await submitTransaction(signedTx);

      setActionStatus((prev) => ({ ...prev, [box.boxId]: `Submitted: ${txId.slice(0, 8)}...` }));
      setContractBoxes((prev) => prev.filter((b) => b.boxId !== box.boxId));
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

      const height = await fetchHeight();
      const txFee = MINER_FEE;

      // Extract issuer address from R9 (first EC point in Coll[Coll[Byte]])
      const r9hex = nodeBox.additionalRegisters?.R9;
      if (!r9hex) throw new Error("Reserve box missing R9 register");
      const r9bytes = hexToBytesOracle(r9hex);
      const issuerECPoint = extractECPointFromR9(r9bytes);
      if (!issuerECPoint) throw new Error("Cannot parse issuer EC point from R9");
      const ecHex = Array.from(issuerECPoint).map(b => b.toString(16).padStart(2, '0')).join('');
      const issuerErgoTree = "0008cd" + ecHex;

      // Only the reserve box as input — fee comes from reserve ERG.
      // Contract requires OUTPUTS.size == 2 (issuer output + miner fee).
      // Including wallet boxes would create a 3rd change output, failing the script.
      const allInputs = [reserveBox];

      // Output[0]: collateral + ERG goes back to issuer (minus fee)
      const issuerOutputValue = BigInt(reserveBox.value) - txFee;
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
        .sendChangeTo(issuerErgoTree)
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

      setContractBoxes((prev) => prev.filter((b) => b.boxId !== box.boxId));
      setSuccessBanner({ message: "Option closed — collateral returned to your wallet", txId });
      console.log("Close TX submitted:", txId);
      loadTokens();
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
  // TX FLOW: Cancel Sell Order
  // ═══════════════════════════════════════════════════════════════

  const handleCancelSellOrder = useCallback(async (order: ParsedSellOrder) => {
    if (!api) return;

    setActionStatus((prev) => ({ ...prev, [order.boxId]: "Preparing..." }));

    try {
      const { TransactionBuilder } = await import("@fleet-sdk/core");

      // Fetch the sell order box from the node
      const nodeBox = await fetchBoxById(order.boxId);
      const sellBox = nodeBoxToFleet(nodeBox);

      // Get wallet UTXOs for miner fee
      const rawUtxos = await getWalletUtxos(api);
      const fleetWalletBoxes = rawUtxos.map(nautilusBoxToFleet);
      const walletErgoTree = rawUtxos[0].ergoTree;

      const height = await fetchHeight();
      const txFee = MINER_FEE;

      // The FixedPriceSell contract allows the seller (R4 SigmaProp) to spend freely.
      // We simply send all contents (ERG + option tokens) back to the wallet.
      const allInputs = [sellBox, ...fleetWalletBoxes];

      const unsignedTx = new TransactionBuilder(height)
        .from(allInputs)
        .sendChangeTo(walletErgoTree)
        .payFee(txFee)
        .build();

      setActionStatus((prev) => ({ ...prev, [order.boxId]: "Sign in wallet..." }));

      const eip12Tx = unsignedTx.toEIP12Object();
      const signedTx = await signTx(api, eip12Tx);
      const txId = await submitTransaction(signedTx);

      setOpenOrders((prev) => prev.filter((o) => o.boxId !== order.boxId));
      setSuccessBanner({ message: "Sell order cancelled — tokens returned to your wallet", txId });
      console.log("Cancel sell order TX submitted:", txId);
      loadTokens();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("declined") || msg.includes("Refused")) {
        setActionStatus((prev) => ({ ...prev, [order.boxId]: "Signing declined" }));
      } else {
        setActionStatus((prev) => ({ ...prev, [order.boxId]: `Error: ${msg.slice(0, 40)}` }));
      }
      console.error("Cancel sell order failed:", err);
      setTimeout(() => {
        setActionStatus((prev) => {
          const next = { ...prev };
          delete next[order.boxId];
          return next;
        });
      }, 8000);
    }
  }, [api, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // TX FLOW: Exercise
  // ═══════════════════════════════════════════════════════════════

  const handleExerciseClick = useCallback(async (box: ContractBox) => {
    if (!api) return;

    try {
      // Get option token ID from reserve box R7
      const nodeBox = await fetchBoxById(box.boxId);
      const r7hex = nodeBox.additionalRegisters?.R7;
      if (!r7hex || !r7hex.startsWith("0e20")) {
        throw new Error("Cannot read option token ID from reserve box R7");
      }
      const optionTokenId = r7hex.slice(4);

      // Count option tokens in wallet
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
        toast("You don't have any option tokens for this contract.");
        return;
      }

      // Fetch spot price for cash-settled options
      let spotPrice: number | undefined;
      if (box.settlement === "cash" && box.oracleIndex !== undefined) {
        try {
          const spotRes = await fetch(`/api/spot?index=${box.oracleIndex}`);
          if (spotRes.ok) {
            const spotData = await spotRes.json();
            if (spotData.price) {
              spotPrice = spotData.price;
            }
          }
        } catch { /* will show as undefined in dialog */ }
      }

      // Read R8 for contractSize and stablecoinDecimal
      let exContractSize: number | undefined;
      let exStablecoin: "USE" | "SigUSD" = "USE";
      const r8hex = nodeBox.additionalRegisters?.R8;
      if (r8hex) {
        const r8bytes = hexToBytesOracle(r8hex);
        const r8vals = parseCollLong(r8bytes);
        if (r8vals && r8vals.length >= 11) {
          exContractSize = Number(r8vals[2]) / 1_000_000;
          exStablecoin = Number(r8vals[10]) === 100 ? "SigUSD" : "USE";
        }
      }

      setExerciseModalBox(box);
      setExerciseModalTokenBalance(walletTokenBalance);
      setExerciseModalSpotPrice(spotPrice);
      setExerciseModalContractSize(exContractSize);
      setExerciseModalOracleIndex(box.oracleIndex);
      setExerciseModalStablecoin(exStablecoin);
      setExerciseModalOpen(true);
    } catch (err: any) {
      toast(`Error: ${err.message}`);
    }
  }, [api]);

  const handleExerciseSubmit = useCallback(async (params: { quantity: number }): Promise<string> => {
    if (!api || !exerciseModalBox) throw new Error("Wallet not connected");

    const box = exerciseModalBox;
    console.log("[Exercise] Starting for box:", box.boxId, "settlement:", box.settlement, "type:", box.optionType);

    // 1. Fetch reserve box from node
    const nodeBox = await fetchBoxById(box.boxId);
    console.log("[Exercise] Reserve box fetched, value:", nodeBox.value, "tokens:", nodeBox.assets?.length);
    const reserveBox = nodeBoxToFleet(nodeBox);
    const regs = nodeBox.additionalRegisters;

    // 2. Parse R8 (OptionParams)
    const r8Params = parseCollLong(hexToBytesOracle(regs.R8));
    if (!r8Params || r8Params.length < 11) throw new Error("Invalid R8 params");

    console.log("[Exercise] R8 params:", r8Params.map(String));

    const optionParams = {
      optionType: Number(r8Params[0]) as 0 | 1,
      style: Number(r8Params[1]) as 0 | 1,
      shareSize: r8Params[2],
      maturityDate: r8Params[3],
      strikePrice: r8Params[4],
      dAppUIMintFee: r8Params[5],
      txFee: r8Params[6],
      oracleIndex: Number(r8Params[7]),
      settlementType: Number(r8Params[8]) as 0 | 1,
      collateralCap: r8Params[9],
      stablecoinDecimal: r8Params[10],
    };

    // 3. Parse R9 for issuer EC point (first 33 bytes of Coll[Coll[Byte]])
    const r9bytes = hexToBytesOracle(regs.R9);
    const issuerECPoint = extractECPointFromR9(r9bytes);
    if (!issuerECPoint) throw new Error("Cannot parse issuer EC point from R9");

    // 4. Preserved registers
    const registers: Record<string, string> = {};
    for (const key of ["R4", "R5", "R6", "R7", "R8", "R9"]) {
      if (regs[key]) registers[key] = regs[key];
    }

    // 5. Get wallet UTXOs, separate option token boxes from payment boxes
    const r7hex = regs.R7;
    const optionTokenId = r7hex.startsWith("0e20") ? r7hex.slice(4) : "";
    const rawUtxos = await getWalletUtxos(api);
    const allBoxes = rawUtxos.map(nautilusBoxToFleet);

    const optionTokenBoxes = allBoxes.filter((b: any) =>
      b.assets.some((a: any) => a.tokenId === optionTokenId)
    );
    const paymentBoxes = allBoxes.filter((b: any) =>
      !b.assets.some((a: any) => a.tokenId === optionTokenId)
    );

    console.log("[Exercise] optionTokenId:", optionTokenId);
    console.log("[Exercise] optionTokenBoxes:", optionTokenBoxes.length, "paymentBoxes:", paymentBoxes.length);

    // Guard: verify buyer actually has option tokens (may be stale wallet cache)
    if (optionTokenBoxes.length === 0) {
      throw new Error("No option tokens found in wallet — you may have already exercised this position. Refresh the page.");
    }

    const walletErgoTree = rawUtxos[0]?.ergoTree;
    if (!walletErgoTree) throw new Error("No wallet UTXOs found");

    let height = await fetchHeight();

    // Ensure height >= max creationHeight of all inputs to avoid
    // "Creation height of any output should be not less than" node error.
    // Fleet SDK uses this height for output creationHeight.
    const allBoxesForHeight = [reserveBox, ...allBoxes];
    for (const b of allBoxesForHeight) {
      const ch = Number(b.creationHeight ?? 0);
      if (ch > height) height = ch;
    }

    console.log("[Exercise] height:", height, "maturityDate:", optionParams.maturityDate.toString(), "settlementType:", optionParams.settlementType);

    let unsignedTx: any;

    if (optionParams.settlementType === 0) {
      // Physical exercise
      // Need Registry box as data input
      const { REGISTRY_NFT_ID } = await import("@ergo-options/core");

      // Fetch registry box by token ID
      const registryBoxRes = await fetch(`/api/box-by-token?tokenId=${REGISTRY_NFT_ID}`);
      if (!registryBoxRes.ok) {
        throw new Error("Cannot find Token Registry box — needed for physical exercise");
      }
      const registryNodeBox = await registryBoxRes.json();
      const regR4 = registryNodeBox.additionalRegisters?.R4;
      const regR5 = registryNodeBox.additionalRegisters?.R5;

      // Parse R4: Coll[Coll[Byte]] — token IDs
      const tokenIds = parseCollCollByteToHexStrings(hexToBytesOracle(regR4));
      // Parse R5: Coll[Long] — rates
      const rates = parseCollLong(hexToBytesOracle(regR5));
      if (!tokenIds || !rates) throw new Error("Cannot parse registry data");

      const registryData = { tokenIds, rates };

      const { buildExercisePhysicalCallTx, buildExercisePhysicalPutTx } = await import("@ergo-options/core");

      const exerciseParams = {
        reserveBox,
        registryBox: nodeBoxToFleet(registryNodeBox),
        params: optionParams,
        registry: registryData,
        optionTokenBoxes,
        paymentBoxes,
        issuerECPoint,
        registers,
        changeErgoTree: walletErgoTree,
      };

      if (optionParams.optionType === 0) {
        unsignedTx = buildExercisePhysicalCallTx(exerciseParams, height);
      } else {
        unsignedTx = buildExercisePhysicalPutTx(exerciseParams, height);
      }
    } else {
      // Cash exercise
      // Need Oracle Companion box as data input
      const { COMPANION_NFT_ID } = await import("@ergo-options/core");

      const companionRes = await fetch(`/api/box-by-token?tokenId=${COMPANION_NFT_ID}`);
      if (!companionRes.ok) throw new Error("Cannot find Oracle Companion box");
      const companionNodeBox = await companionRes.json();
      const companionBox = nodeBoxToFleet(companionNodeBox);

      // Extract spot price from companion R8[oracleIndex]
      const companionR8 = companionNodeBox.additionalRegisters?.R8;
      const spotPrices = parseCollLong(hexToBytesOracle(companionR8));
      if (!spotPrices || spotPrices.length <= optionParams.oracleIndex) {
        throw new Error("Cannot read spot price from oracle companion");
      }
      const spotPrice = spotPrices[optionParams.oracleIndex];

      const { buildExerciseCashTx } = await import("@ergo-options/core");

      unsignedTx = buildExerciseCashTx(
        {
          reserveBox,
          oracleBox: companionBox,
          params: optionParams,
          spotPrice,
          optionTokenBoxes,
          registers,
          changeErgoTree: walletErgoTree,
        },
        height,
      );
    }

    // Sign and submit
    console.log("[Exercise] TX built successfully, converting to EIP-12...");
    const eip12Tx = unsignedTx.toEIP12Object();
    console.log("[Exercise] EIP-12 TX:", JSON.stringify(eip12Tx, (_, v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 500));

    console.log("[Exercise] Requesting Nautilus signature...");
    const signedTx = await signTx(api, eip12Tx);
    console.log("[Exercise] Signed, submitting...");

    const txId = await submitTransaction(signedTx);

    console.log("[Exercise] TX submitted:", txId);
    setTimeout(() => loadTokens(), 5000);
    return txId;
  }, [api, exerciseModalBox, loadTokens]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-2">Portfolio</h1>
        <p className="text-[#8891a5] mb-4">Connect your wallet to view positions</p>
        <p className="text-sm text-[#8891a5]/60">
          Click &quot;Connect Wallet&quot; in the top right to get started
        </p>
      </div>
    );
  }

  const relevantTokens = tokens.filter((t) => t.isRelevant);
  const ergDisplay = ergBalance ? (Number(ergBalance) / 1e9).toFixed(4) : "0";
  const writtenOptions = contractBoxes.filter((b) => b.state === "RESERVE" || b.state === "EXPIRED");
  const pendingBoxes = contractBoxes.filter((b) => b.state === "DEFINITION" || b.state === "MINTED_UNDELIVERED");
  const PAGE_SIZE = 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <button
          onClick={loadTokens}
          disabled={loading}
          className="px-3 py-1.5 bg-[#1e2330] text-[#8891a5] rounded-lg text-sm hover:text-[#e8eaf0] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Success banner for close/cancel actions */}
      {successBanner && (
        <div className="flex items-center justify-between bg-[#0d2818] border border-[#1a4d2e] rounded-lg px-4 py-3">
          <span className="text-sm text-[#4ade80]">{successBanner.message}</span>
          <a
            href={`https://ergexplorer.com/transactions#${successBanner.txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8891a5] hover:text-[#4ade80] transition-colors ml-4 whitespace-nowrap"
          >
            {successBanner.txId.slice(0, 12)}...
          </a>
        </div>
      )}

      {/* Error banner */}
      {loadError && (
        <div className="flex items-center justify-between bg-[#2a1215] border border-[#4d1a1e] rounded-lg px-4 py-3">
          <span className="text-sm text-[#f87171]">{loadError}</span>
          <button
            onClick={loadTokens}
            className="text-xs text-[#8891a5] hover:text-[#f87171] transition-colors ml-4 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Options (Holding) */}
      <PaginatedSection title="Active Options (Holding)" total={holdings.length} pageSize={PAGE_SIZE}>
        {(page) => {
          const pageHoldings = holdings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2330]">
                    <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Type</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Strike</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Expiry</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Qty</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageHoldings.length > 0 ? pageHoldings.map((h) => {
                    const blocksToExpiry = h.maturityHeight - currentHeight;
                    const isExercisable = h.style === "american"
                      ? currentHeight <= h.maturityHeight + exerciseWindow
                      : currentHeight >= h.maturityHeight && currentHeight <= h.maturityHeight + exerciseWindow;
                    const isExpired = currentHeight > h.maturityHeight + exerciseWindow;

                    return (
                      <tr key={h.optionTokenId} className="border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30">
                        <td className="py-2 px-4 text-[#e8eaf0] font-medium">{h.assetName}</td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            h.optionType === "call" ? "bg-[#34d399]/20 text-[#34d399]" : "bg-[#f87171]/20 text-[#f87171]"
                          }`}>
                            {h.optionType === "call" ? "Call" : "Put"}
                          </span>
                          <span className="text-xs ml-1 text-[#8891a5]">{h.settlement}</span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
                          ${h.strikePrice >= 100 ? h.strikePrice.toFixed(0) : h.strikePrice.toFixed(4)}
                        </td>
                        <td className="py-2 px-4 text-right text-xs">
                          {isExpired ? (
                            <span className="text-[#f87171]">Expired</span>
                          ) : blocksToExpiry > 0 ? (
                            <span className="text-[#e8eaf0]">{formatBlocksToTime(blocksToExpiry)}</span>
                          ) : (
                            <span className="text-[#e09a5f]">Exercise window</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#e8eaf0]">
                          {h.quantity.toString()}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {isExercisable && (
                            <span className="text-xs text-[#34d399] font-semibold">Exercisable</span>
                          )}
                          {!isExercisable && !isExpired && (
                            <span className="text-xs text-[#8891a5]">Active</span>
                          )}
                          {isExpired && (
                            <span className="text-xs text-[#f87171]">Expired</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex gap-1 justify-end">
                            {isExercisable && (
                              <button
                                onClick={() => handleExerciseClick({
                                  boxId: h.reserveBoxId,
                                  state: "RESERVE",
                                  name: h.name,
                                  value: 0,
                                  optionType: h.optionType,
                                  style: h.style,
                                  settlement: h.settlement,
                                  strikePrice: h.strikePrice,
                                  maturityDate: h.maturityHeight,
                                  oracleIndex: h.oracleIndex,
                                })}
                                className="text-xs px-2 py-1 bg-[#34d399]/20 text-[#34d399] rounded hover:bg-[#34d399]/30"
                              >
                                Exercise
                              </button>
                            )}
                            <button
                              onClick={() => handleListForSaleClick({
                                boxId: h.reserveBoxId,
                                state: "RESERVE",
                                name: h.name,
                                value: 0,
                                optionType: h.optionType,
                                style: h.style,
                                settlement: h.settlement,
                                strikePrice: h.strikePrice,
                                maturityDate: h.maturityHeight,
                                oracleIndex: h.oracleIndex,
                              })}
                              className="text-xs px-2 py-1 bg-[#c87941]/20 text-[#c87941] rounded hover:bg-[#c87941]/30"
                            >
                              List
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#8891a5]">
                        {loading ? <table className="w-full"><tbody><SkeletonRow cols={7} /><SkeletonRow cols={7} /></tbody></table> : "No active option positions"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        }}
      </PaginatedSection>

      {/* Written Options (Issuer) */}
      <PaginatedSection title="Written Options (Issuer)" total={writtenOptions.length} pageSize={PAGE_SIZE}>
        {(page) => {
          const pageItems = writtenOptions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-x-auto">
              {pageItems.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2330]">
                      <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Type</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Strike</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Expiry</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Qty</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Value Locked</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((box) => {
                      const isExpired = box.state === "EXPIRED";
                      const blocksToExpiry = (box.maturityDate ?? 0) - currentHeight;
                      const blocksToClose = (box.maturityDate ?? 0) + exerciseWindow - currentHeight;
                      const optTokenId = reserveBoxIdToTokenId.get(box.boxId);
                      const walletBal = optTokenId ? (walletTokenMap.get(optTokenId) ?? 0n) : 0n;
                      const isFullyExercised = box.state === "RESERVE" && !box.tokenCount && walletBal === 0n;
                      return (
                        <tr key={box.boxId} className="border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30">
                          <td className="py-2 px-4 text-[#e8eaf0]">{box.name}</td>
                          <td className="py-2 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              box.optionType === "call" ? "bg-[#34d399]/20 text-[#34d399]" : "bg-[#f87171]/20 text-[#f87171]"
                            }`}>
                              {box.optionType === "call" ? "Call" : "Put"}
                            </span>
                            <span className="text-xs ml-1 text-[#8891a5]">{box.settlement}</span>
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
                            {box.strikePrice ? `$${box.strikePrice >= 100 ? box.strikePrice.toFixed(0) : box.strikePrice.toFixed(4)}` : "\u2014"}
                          </td>
                          <td className="py-2 px-4 text-right text-xs">
                            {isExpired ? (
                              <span className="text-[#f87171]">Expired</span>
                            ) : blocksToExpiry <= 0 && blocksToClose > 0 ? (
                              <span className="text-[#e09a5f]">Exercise window</span>
                            ) : blocksToExpiry > 0 ? (
                              <span className="text-[#e8eaf0]">{formatBlocksToTime(blocksToExpiry)}</span>
                            ) : (
                              <span className="text-[#e09a5f]">Exercise window</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[#e8eaf0]">
                            {walletBal > 0n ? walletBal.toString() : box.tokenCount ?? "\u2014"}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[#8891a5]">
                            {formatCollateral(box)}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {isExpired ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#f87171]/20 text-[#f87171]">Expired</span>
                            ) : blocksToExpiry <= 0 && blocksToClose > 0 ? (
                              <span className="text-xs text-[#e09a5f]">
                                Refund in {formatBlocksToTime(blocksToClose)}
                              </span>
                            ) : isFullyExercised ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#e09a5f]/20 text-[#e09a5f]">Exercised</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399]">Active</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {actionStatus[box.boxId] ? (
                              <span className="text-xs text-[#8891a5]">{actionStatus[box.boxId]}</span>
                            ) : (
                              <>
                                {box.state === "RESERVE" && (() => {
                                  if (isFullyExercised) {
                                    return <span className="text-xs text-[#8891a5]">Closeable after expiry</span>;
                                  }
                                  return walletBal > 0n ? (
                                    <button
                                      onClick={() => handleListForSaleClick(box)}
                                      className="text-xs px-2 py-1 bg-[#c87941]/20 text-[#c87941] rounded hover:bg-[#c87941]/30"
                                    >
                                      List for Sale
                                    </button>
                                  ) : (
                                    <span className="text-xs text-[#8891a5]">No tokens</span>
                                  );
                                })()}
                                {box.state === "EXPIRED" && (
                                  <button
                                    onClick={() => handleClose(box)}
                                    className="text-xs px-2 py-1 bg-[#f87171]/20 text-[#f87171] rounded hover:bg-[#f87171]/30"
                                  >
                                    Close
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-[#8891a5]">
                  {loading ? <table className="w-full"><tbody><SkeletonRow cols={8} /><SkeletonRow cols={8} /></tbody></table> : "No written options"}
                </div>
              )}
            </div>
          );
        }}
      </PaginatedSection>

      {/* My Sell Orders */}
      <PaginatedSection title="My Sell Orders" total={openOrders.length} pageSize={PAGE_SIZE}>
        {(page) => {
          const pageItems = openOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-x-auto">
              {pageItems.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2330]">
                      <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Option Token</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Premium</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Qty</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Payment</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((order) => {
                      const isUSE = order.paymentTokenId === USE_TOKEN_ID;
                      const decimals = isUSE ? 3 : 2;
                      const premiumDisplay = (Number(order.premiumPerToken) / Math.pow(10, decimals)).toFixed(decimals);
                      return (
                        <tr key={order.boxId} className="border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30">
                          <td className="py-2 px-4 text-xs text-[#e8eaf0]">
                            {tokenIdToName.get(order.optionTokenId) ?? (
                              <span className="font-mono">{order.optionTokenId.slice(0, 10)}...{order.optionTokenId.slice(-6)}</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
                            {premiumDisplay} {isUSE ? "USE" : "SigUSD"}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[#e8eaf0]">
                            {order.tokenAmount}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isUSE ? "bg-[#34d399]/20 text-[#34d399]" : "bg-[#60a5fa]/20 text-[#60a5fa]"
                            }`}>
                              {isUSE ? "USE" : "SigUSD"}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            {actionStatus[order.boxId] ? (
                              <span className="text-xs text-[#8891a5]">{actionStatus[order.boxId]}</span>
                            ) : (
                              <button
                                onClick={() => handleCancelSellOrder(order)}
                                className="text-xs px-2 py-1 bg-[#f87171]/20 text-[#f87171] rounded hover:bg-[#f87171]/30"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-[#8891a5]">
                  {loading ? <table className="w-full"><tbody><SkeletonRow cols={5} /><SkeletonRow cols={5} /></tbody></table> : "No open sell orders"}
                </div>
              )}
            </div>
          );
        }}
      </PaginatedSection>

      {/* Stuck / Reclaimable + Active Reserves */}
      <PaginatedSection title="Pending Boxes" total={pendingBoxes.length} pageSize={PAGE_SIZE}>
        {(page) => {
          const pageBoxes = pendingBoxes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
          return (
            <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-x-auto">
              {pageBoxes.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2330]">
                      <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-[#8891a5] font-medium">State</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Strike</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Expiry</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Value Locked</th>
                      <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageBoxes.map((box) => (
                      <tr key={box.boxId} className="border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30">
                        <td className="py-2 px-4 text-[#e8eaf0]">{box.name}</td>
                        <td className="py-2 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            box.state === "DEFINITION" ? "bg-[#e09a5f]/20 text-[#e09a5f]" :
                            box.state === "MINTED_UNDELIVERED" ? "bg-[#c87941]/20 text-[#c87941]" :
                            box.state === "RESERVE" ? "bg-[#34d399]/20 text-[#34d399]" :
                            "bg-[#f87171]/20 text-[#f87171]"
                          }`}>
                            {box.state === "DEFINITION" ? "Pending Mint" :
                             box.state === "MINTED_UNDELIVERED" ? "Pending Delivery" :
                             box.state === "RESERVE" ? "Active" :
                             "Expired"}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
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
                                <div className="font-mono text-[#8891a5]">
                                  Block {box.maturityDate.toLocaleString()}
                                </div>
                                {isExpired ? (
                                  <div className="text-[#f87171]">Expired</div>
                                ) : blocksToExpiry > 0 ? (
                                  <div className="text-[#e8eaf0]">
                                    {formatBlocksToTime(blocksToExpiry)} to maturity
                                  </div>
                                ) : (
                                  <div className="text-[#e09a5f]">
                                    Exercise window: {formatBlocksToTime(blocksToClose)}
                                  </div>
                                )}
                                {isExercisable && (
                                  <div className="text-[#34d399] font-semibold">Exercisable</div>
                                )}
                              </div>
                            );
                          })() : "\u2014"}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#8891a5]">
                          {formatCollateral(box)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {actionStatus[box.boxId] ? (
                            <span className="text-xs text-[#8891a5]">{actionStatus[box.boxId]}</span>
                          ) : (
                            <>
                              {box.state === "DEFINITION" && (
                                <button
                                  onClick={() => handleReclaim(box)}
                                  className="text-xs px-2 py-1 bg-[#e09a5f]/20 text-[#e09a5f] rounded hover:bg-[#e09a5f]/30"
                                >
                                  Reclaim
                                </button>
                              )}
                              {box.state === "EXPIRED" && (
                                <button
                                  onClick={() => handleClose(box)}
                                  className="text-xs px-2 py-1 bg-[#f87171]/20 text-[#f87171] rounded hover:bg-[#f87171]/30"
                                >
                                  Close
                                </button>
                              )}
                              {box.state === "RESERVE" && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleExerciseClick(box)}
                                    className="text-xs px-2 py-1 bg-[#34d399]/20 text-[#34d399] rounded hover:bg-[#34d399]/30"
                                  >
                                    Exercise
                                  </button>
                                  <button
                                    onClick={() => handleListForSaleClick(box)}
                                    className="text-xs px-2 py-1 bg-[#c87941]/20 text-[#c87941] rounded hover:bg-[#c87941]/30"
                                  >
                                    List
                                  </button>
                                </div>
                              )}
                              {box.state === "MINTED_UNDELIVERED" && (
                                <span className="text-xs text-[#c87941]">Bot handling...</span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-[#8891a5]">
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
            <div className="bg-[#12151c] border border-[#1e2330] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2330]">
                    <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Asset</th>
                    <th className="text-left py-3 px-4 text-[#8891a5] font-medium">Token ID</th>
                    <th className="text-right py-3 px-4 text-[#8891a5] font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length > 0 ? pageRows.map((t) => (
                    <tr key={t.tokenId} className="border-b border-[#1e2330]/50 hover:bg-[#1e2330]/30">
                      <td className="py-2 px-4 text-[#e8eaf0] font-medium">
                        {t.name}
                      </td>
                      <td className="py-2 px-4 font-mono text-xs text-[#8891a5]">
                        {t.isNative ? "native" : `${t.tokenId.slice(0, 12)}...${t.tokenId.slice(-6)}`}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-[#e09a5f]">
                        {t.displayAmount}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-[#8891a5]">
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
          contractSize={sellModalContractSize}
          onSubmit={handleListForSaleSubmit}
        />
      )}

      {/* Exercise Modal */}
      {exerciseModalBox && (
        <ExerciseDialog
          isOpen={exerciseModalOpen}
          onClose={() => {
            setExerciseModalOpen(false);
            setExerciseModalBox(null);
          }}
          optionTokenId={exerciseModalBox.boxId}
          quantity={exerciseModalTokenBalance}
          optionType={(exerciseModalBox.optionType as "call" | "put") ?? "call"}
          settlementType={(exerciseModalBox.settlement as "physical" | "cash") ?? "cash"}
          strikePrice={exerciseModalBox.strikePrice ?? 0}
          assetName={exerciseModalBox.name?.split(" ")[0] ?? ""}
          assetUnit={exerciseModalOracleIndex !== undefined ? (ROSEN_NAMES[exerciseModalOracleIndex] ?? exerciseModalBox.name?.split(" ")[0] ?? "") : (exerciseModalBox.name?.split(" ")[0] ?? "")}
          expiryBlocks={(exerciseModalBox.maturityDate ?? 0) - currentHeight}
          style={(exerciseModalBox.style as "european" | "american") ?? "european"}
          spotPrice={exerciseModalSpotPrice}
          collateralCap={undefined}
          stablecoin={exerciseModalStablecoin}
          reserveBoxId={exerciseModalBox.boxId}
          contractSize={exerciseModalContractSize}
          oracleIndex={exerciseModalOracleIndex}
          onExercise={handleExerciseSubmit}
        />
      )}
    </div>
  );
}
