/**
 * Build the "create option definition" transaction.
 * Port of OptionLifecycle.createOptionDefinition() from Scala.
 *
 * Writer deposits collateral and sets all parameters in registers.
 * The output box is at the OptionReserve contract address but not yet minted.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
  SAFE_MIN_BOX_VALUE,
} from '@fleet-sdk/core';
import { SLong, SColl, SByte } from '@fleet-sdk/serializer';
import {
  MINER_FEE,
  MIN_BOX_VALUE,
  hexToBytes,
} from '../config.js';
import type { OptionType, OptionStyle, SettlementType } from '../types.js';

export interface CreateOptionParams {
  /** Compiled OptionReserveV2 contract ErgoTree (hex) */
  contractErgoTree: string;
  optionName: string;
  underlyingId: string;
  decimals: string;
  optionType: OptionType;
  style: OptionStyle;
  shareSize: bigint;
  maturityHeight: bigint;
  strikePrice: bigint;
  dAppUIMintFee: bigint;
  oracleIndex: number;
  settlementType: SettlementType;
  collateralCap: bigint;
  stablecoinDecimal: bigint;
  /** Token collateral: [tokenId, amount]. Omit for ERG call. */
  collateralToken?: { tokenId: string; amount: bigint };
  /** ERG collateral (for ERG calls only) */
  ergCollateral?: bigint;
  /** Writer's 33-byte compressed EC point */
  issuerECPoint: Uint8Array;
  /** dApp UI fee ErgoTree bytes */
  dAppUIFeeTree: Uint8Array;
  /** Writer's change address ErgoTree (hex) */
  changeErgoTree: string;
}

/**
 * Build an unsigned "create option definition" transaction.
 *
 * @param inputBoxes  Writer's wallet boxes (selected by the caller)
 * @param params      Option parameters
 * @param currentHeight Current blockchain height (for TX validity)
 * @returns Unsigned transaction ready for wallet signing
 */
export function buildCreateOptionTx(
  inputBoxes: Box<Amount>[],
  params: CreateOptionParams,
  currentHeight: number,
) {
  const txFee = MINER_FEE;

  // R4: Coll[Byte] — option name (UTF-8)
  const nameBytes = new TextEncoder().encode(params.optionName);

  // R5: Coll[Byte] — underlying token ID (hex → bytes, empty for ERG)
  const underlyingBytes = params.underlyingId
    ? hexToBytes(params.underlyingId)
    : new Uint8Array(0);

  // R6: Coll[Byte] — decimal encoding (UTF-8)
  const decimalBytes = new TextEncoder().encode(params.decimals);

  // R7: Coll[Byte] — placeholder 32 zero bytes (set to real box ID after mint)
  const r7dummy = new Uint8Array(32);

  // R8: Coll[Long] — 11 parameters
  const r8params = [
    params.optionType,
    params.style,
    params.shareSize,
    params.maturityHeight,
    params.strikePrice,
    params.dAppUIMintFee,
    txFee,
    params.oracleIndex,
    params.settlementType,
    params.collateralCap,
    params.stablecoinDecimal,
  ].map(BigInt);

  // Calculate total ERG for the definition box
  // ERG trace: create(V) → mint(V-txFee-mintFee) → deliver(-txFee-MIN) → exercise(-txFee)
  // After exercise: V - 3*txFee - mintFee - 2*MIN >= txFee + MIN → V >= 4*txFee + mintFee + 3*MIN
  let boxValue: bigint;
  if (!params.collateralToken) {
    // ERG call: collateral is in box value
    boxValue =
      (params.ergCollateral ?? 0n) +
      3n * txFee +
      params.dAppUIMintFee +
      2n * MIN_BOX_VALUE;
  } else {
    // Token collateral (physical non-ERG or cash-settled)
    boxValue = 4n * txFee + params.dAppUIMintFee + 3n * MIN_BOX_VALUE;
  }

  // Build the definition output box
  const outBuilder = new OutputBuilder(boxValue, params.contractErgoTree)
    .setAdditionalRegisters({
      R4: SColl(SByte, nameBytes),
      R5: SColl(SByte, underlyingBytes),
      R6: SColl(SByte, decimalBytes),
      R7: SColl(SByte, r7dummy),
      R8: SColl(SLong, r8params),
      R9: SColl(SColl(SByte), [
        Array.from(params.issuerECPoint),
        Array.from(params.dAppUIFeeTree),
      ]),
    });

  // Add collateral token if present
  if (params.collateralToken) {
    outBuilder.addTokens({
      tokenId: params.collateralToken.tokenId,
      amount: params.collateralToken.amount,
    });
  }

  // Ensure currentHeight >= max creationHeight of all inputs
  // (Fleet SDK uses this for output creationHeight; node rejects if lower than inputs)
  let safeHeight = currentHeight;
  for (const box of inputBoxes) {
    const ch = Number(box.creationHeight ?? 0);
    if (ch > safeHeight) safeHeight = ch;
  }

  // Build transaction
  const tx = new TransactionBuilder(safeHeight)
    .from(inputBoxes)
    .to([outBuilder])
    .sendChangeTo(params.changeErgoTree)
    .payFee(txFee)
    .build();

  return tx;
}

/**
 * Compute the total ERG needed from the writer's wallet for the create TX.
 * Includes box value + miner fee.
 */
export function computeCreateErgNeeded(params: {
  collateralToken?: { tokenId: string; amount: bigint };
  ergCollateral?: bigint;
  dAppUIMintFee: bigint;
}): bigint {
  const txFee = MINER_FEE;
  let boxValue: bigint;
  if (!params.collateralToken) {
    boxValue =
      (params.ergCollateral ?? 0n) +
      3n * txFee +
      params.dAppUIMintFee +
      2n * MIN_BOX_VALUE;
  } else {
    boxValue = 4n * txFee + params.dAppUIMintFee + 3n * MIN_BOX_VALUE;
  }
  return boxValue + txFee;
}
