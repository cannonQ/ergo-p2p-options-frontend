import { create } from 'zustand';

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
  api: any | null;  // ErgoAPI from EIP-12
  walletType: WalletType;

  // Actions
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setErgBalance: (balance: string) => void;
  setTokenBalances: (balances: TokenBalance[]) => void;
  setApi: (api: any) => void;
  setWalletType: (type: WalletType) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
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
}));
