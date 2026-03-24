"use client";

import { useEffect, useState, useCallback } from "react";
import { useWalletStore } from "@/stores/wallet-store";
import {
  USE_TOKEN_ID,
  SIGUSD_TOKEN_ID,
  REGISTRY_TOKEN_IDS,
  REGISTRY_RATES,
} from "@ergo-options/core";

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
  strikePrice?: number;
  maturityDate?: number;
  tokenCount?: number;
}

export default function PortfolioPage() {
  const { connected, address, api, ergBalance } = useWalletStore();
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [contractBoxes, setContractBoxes] = useState<ContractBox[]>([]);
  const [loading, setLoading] = useState(false);

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
        // Get wallet's EC point from the first used address
        // P2PK address ErgoTree = 0008cd + 33-byte EC point
        const addrs = await api.get_used_addresses();
        const firstAddr = addrs?.[0];
        if (firstAddr) {
          // Fetch ErgoTree for this address via node API
          const addrRes = await fetch(`/api/boxes?address=${firstAddr}&raw=true`);
          // Alternative: derive EC point from address directly
          // For now, try getting it from the wallet's UTXOs ergoTree
          const walletUtxo = utxos?.[0];
          if (walletUtxo?.ergoTree && walletUtxo.ergoTree.startsWith("0008cd")) {
            const ecPoint = walletUtxo.ergoTree.slice(6); // 33-byte EC point hex
            const myBoxesRes = await fetch(`/api/my-boxes?ecPoint=${ecPoint}`);
            if (myBoxesRes.ok) {
              const data = await myBoxesRes.json();
              setContractBoxes(data.boxes ?? []);
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
    }
  }, [connected, api, loadTokens]);

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
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">ERG Locked</th>
                      <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Box ID</th>
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
                          {box.strikePrice ? `$${box.strikePrice >= 100 ? box.strikePrice.toFixed(0) : box.strikePrice.toFixed(4)}` : "—"}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-[#94a3b8]">
                          {(box.value / 1e9).toFixed(4)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-xs text-[#94a3b8]">
                          {box.boxId.slice(0, 8)}...{box.boxId.slice(-6)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {box.state === "DEFINITION" && (
                            <button className="text-xs px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded hover:bg-[#f59e0b]/30">
                              Reclaim
                            </button>
                          )}
                          {box.state === "EXPIRED" && (
                            <button className="text-xs px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] rounded hover:bg-[#ef4444]/30">
                              Close
                            </button>
                          )}
                          {box.state === "RESERVE" && (
                            <span className="text-xs text-[#22c55e]">Active</span>
                          )}
                          {box.state === "MINTED_UNDELIVERED" && (
                            <span className="text-xs text-[#3b82f6]">Bot handling...</span>
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
          // ERG is always first, then relevant tokens
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
    </div>
  );
}
