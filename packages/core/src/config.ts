// Port of Config.scala — all constants for the P2P options platform

export const NODE_URLS = {
  primary: 'http://96.255.150.220:9053',   // Jumei
  fallback: 'http://76.119.196.68:9053',   // TheStophe
  local: 'http://localhost:9053',
} as const;

export const MINER_FEE = 2_200_000n;        // 0.0022 ERG
export const MIN_BOX_VALUE = 1_000_000n;     // 0.001 ERG
export const ORACLE_DECIMAL = 1_000_000n;
export const EXERCISE_WINDOW = 720;          // blocks (~24h)
export const ERG_ORACLE_INDEX = 17;

// Token IDs
export const COMPANION_NFT_ID = '3182674f07dbb98d696d38eda53e63eb3bf5fe570f71dee85eb954d6cf903bba';
export const REGISTRY_NFT_ID = 'ea7b36e294b1a954a80752eac288711728e5b91b0b3c0596548c755665050b88';
export const USE_TOKEN_ID = 'a55b8735ed1a99e46c2c89f8994aacdf4b1109bdcf682f1e5b34479c6e392669';
export const SIGUSD_TOKEN_ID = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';

// Oracle feed index → token ID mapping (goes into R4 of Token Registry)
export const REGISTRY_TOKEN_IDS: string[] = [
  '203ef3066a912f35c488487cc2cb94bdb0d30680dab22551c7e6fdbc70dfcc8e',  //  0: ETH
  '7a51950e5f548549ec1aa63ffdc38279505b11e7e803d01bcf8347e0123c88b0',  //  1: BTC
  '050322548722d36f094e341f59ed93eb22118b363eb4efe8c461a52c4d93e2c3',  //  2: BNB
  '48132396ebd00831e603c73cf01e01f248dd1966d2cc976caf52ef76f7ac6e36',  //  3: DOGE
  'e023c5f382b6e96fbd878f6811aac73345489032157ad5affb84aefd4956c297',  //  4: ADA
  '', '', '', '', '',  // 5-9: pending/none
  '', '', '', '', '', '', '',  // 10-16: cash only
  '',  // 17: ERG (native, empty)
  '6122f7289e7bb2df2de273e09d4b2756cda6aeb0f40438dc9d257688f45183ad',  // 18: XAU (DexyGold)
  '', '',  // 19-20: pending/reserved
];

// tokensPerOracleUnit per feed index (goes into R5 of Token Registry)
export const REGISTRY_RATES: bigint[] = [
  1_000_000_000n,  //  0: ETH  (10^9)
  100_000_000n,    //  1: BTC  (10^8)
  1_000_000_000n,  //  2: BNB  (10^9)
  1_000_000n,      //  3: DOGE (10^6)
  1_000_000n,      //  4: ADA  (10^6)
  0n, 0n, 0n, 0n, 0n,  // 5-9
  0n, 0n, 0n, 0n, 0n, 0n, 0n,  // 10-16
  1_000_000_000n,  // 17: ERG  (10^9, nanoERG per ERG)
  31_103n,         // 18: XAU  (31,103 mg per troy oz, DexyGold = 1mg)
  0n, 0n,          // 19-20
];

// Human-readable asset names by oracle feed index
export const ASSET_NAMES: Record<number, string> = {
  0: 'ETH', 1: 'BTC', 2: 'BNB', 3: 'DOGE', 4: 'ADA',
  5: 'HNS', 6: 'CKB', 7: 'ATOM', 8: 'RON',
  9: 'SPX', 10: 'DJI', 11: 'XAG', 12: 'XCU',
  13: 'BRENT', 14: 'WTI', 15: 'NGAS', 16: 'LITHIUM',
  17: 'ERG', 18: 'XAU', 19: 'FIRO',
};

// Asset categories for frontend grouping
export const ASSET_CATEGORIES: Record<string, number[]> = {
  'Crypto': [0, 1, 2, 3, 4, 17],
  'Commodities & Metals': [11, 12, 13, 14, 15, 16, 18],
  'Indices': [9, 10],
};

// Whether physical delivery is available (has a registry token)
export function hasPhysicalDelivery(oracleIndex: number): boolean {
  return REGISTRY_TOKEN_IDS[oracleIndex] !== '' || oracleIndex === ERG_ORACLE_INDEX;
}

// Protected tokens — NEVER spend boxes containing these
export const PROTECTED_TOKENS = new Set([
  'e6d4ce279d87110f553e135fabaa3b5ce2d86e625beff0f3e47c8eca99a5c60a',  // MUPDATE
  'e5abaf1f0a9442123104cdf4d2d56ddd8065803e842bc6d433e712601133a9bc',  // MORACLE
  'e7dd9e6ff757d397ca69abe5d94c2255a2b738f8d9c5c2ad6132faa87b79276b',  // MBALLOT
]);

// Known contract addresses (ErgoTree changes with compile-time constants)
export const CONTRACT_ADDRESSES: { address: string; exerciseWindow: number; label: string }[] = [
  // Add production address after deployment
  // { address: 'VY45Pcp...', exerciseWindow: 720, label: 'prod' },
];

// Hex conversion helpers
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
