/**
 * Build sell order transactions (create, buy, cancel).
 * Port of SellOrder.scala — FixedPriceSell contract.
 *
 * Create: Writer lists option tokens at a fixed stablecoin price.
 * Buy: Buyer purchases option tokens with stablecoin (partial or full fill).
 * Cancel: Writer reclaims unsold tokens.
 *
 * Payment is in stablecoin (USE or SigUSD), NOT ERG.
 * The contract uses PAYMENT_TOKEN_ID compile-time constant.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
import { SLong, SColl, SByte } from '@fleet-sdk/serializer';
import { MINER_FEE, MIN_BOX_VALUE } from '../config.js';

// ═══════════════════════════════════════════════════════════════
// CREATE SELL ORDER
// ═══════════════════════════════════════════════════════════════

export interface CreateSellOrderParams {
  /** Compiled FixedPriceSell contract ErgoTree (hex) */
  sellContractErgoTree: string;
  /** Option token ID */
  optionTokenId: string;
  /** Number of tokens to list */
  tokenAmount: bigint;
  /** Price per token in stablecoin raw units (USE: 1000/dollar, SigUSD: 100/dollar) */
  premiumPerToken: bigint;
  /** Stablecoin token ID used for payment */
  paymentTokenId: string;
  /** dApp UI fee per 1000 (e.g., 10 = 1%) */
  dAppUIFeePer1000: bigint;
  /** Seller's SigmaProp (pre-serialized hex string for R4) */
  sellerSigmaPropHex: string;
  /** dApp UI fee ErgoTree bytes (for R6) */
  dAppUIFeeTree: Uint8Array;
  /** Change address ErgoTree (hex) */
  changeErgoTree: string;
}

export function buildCreateSellOrderTx(
  inputBoxes: Box<Amount>[],
  params: CreateSellOrderParams,
  currentHeight: number,
) {
  const txFee = MINER_FEE;
  const boxValue = MIN_BOX_VALUE + txFee;

  const sellBox = new OutputBuilder(boxValue, params.sellContractErgoTree)
    .addTokens({ tokenId: params.optionTokenId, amount: params.tokenAmount })
    .setAdditionalRegisters({
      // R4: SigmaProp — seller PK (pre-serialized hex)
      R4: params.sellerSigmaPropHex,
      // R5: Coll[Long] — [premiumPerToken, dAppUIFeePer1000, txFee]
      R5: SColl(SLong, [params.premiumPerToken, params.dAppUIFeePer1000, txFee]),
      // R6: Coll[Byte] — dApp UI ErgoTree
      R6: SColl(SByte, params.dAppUIFeeTree),
    });

  return new TransactionBuilder(currentHeight)
    .from(inputBoxes)
    .to([sellBox])
    .sendChangeTo(params.changeErgoTree)
    .payFee(txFee)
    .build();
}

// ═══════════════════════════════════════════════════════════════
// BUY FROM SELL ORDER
// ═══════════════════════════════════════════════════════════════

export interface BuyFromSellOrderParams {
  /** The sell order box */
  sellBox: Box<Amount>;
  /** Number of tokens to buy */
  amount: bigint;
  /** Parsed sell params from R5 */
  premiumPerToken: bigint;
  dAppUIFeePer1000: bigint;
  contractTxFee: bigint;
  /** Stablecoin token ID for payment */
  paymentTokenId: string;
  /** Seller's address ErgoTree (hex) — from R4 */
  sellerErgoTree: string;
  /** dApp UI fee address ErgoTree (hex) — from R6 */
  dAppUIFeeErgoTree: string;
  /** Preserved registers from sell box */
  registers: Record<string, string>;
  /** Buyer's wallet boxes (for payment — must contain stablecoin) */
  buyerBoxes: Box<Amount>[];
  /** Buyer's change address ErgoTree (hex) */
  changeErgoTree: string;
}

export function buildBuyFromSellOrderTx(
  params: BuyFromSellOrderParams,
  currentHeight: number,
) {
  const { sellBox, amount, premiumPerToken, dAppUIFeePer1000, contractTxFee,
          sellerErgoTree, dAppUIFeeErgoTree, registers, buyerBoxes, changeErgoTree } = params;
  const txFee = MINER_FEE;

  const optionTokenId = sellBox.assets[0].tokenId;
  const inputTokens = BigInt(sellBox.assets[0].amount);
  const remaining = inputTokens - amount;
  const isPartialFill = remaining > 0n;

  // Payment math (must match contract exactly)
  const totalPrice = amount * premiumPerToken;
  const uiFee = dAppUIFeePer1000 * totalPrice / 1000n;
  const sellerPaid = totalPrice - uiFee;

  // All inputs: sell box first, then buyer's boxes
  const allInputs = [sellBox, ...buyerBoxes];

  const outputs: OutputBuilder[] = [];

  // OUTPUTS[0]: successor sell box
  if (isPartialFill) {
    outputs.push(
      new OutputBuilder(BigInt(sellBox.value), sellBox.ergoTree)
        .addTokens({ tokenId: optionTokenId, amount: remaining })
        .setAdditionalRegisters(registers)
    );
  } else {
    // Full fill — successor must exist for contract's outputTokens computation
    outputs.push(
      new OutputBuilder(MIN_BOX_VALUE, sellBox.ergoTree)
        .setAdditionalRegisters(registers)
    );
  }

  // OUTPUTS[1]: seller receives stablecoin payment (not ERG)
  const sellerOutput = new OutputBuilder(MIN_BOX_VALUE, sellerErgoTree);
  if (sellerPaid > 0n) {
    sellerOutput.addTokens({ tokenId: params.paymentTokenId, amount: sellerPaid });
  }
  outputs.push(sellerOutput);

  // OUTPUTS[2]: dApp UI fee in stablecoin (if > 0)
  if (uiFee > 0n) {
    outputs.push(
      new OutputBuilder(MIN_BOX_VALUE, dAppUIFeeErgoTree)
        .addTokens({ tokenId: params.paymentTokenId, amount: uiFee })
    );
  }

  // Buyer receives option tokens via sendChangeTo.
  // The sell box MUST be included as an input (it holds the option tokens).
  // Use configureSelector to ensure Fleet SDK doesn't skip it during box selection.
  return new TransactionBuilder(currentHeight)
    .from(allInputs)
    .to(outputs)
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .configureSelector((selector) => selector.ensureInclusion(sellBox.boxId))
    .build();
}

// ═══════════════════════════════════════════════════════════════
// CANCEL SELL ORDER
// ═══════════════════════════════════════════════════════════════

export interface CancelSellOrderParams {
  /** The sell order box to cancel */
  sellBox: Box<Amount>;
  /** Seller's change address ErgoTree (hex) */
  changeErgoTree: string;
}

export function buildCancelSellOrderTx(
  params: CancelSellOrderParams,
  currentHeight: number,
) {
  const { sellBox, changeErgoTree } = params;
  const txFee = MINER_FEE;

  const refundBuilder = new OutputBuilder(
    BigInt(sellBox.value) - txFee,
    changeErgoTree,
  );

  // Return tokens if present
  if (sellBox.assets.length > 0 && BigInt(sellBox.assets[0].amount) > 0n) {
    refundBuilder.addTokens({
      tokenId: sellBox.assets[0].tokenId,
      amount: sellBox.assets[0].amount,
    });
  }

  return new TransactionBuilder(currentHeight)
    .from([sellBox])
    .to([refundBuilder])
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .build();
}
