/**
 * Build cash-settled exercise transaction.
 * Port of OptionLifecycle.exerciseCashSettled() from Scala.
 *
 * Buyer provides option tokens. Oracle determines profit.
 * Buyer receives stablecoin payout from reserve. No underlying changes hands.
 *
 * DATA INPUT: Oracle Companion box (spot prices in R8)
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
} from '../config.js';
import type { OptionParams } from '../types.js';

export interface ExerciseCashParams {
  /** The active reserve box (singleton + stablecoin collateral) */
  reserveBox: Box<Amount>;
  /** Oracle Companion box (DATA INPUT — R8 has spot prices) */
  oracleBox: Box<Amount>;
  /** Parsed R8 params */
  params: OptionParams;
  /** Spot price from oracle R8 at the correct oracle index */
  spotPrice: bigint;
  /** Buyer's wallet boxes containing option tokens */
  optionTokenBoxes: Box<Amount>[];
  /** Additional wallet boxes for ERG fees (may overlap with optionTokenBoxes) */
  paymentBoxes?: Box<Amount>[];
  /** Preserved register values from the reserve box */
  registers: Record<string, string>;
  /** Buyer's change address ErgoTree (hex) */
  changeErgoTree: string;
}

/**
 * Compute profit per contract for a cash-settled option.
 * Returns 0n if OTM (out of the money).
 */
export function computeCashProfit(
  optionType: number,
  spotPrice: bigint,
  strikePrice: bigint,
  collateralCap: bigint,
): bigint {
  if (optionType === 0) {
    // Call: profit = min(spot - strike, cap)
    if (spotPrice <= strikePrice) return 0n;
    const raw = spotPrice - strikePrice;
    return raw > collateralCap ? collateralCap : raw;
  } else {
    // Put: profit = min(strike - spot, cap)
    if (spotPrice >= strikePrice) return 0n;
    const raw = strikePrice - spotPrice;
    return raw > collateralCap ? collateralCap : raw;
  }
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
 * Build an unsigned cash-settled exercise transaction.
 *
 * INPUTS[0]: Reserve box (stablecoin collateral)
 * INPUTS[1+]: Buyer's boxes (option tokens + ERG)
 * DATA INPUTS[0]: Oracle Companion box
 * OUTPUTS[0]: Reserve successor (reduced stablecoin, singleton)
 * OUTPUTS[1]: Exerciser receives stablecoin payout
 */
export function buildExerciseCashTx(
  params: ExerciseCashParams,
  currentHeight: number,
) {
  const {
    reserveBox, oracleBox, params: optParams, spotPrice,
    optionTokenBoxes, registers, changeErgoTree,
  } = params;
  const txFee = MINER_FEE;

  const optionTokenId = reserveBox.assets[0].tokenId;
  const collateralTokenId = reserveBox.assets[1].tokenId;
  const selfBalance = BigInt(reserveBox.assets[1].amount);

  // Compute profit
  const profitPerContract = computeCashProfit(
    optParams.optionType,
    spotPrice,
    optParams.strikePrice,
    optParams.collateralCap,
  );

  if (profitPerContract <= 0n) {
    throw new Error('Option is out of the money — nothing to exercise');
  }

  // Count actual option tokens in buyer inputs
  const effectiveContracts = countOptionTokens(optionTokenBoxes, optionTokenId);
  if (effectiveContracts === 0n) {
    throw new Error('No option tokens found in input boxes');
  }

  // V6: scale by shareSize before dividing to avoid truncation for micro-priced assets
  const payoutPerContract = profitPerContract * optParams.shareSize / ORACLE_DECIMAL * optParams.stablecoinDecimal / ORACLE_DECIMAL;
  const totalPayout = payoutPerContract * effectiveContracts;

  // Cap payout to available collateral
  const cappedPayout = totalPayout > selfBalance ? selfBalance : totalPayout;
  const remainingCollateral = selfBalance - cappedPayout;

  // Successor must have >= MinReserveValue
  const minReserve = MINER_FEE + MIN_BOX_VALUE;
  const successorValue = (() => {
    const v = BigInt(reserveBox.value) - txFee;
    return v < minReserve ? minReserve : v;
  })();

  // All inputs — include payment boxes for ERG fees
  const paymentInputs = (params.paymentBoxes ?? []).filter(
    (pb: Box<Amount>) => !optionTokenBoxes.some((ob: Box<Amount>) => ob.boxId === pb.boxId)
  );
  const allInputs = [reserveBox, ...optionTokenBoxes, ...paymentInputs];

  // OUTPUTS[0]: Reserve successor
  const successor = new OutputBuilder(successorValue, reserveBox.ergoTree)
    .setAdditionalRegisters(registers);
  successor.addTokens({ tokenId: optionTokenId, amount: 1n });
  if (remainingCollateral > 0n) {
    successor.addTokens({ tokenId: collateralTokenId, amount: remainingCollateral });
  }

  // OUTPUTS[1]: Exerciser receives stablecoin payout
  const exerciser = new OutputBuilder(MIN_BOX_VALUE, changeErgoTree)
    .addTokens({ tokenId: collateralTokenId, amount: cappedPayout });

  return new TransactionBuilder(currentHeight)
    .from(allInputs)
    .to([successor, exerciser])
    .withDataFrom([oracleBox])
    .burnTokens({ tokenId: optionTokenId, amount: effectiveContracts })
    .sendChangeTo(changeErgoTree)
    .payFee(txFee)
    .build();
}
