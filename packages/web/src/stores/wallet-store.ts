import { create } from 'zustand';
import type { ErgoAPI } from '@/lib/wallet';

interface TokenBalance {
  tokenId: string;
  amount: bigint;
  name?: string;
}

type WalletType = 'nautilus' | 'ergopay' | null;

interface WalletState {
  connected: boolean;
  address: string | null;
  ergBalance: string;
  tokenBalances: TokenBalance[];
  api: ErgoAPI | null;
  walletType: WalletType;

  // Actions
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setErgBalance: (balance: string) => void;
  setTokenBalances: (balances: TokenBalance[]) => void;
  setApi: (api: ErgoAPI | null) => void;
  setWalletType: (type: WalletType) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  connected: false,
  address: null,
  ergBalance: '0',
  tokenBalances: [],
  api: null,
  walletType: null,

  setConnected: (connected) => set({ connected }),
  setAddress: (address) => set({ address }),
  setErgBalance: (balance) => set({ ergBalance: balance }),
  setTokenBalances: (balances) => set({ tokenBalances: balances }),
  setApi: (api) => set({ api }),
  setWalletType: (type) => set({ walletType: type }),
  disconnect: () => set({
    connected: false,
    address: null,
    ergBalance: '0',
    tokenBalances: [],
    api: null,
    walletType: null,
  }),
  refreshBalance: async () => {
    const state = get();
    if (!state.connected || !state.api) return;
    try {
      const balance = await state.api.get_balance();
      set({ ergBalance: typeof balance === "string" ? balance : String(balance) });
    } catch {
      // Silently fail — balance will refresh on next action
    }
  },
}));
