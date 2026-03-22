/**
 * Build the "deliver option tokens" transaction.
 * Port of OptionLifecycle.deliverOption() from Scala.
 *
 * Separates singleton (qty=1) from tradeable tokens (qty=N-1).
 * Singleton stays in the reserve box; tradeable tokens go to the issuer.
 *
 * This is a permissionless operation — anyone can submit it.
 * Tokens always go to the issuer address (from R9), not the submitter.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
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
  const successorValue = BigInt(reserveBox.value) - txFee - MIN_BOX_VALUE;

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

  // Issuer box: receives N-1 tradeable option tokens
  const issuerBuilder = new OutputBuilder(MIN_BOX_VALUE, issuerErgoTree)
    .addTokens({
      tokenId: optionTokenId,
      amount: totalTokens - 1n,
    });

  // Build transaction — single input (reserve box)
  const tx = new TransactionBuilder(currentHeight)
    .from([reserveBox])
    .to([successorBuilder, issuerBuilder])
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .build();

  return tx;
}
