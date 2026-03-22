import { create } from 'zustand';

interface TokenBalance {
  tokenId: string;
  amount: bigint;
  name?: string;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  ergBalance: string;
  tokenBalances: TokenBalance[];
  api: any | null;  // ErgoAPI from EIP-12

  // Actions
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setErgBalance: (balance: string) => void;
  setTokenBalances: (balances: TokenBalance[]) => void;
  setApi: (api: any) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  address: null,
  ergBalance: '0',
  tokenBalances: [],
  api: null,

  setConnected: (connected) => set({ connected }),
  setAddress: (address) => set({ address }),
  setErgBalance: (balance) => set({ ergBalance: balance }),
  setTokenBalances: (balances) => set({ tokenBalances: balances }),
  setApi: (api) => set({ api }),
  disconnect: () => set({
    connected: false,
    address: null,
    ergBalance: '0',
    tokenBalances: [],
    api: null,
  }),
}));
