/**
 * Build the "deliver option tokens" transaction.
 * Port of OptionLifecycle.deliverOption() from Scala.
 *
 * V5: Two delivery modes:
 *   Mode A (autoList=0): Deliver to writer's wallet (V4 compatible)
 *   Mode B (autoList=1): Deliver directly to FixedPriceSell contract
 *
 * This is a permissionless operation — anyone can submit it.
 * Tokens always go to the issuer address or a sell order with issuer's SigmaProp.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
import { SLong, SColl, SByte } from '@fleet-sdk/serializer';
import { MINER_FEE, MIN_BOX_VALUE } from '../config.js';
import { ecPointToErgoTreeHex } from '../address.js';

export interface DeliverOptionParams {
  /** The minted reserve box (has N+1 option tokens) */
  reserveBox: Box<Amount>;
  /** Issuer's 33-byte EC point (from R9[0]) */
  issuerECPoint: Uint8Array;
  /** Preserved register values from the reserve box (hex-encoded) */
  registers: Record<string, string>;
  /** Change address ErgoTree (hex) — for the submitter (pays miner fee) */
  changeErgoTree: string;
  /** Auto-list mode: deliver to sell order instead of wallet */
  autoList?: boolean;
  /** Premium per token in raw stablecoin units (required when autoList=true) */
  premiumRaw?: bigint;
  /** FixedPriceSell contract ErgoTree hex (required when autoList=true) */
  sellContractErgoTree?: string;
  /** Seller SigmaProp hex (pre-serialized "08cd" + EC point, for R4) */
  sellerSigmaPropHex?: string;
  /** dApp UI fee per 1000 (e.g. 10n = 1%) */
  dAppUIFeePer1000?: bigint;
  /** dApp UI fee ErgoTree bytes (from R9[1], for R6) */
  dAppUIFeeTree?: Uint8Array;
}

/**
 * Build an unsigned "deliver option" transaction.
 *
 * @param params Delivery parameters
 * @param currentHeight Current blockchain height
 * @returns Unsigned transaction
 */
export function buildDeliverOptionTx(
  params: DeliverOptionParams,
  currentHeight: number,
) {
  const { reserveBox, issuerECPoint, registers, changeErgoTree } = params;
  const txFee = MINER_FEE;

  const optionTokenId = reserveBox.assets[0].tokenId;
  const totalTokens = BigInt(reserveBox.assets[0].amount);

  // Issuer address from EC point → P2PK ErgoTree
  const issuerErgoTree = ecPointToErgoTreeHex(issuerECPoint);

  // Successor: singleton (qty=1) + collateral preserved
  // Mode B needs more ERG for the sell order box (MIN_BOX_VALUE + txFee vs just MIN_BOX_VALUE)
  const deliveryOutputCost = params.autoList ? MIN_BOX_VALUE + txFee : MIN_BOX_VALUE;
  const successorValue = BigInt(reserveBox.value) - txFee - deliveryOutputCost;

  const successorBuilder = new OutputBuilder(
    successorValue,
    reserveBox.ergoTree,
  ).setAdditionalRegisters(registers);

  // Singleton token
  successorBuilder.addTokens({ tokenId: optionTokenId, amount: 1n });

  // Collateral token (if present — tokens[1])
  if (reserveBox.assets.length > 1) {
    successorBuilder.addTokens({
      tokenId: reserveBox.assets[1].tokenId,
      amount: reserveBox.assets[1].amount,
    });
  }

  // Tradeable tokens: N-1
  const tradeableAmount = totalTokens - 1n;

  if (params.autoList && params.sellContractErgoTree && params.premiumRaw && params.sellerSigmaPropHex && params.dAppUIFeeTree) {
    // MODE B: Deliver to sell order (V5 auto-list)
    const sellBoxValue = MIN_BOX_VALUE + txFee;

    const sellBuilder = new OutputBuilder(sellBoxValue, params.sellContractErgoTree)
      .addTokens({ tokenId: optionTokenId, amount: tradeableAmount })
      .setAdditionalRegisters({
        // R4: SigmaProp — seller PK (issuer, so only writer can cancel)
        R4: params.sellerSigmaPropHex,
        // R5: Coll[Long] — [premiumPerToken, dAppUIFeePer1000, txFee]
        R5: SColl(SLong, [params.premiumRaw, params.dAppUIFeePer1000 ?? 10n, txFee]),
        // R6: Coll[Byte] — dApp UI fee ErgoTree
        R6: SColl(SByte, params.dAppUIFeeTree),
      });

    return new TransactionBuilder(currentHeight)
      .from([reserveBox])
      .to([successorBuilder, sellBuilder])
      .sendChangeTo(changeErgoTree)
      .payFee(txFee)
      .build();
  } else {
    // MODE A: Deliver to wallet (V4 compatible)
    const issuerBuilder = new OutputBuilder(MIN_BOX_VALUE, issuerErgoTree)
      .addTokens({ tokenId: optionTokenId, amount: tradeableAmount });

    return new TransactionBuilder(currentHeight)
      .from([reserveBox])
      .to([successorBuilder, issuerBuilder])
      .sendChangeTo(changeErgoTree)
      .payFee(txFee)
      .build();
  }
}
