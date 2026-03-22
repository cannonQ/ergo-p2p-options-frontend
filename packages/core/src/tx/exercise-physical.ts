/**
 * Build physical exercise transactions (call and put).
 * Port of OptionLifecycle.exercisePhysicalCall() and exercisePhysicalPut().
 *
 * Physical Call: Buyer sends stablecoin → writer, receives underlying from reserve.
 * Physical Put:  Buyer sends underlying → writer, receives stablecoin from reserve.
 *
 * CRITICAL: Box selection must exclude option tokens when picking stablecoin/ERG boxes.
 * The contract's nested fold counts ALL option tokens in ALL non-SELF inputs.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
import {
  MINER_FEE,
  MIN_BOX_VALUE,
  ORACLE_DECIMAL,
  ERG_ORACLE_INDEX,
  USE_TOKEN_ID,
  SIGUSD_TOKEN_ID,
} from '../config.js';
import { ecPointToErgoTreeHex } from '../address.js';
import type { OptionParams, RegistryData } from '../types.js';

export interface ExercisePhysicalParams {
  /** The active reserve box (singleton + collateral) */
  reserveBox: Box<Amount>;
  /** Token Registry box (data input) */
  registryBox: Box<Amount>;
  /** Parsed R8 params */
  params: OptionParams;
  /** Parsed registry data */
  registry: RegistryData;
  /** Buyer's wallet boxes containing option tokens */
  optionTokenBoxes: Box<Amount>[];
  /** Buyer's wallet boxes for strike payment (stablecoin for calls, underlying for puts).
   *  MUST NOT contain option tokens — caller is responsible for exclusion. */
  paymentBoxes: Box<Amount>[];
  /** Issuer's 33-byte EC point (from R9[0]) */
  issuerECPoint: Uint8Array;
  /** Preserved register values from the reserve box */
  registers: Record<string, string>;
  /** Buyer's change address ErgoTree (hex) */
  changeErgoTree: string;
}

/**
 * Count option tokens across a set of boxes.
 */
function countOptionTokens(boxes: Box<Amount>[], optionTokenId: string): bigint {
  let total = 0n;
  for (const box of boxes) {
    for (const asset of box.assets) {
      if (asset.tokenId === optionTokenId) {
        total += BigInt(asset.amount);
      }
    }
  }
  return total;
}

/**
 * Build an unsigned physical CALL exercise transaction.
 *
 * INPUTS[0]: Reserve box
 * INPUTS[1+]: Buyer's boxes (option tokens + stablecoin + ERG)
 * DATA INPUTS[0]: Token Registry box
 * OUTPUTS[0]: Reserve successor (reduced collateral, singleton)
 * OUTPUTS[1]: Exerciser receives underlying tokens (or ERG)
 * OUTPUTS[2]: Writer receives stablecoin (at issuer address)
 */
export function buildExercisePhysicalCallTx(
  params: ExercisePhysicalParams,
  currentHeight: number,
) {
  const {
    reserveBox, registryBox, params: optParams, registry,
    optionTokenBoxes, paymentBoxes, issuerECPoint, registers, changeErgoTree,
  } = params;
  const txFee = MINER_FEE;

  const optionTokenId = reserveBox.assets[0].tokenId;
  const oracleIndex = optParams.oracleIndex;
  const isErgCall = oracleIndex === ERG_ORACLE_INDEX;

  // Compute per-contract amounts
  const tokensPerUnit = registry.rates[oracleIndex];
  const tokensPerContract = optParams.shareSize * tokensPerUnit / ORACLE_DECIMAL;
  const strikePerContract = optParams.strikePrice * optParams.stablecoinDecimal / ORACLE_DECIMAL;

  // Count actual option tokens in buyer inputs (contract uses this, not requested amount)
  const effectiveContracts = countOptionTokens(optionTokenBoxes, optionTokenId);
  if (effectiveContracts === 0n) {
    throw new Error('No option tokens found in input boxes');
  }

  const totalDelivery = tokensPerContract * effectiveContracts;
  const totalStrikePayment = strikePerContract * effectiveContracts;

  // Defense in depth: verify payment boxes don't contain option tokens
  const contaminatedTokens = countOptionTokens(paymentBoxes, optionTokenId);
  if (contaminatedTokens > 0n) {
    throw new Error(
      `Payment boxes contain ${contaminatedTokens} option tokens — ` +
      `this would inflate the exercise count. Exclude these boxes.`
    );
  }

  const paymentTokenId = optParams.stablecoinDecimal === 1000n ? USE_TOKEN_ID : SIGUSD_TOKEN_ID;
  const issuerErgoTree = ecPointToErgoTreeHex(issuerECPoint);

  // MinReserveValue for successor
  const minReserve = MINER_FEE + MIN_BOX_VALUE;

  // All inputs: reserve first, then buyer boxes
  const allInputs = [reserveBox, ...optionTokenBoxes, ...paymentBoxes];

  // Build outputs
  if (isErgCall) {
    // ERG call: underlying is in box Value
    const successorValue = BigInt(reserveBox.value) - totalDelivery - txFee;
    const successor = new OutputBuilder(successorValue, reserveBox.ergoTree)
      .setAdditionalRegisters(registers)
      .addTokens({ tokenId: optionTokenId, amount: 1n });

    const exerciser = new OutputBuilder(totalDelivery, changeErgoTree);

    const writer = new OutputBuilder(MIN_BOX_VALUE, issuerErgoTree)
      .addTokens({ tokenId: paymentTokenId, amount: totalStrikePayment });

    return new TransactionBuilder(currentHeight)
      .from(allInputs)
      .to([successor, exerciser, writer])
      .withDataFrom([registryBox])
      .sendChangeTo(changeErgoTree)
      .payFee(txFee)
      .build();
  } else {
    // Token call: underlying in tokens[1]
    const selfCollateral = reserveBox.assets[1];
    const successorValue = (() => {
      const v = BigInt(reserveBox.value) - txFee;
      return v < minReserve ? minReserve : v;
    })();

    const remainingCollateral = BigInt(selfCollateral.amount) - totalDelivery;
    const underlyingTokenId = registry.tokenIds[oracleIndex];

    const successor = new OutputBuilder(successorValue, reserveBox.ergoTree)
      .setAdditionalRegisters(registers)
      .addTokens({ tokenId: optionTokenId, amount: 1n })
      .addTokens({ tokenId: selfCollateral.tokenId, amount: remainingCollateral });

    const exerciser = new OutputBuilder(MIN_BOX_VALUE, changeErgoTree)
      .addTokens({ tokenId: underlyingTokenId, amount: totalDelivery });

    const writer = new OutputBuilder(MIN_BOX_VALUE, issuerErgoTree)
      .addTokens({ tokenId: paymentTokenId, amount: totalStrikePayment });

    return new TransactionBuilder(currentHeight)
      .from(allInputs)
      .to([successor, exerciser, writer])
      .withDataFrom([registryBox])
      .sendChangeTo(changeErgoTree)
      .payFee(txFee)
      .build();
  }
}

