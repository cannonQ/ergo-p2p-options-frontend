import { create } from 'zustand';
import type { ReserveBox, SellOrderBox, BoxState } from '@ergo-options/core';

interface ClassifiedReserve extends ReserveBox {
  state: BoxState;
}

interface OptionsState {
  reserves: ClassifiedReserve[];
  sellOrders: SellOrderBox[];
  currentHeight: number;
  loading: boolean;
  error: string | null;

  setReserves: (reserves: ClassifiedReserve[]) => void;
  setSellOrders: (orders: SellOrderBox[]) => void;
  setCurrentHeight: (height: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOptionsStore = create<OptionsState>((set) => ({
  reserves: [],
  sellOrders: [],
  currentHeight: 0,
  loading: false,
  error: null,

  setReserves: (reserves) => set({ reserves }),
  setSellOrders: (orders) => set({ sellOrders: orders }),
  setCurrentHeight: (height) => set({ currentHeight: height }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
