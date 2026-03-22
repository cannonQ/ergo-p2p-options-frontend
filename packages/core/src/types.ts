// Core types for the P2P options platform

/** Option type: 0=Call, 1=Put */
export type OptionType = 0 | 1;

/** Option style: 0=European, 1=American */
export type OptionStyle = 0 | 1;

/** Settlement type: 0=Physical, 1=Cash */
export type SettlementType = 0 | 1;

/** The 11 parameters stored in R8 as Coll[Long] */
export interface OptionParams {
  optionType: OptionType;       // R8[0]
  style: OptionStyle;           // R8[1]
  shareSize: bigint;            // R8[2]
  maturityDate: bigint;         // R8[3] — block height
  strikePrice: bigint;          // R8[4] — oracle units (×10^6)
  dAppUIMintFee: bigint;        // R8[5] — nanoERG
  txFee: bigint;                // R8[6] — nanoERG
  oracleIndex: number;          // R8[7]
  settlementType: SettlementType; // R8[8]
  collateralCap: bigint;        // R8[9] — oracle units (cash only)
  stablecoinDecimal: bigint;    // R8[10] — 1000 (USE) or 100 (SigUSD)
}

/** Parsed reserve box from on-chain UTXO */
export interface ReserveBox {
  boxId: string;
  value: bigint;                // nanoERG
  ergoTree: string;             // hex-encoded ErgoTree
  optionTokenId: string;        // tokens[0] ID
  optionTokenQty: bigint;       // tokens[0] qty (1 = singleton after delivery)
  collateralTokenId?: string;   // tokens[1] ID (if non-ERG collateral)
  collateralAmount?: bigint;    // tokens[1] qty
  name: string;                 // R4 — UTF-8 display name
  underlyingId: string;         // R5 — hex token ID (empty for ERG)
  decimals: string;             // R6 — decimal encoding
  creationBoxId: string;        // R7 — 32-byte box ID (hex)
  params: OptionParams;         // R8 — parsed params
  issuerECPoint: Uint8Array;    // R9[0] — 33-byte compressed EC point
  dAppUIFeeTree: Uint8Array;    // R9[1] — ErgoTree bytes
}

/** Box state classification */
export enum BoxState {
  DEFINITION = 'DEFINITION',
  MINTED_UNDELIVERED = 'MINTED_UNDELIVERED',
  RESERVE = 'RESERVE',
  EXPIRED = 'EXPIRED',
  UNKNOWN = 'UNKNOWN',
}

/** Parsed sell order box (FixedPriceSell contract) */
export interface SellOrderBox {
  boxId: string;
  value: bigint;
  ergoTree: string;
  optionTokenId: string;
  tokenAmount: bigint;
  sellerPropBytes: Uint8Array;  // R4 — SigmaProp
  premiumPerToken: bigint;      // R5[0] — nanoERG per token
  dAppUIFeePer1000: bigint;     // R5[1]
  txFee: bigint;                // R5[2]
  dAppUIFeeTree: Uint8Array;    // R6
}

/** Oracle data from companion box */
export interface OracleData {
  spotPrices: bigint[];         // R8 — 21 feeds, micro-dollars
  twapPrices: bigint[];         // R4 — 21 feeds, micro-dollars
  volatility: bigint[];         // R5 — 21 feeds, annualized bps
  epoch: number;                // R6
}

/** Registry data from token registry box */
export interface RegistryData {
  tokenIds: string[];           // R4 — 21 token IDs (hex)
  rates: bigint[];              // R5 — tokensPerUnit per feed
}

/** Aggregated option chain entry (for UI display) */
export interface OptionChainEntry {
  asset: string;
  oracleIndex: number;
  optionType: OptionType;
  strikePrice: bigint;
  maturityDate: bigint;
  style: OptionStyle;
  settlementType: SettlementType;
  // Aggregated from sell orders
  bestPremium?: bigint;
  availableQty: bigint;
  // Aggregated from reserves
  openInterest: bigint;
  reserves: ReserveBox[];
  sellOrders: SellOrderBox[];
}

/** Portfolio position */
export interface Position {
  optionTokenId: string;
  reserve: ReserveBox | null;   // null if orphaned
  quantity: bigint;
  state: 'active' | 'exercisable' | 'expired' | 'orphaned';
}