/**
 * Build an unsigned physical PUT exercise transaction.
 *
 * INPUTS[0]: Reserve box (stablecoin collateral)
 * INPUTS[1+]: Buyer's boxes (option tokens + underlying tokens + ERG)
 * DATA INPUTS[0]: Token Registry box
 * OUTPUTS[0]: Reserve successor (reduced stablecoin, singleton)
 * OUTPUTS[1]: Exerciser receives stablecoin from reserve
 * OUTPUTS[2]: Writer receives underlying tokens from buyer
 */
export function buildExercisePhysicalPutTx(
  params: ExercisePhysicalParams,
  currentHeight: number,
) {
  const {
    reserveBox, registryBox, params: optParams, registry,
    optionTokenBoxes, paymentBoxes, issuerECPoint, registers, changeErgoTree,
  } = params;
  const txFee = MINER_FEE;

  const optionTokenId = reserveBox.assets[0].tokenId;
  const collateralTokenId = reserveBox.assets[1].tokenId;
  const selfBalance = BigInt(reserveBox.assets[1].amount);
  const oracleIndex = optParams.oracleIndex;

  // Compute per-contract amounts
  const tokensPerUnit = registry.rates[oracleIndex];
  const tokensPerContract = optParams.shareSize * tokensPerUnit / ORACLE_DECIMAL;
  const strikePerContract = optParams.strikePrice * optParams.stablecoinDecimal / ORACLE_DECIMAL;

  // Count actual option tokens
  const effectiveContracts = countOptionTokens(optionTokenBoxes, optionTokenId);
  if (effectiveContracts === 0n) {
    throw new Error('No option tokens found in input boxes');
  }

  // Defense in depth
  const contaminatedTokens = countOptionTokens(paymentBoxes, optionTokenId);
  if (contaminatedTokens > 0n) {
    throw new Error(`Payment boxes contain option tokens — exclude them`);
  }

  const totalStrikePayment = strikePerContract * effectiveContracts;
  const totalTokensToDeliver = tokensPerContract * effectiveContracts;
  const underlyingTokenId = registry.tokenIds[oracleIndex];

  // Cap payout to available collateral
  const cappedPayment = totalStrikePayment > selfBalance ? selfBalance : totalStrikePayment;
  const remainingCollateral = selfBalance - cappedPayment;

  const issuerErgoTree = ecPointToErgoTreeHex(issuerECPoint);
  const minReserve = MINER_FEE + MIN_BOX_VALUE;

  const successorValue = (() => {
    const v = BigInt(reserveBox.value) - txFee;
    return v < minReserve ? minReserve : v;
  })();

  // All inputs
  const allInputs = [reserveBox, ...optionTokenBoxes, ...paymentBoxes];

  // OUTPUTS[0]: Reserve successor
  const successor = new OutputBuilder(successorValue, reserveBox.ergoTree)
    .setAdditionalRegisters(registers);
  successor.addTokens({ tokenId: optionTokenId, amount: 1n });
  if (remainingCollateral > 0n) {
    successor.addTokens({ tokenId: collateralTokenId, amount: remainingCollateral });
  }

  // OUTPUTS[1]: Exerciser receives stablecoin from reserve
  const exerciser = new OutputBuilder(MIN_BOX_VALUE, changeErgoTree)
    .addTokens({ tokenId: collateralTokenId, amount: cappedPayment });

  // OUTPUTS[2]: Writer receives underlying from buyer
  const writer = new OutputBuilder(MIN_BOX_VALUE, issuerErgoTree)
    .addTokens({ tokenId: underlyingTokenId, amount: totalTokensToDeliver });

  return new TransactionBuilder(currentHeight)
    .from(allInputs)
    .to([successor, exerciser, writer])
    .withDataFrom([registryBox])
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .build();
}
