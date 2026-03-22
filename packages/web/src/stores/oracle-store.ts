import { create } from 'zustand';

interface OracleState {
  spotPrices: bigint[];    // 21 feeds, micro-dollars (from companion R8)
  volatility: bigint[];    // 21 feeds, annualized bps (from companion R5)
  lastUpdate: number;      // timestamp
  loading: boolean;
  error: string | null;

  setSpotPrices: (prices: bigint[]) => void;
  setVolatility: (vol: bigint[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdate: (ts: number) => void;
}

export const useOracleStore = create<OracleState>((set) => ({
  spotPrices: [],
  volatility: [],
  lastUpdate: 0,
  loading: false,
  error: null,

  setSpotPrices: (prices) => set({ spotPrices: prices, lastUpdate: Date.now() }),
  setVolatility: (vol) => set({ volatility: vol }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastUpdate: (ts) => set({ lastUpdate: ts }),
}));
