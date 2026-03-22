/**
 * Build the "close expired reserve" transaction.
 * Port of OptionLifecycle.closeExpired() from Scala.
 *
 * Anyone can close an expired reserve after HEIGHT > maturityDate + EXERCISE_WINDOW.
 * Collateral returns to the writer (issuer address from R9).
 * Singleton option token is burned.
 *
 * PERMISSIONLESS: no writer key needed, just ERG for miner fee.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
import { MINER_FEE } from '../config.js';
import { ecPointToErgoTreeHex } from '../address.js';

export interface CloseExpiredParams {
  /** The expired reserve box (singleton + remaining collateral) */
  reserveBox: Box<Amount>;
  /** Issuer's 33-byte EC point (from R9[0]) */
  issuerECPoint: Uint8Array;
  /** Change address ErgoTree (hex) — for the submitter (pays miner fee) */
  changeErgoTree: string;
}

/**
 * Build an unsigned "close expired" transaction.
 *
 * OUTPUTS[0]: All value + collateral tokens → issuer address
 * Singleton token is burned via tokensToBurn.
 *
 * @param params Close parameters
 * @param currentHeight Current blockchain height
 * @returns Unsigned transaction
 */
export function buildCloseExpiredTx(
  params: CloseExpiredParams,
  currentHeight: number,
) {
  const { reserveBox, issuerECPoint, changeErgoTree } = params;
  const txFee = MINER_FEE;

  // Issuer address from EC point
  const issuerErgoTree = ecPointToErgoTreeHex(issuerECPoint);

  // Issuer box: receives remaining ERG + collateral tokens
  const issuerBuilder = new OutputBuilder(
    BigInt(reserveBox.value) - txFee,
    issuerErgoTree,
  );

  // Add collateral tokens if present (tokens[1])
  if (reserveBox.assets.length > 1) {
    issuerBuilder.addTokens({
      tokenId: reserveBox.assets[1].tokenId,
      amount: reserveBox.assets[1].amount,
    });
  }

  // Build transaction — burn the singleton option token
  const tx = new TransactionBuilder(currentHeight)
    .from([reserveBox])
    .to([issuerBuilder])
    .burnTokens({
      tokenId: reserveBox.assets[0].tokenId,
      amount: reserveBox.assets[0].amount,
    })
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .build();

  return tx;
}
