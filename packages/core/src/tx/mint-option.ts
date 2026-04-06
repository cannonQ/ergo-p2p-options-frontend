/**
 * Build the "mint option tokens" transaction.
 * Port of OptionLifecycle.mintOption() from Scala.
 *
 * Permissionless — anyone can trigger. Creates N+1 option tokens
 * (N tradeable + 1 singleton) from the definition box.
 *
 * IMPORTANT: Cannot use mintToken() with registers() in Fleet SDK
 * (same as appkit — mintToken overwrites R4-R6). Use tokens() instead;
 * Ergo minting rule: new token ID = first input box ID.
 */
import {
  OutputBuilder,
  TransactionBuilder,
  type Box,
  type Amount,
} from '@fleet-sdk/core';
import { SLong, SColl, SByte } from '@fleet-sdk/serializer';
import {
  MINER_FEE,
  MIN_BOX_VALUE,
  ORACLE_DECIMAL,
  ERG_ORACLE_INDEX,
  hexToBytes,
  bytesToHex,
} from '../config.js';
import type { OptionParams } from '../types.js';

export interface MintOptionParams {
  /** The pre-mint definition box (at contract address) */
  definitionBox: Box<Amount>;
  /** Compiled OptionReserve contract ErgoTree (hex) */
  contractErgoTree: string;
  /** Token Registry box (data input for physical options) */
  registryBox?: Box<Amount>;
  /** Parsed R8 params from the definition box */
  params: OptionParams;
  /** Parsed R5 rates from registry box (needed for ERG call token count) */
  registryRates?: bigint[];
  /** Pre-parsed registers from definition box (R4, R5, R6, R8, R9 as hex) */
  registers: {
    R4: string; // serialized register value (hex)
    R5: string;
    R6: string;
    R8: string;
    R9: string;
  };
  /** Change address ErgoTree (hex) — for the minter (permissionless, any wallet) */
  changeErgoTree: string;
}

/**
 * Compute the number of option tokens to mint.
 * Returns total including the singleton (+1).
 *
 * Token count formulas:
 *   Physical call (non-ERG): collateral / shareSize + 1
 *   Physical call (ERG):     ergCollateral / nanoErgPerContract + 1
 *   Physical put:            collateral / (strikePrice × stablecoinDecimal / ORACLE_DECIMAL) + 1
 *   Cash-settled:            collateral / (collateralCap × stablecoinDecimal / ORACLE_DECIMAL) + 1
 */
export function computeTokenCount(
  params: OptionParams,
  definitionBox: Box<Amount>,
  registryRates?: bigint[],
): bigint {
  const { optionType, settlementType, shareSize, strikePrice, oracleIndex, collateralCap, stablecoinDecimal } = params;

  if (optionType === 0 && settlementType === 0 && oracleIndex !== ERG_ORACLE_INDEX) {
    // Physical call (non-ERG): collateral in tokens[0]
    // V4 contract uses: collateral / (shareSize * tokensPerUnit / ORACLE_DECIMAL) + 1
    const collateral = BigInt(definitionBox.assets[0]?.amount ?? 0n);
    const rate = registryRates?.[oracleIndex] ?? 1_000_000n;
    const tokensPerContract = shareSize * rate / ORACLE_DECIMAL;
    if (tokensPerContract <= 0n) return 1n;
    return collateral / tokensPerContract + 1n;
  }

  if (optionType === 0 && settlementType === 0 && oracleIndex === ERG_ORACLE_INDEX) {
    // ERG call: collateral in box Value
    const txFee = params.txFee;
    const availableCollateral =
      BigInt(definitionBox.value) -
      3n * txFee -
      params.dAppUIMintFee -
      2n * MIN_BOX_VALUE;
    const tokensPerUnit = registryRates?.[ERG_ORACLE_INDEX] ?? 1_000_000_000n;
    const nanoErgPerContract = shareSize * tokensPerUnit / ORACLE_DECIMAL;
    return availableCollateral / nanoErgPerContract + 1n;
  }

  if (optionType === 1 && settlementType === 0) {
    // Physical put: stablecoin collateral / strike per contract (V7: per-contract via shareSize)
    const collateral = BigInt(definitionBox.assets[0]?.amount ?? 0n);
    const strikePerContract = strikePrice * shareSize / ORACLE_DECIMAL * stablecoinDecimal / ORACLE_DECIMAL;
    return collateral / strikePerContract + 1n;
  }

  if (settlementType === 1) {
    // Cash-settled: stablecoin collateral / cap per contract (V7: per-contract via shareSize)
    const collateral = BigInt(definitionBox.assets[0]?.amount ?? 0n);
    const capPerContract = collateralCap * shareSize / ORACLE_DECIMAL * stablecoinDecimal / ORACLE_DECIMAL;
    return collateral / capPerContract + 1n;
  }

  throw new Error(`Unsupported option type/settlement: ${optionType}/${settlementType}`);
}

/**
 * Build an unsigned "mint option" transaction.
 *
 * @param mintParams  Mint parameters including parsed definition box
 * @param currentHeight Current blockchain height
 * @returns Unsigned transaction ready for signing
 */
export function buildMintOptionTx(
  mintParams: MintOptionParams,
  currentHeight: number,
) {
  const { definitionBox, params, contractErgoTree, registers, changeErgoTree } = mintParams;
  const txFee = params.txFee;
  const dAppUIMintFee = params.dAppUIMintFee;

  // R7: Coll[Byte] — set to the definition box ID (32 bytes)
  // This is what makes the box "minted" — tokens[0].id === R7
  const definitionBoxId = definitionBox.boxId;
  const r7bytes = hexToBytes(definitionBoxId);

  // Compute token count
  const numTokens = computeTokenCount(params, definitionBox, mintParams.registryRates);

  // Mint box value: definition value - txFee - dAppUIMintFee
  const mintBoxValue = BigInt(definitionBox.value) - txFee - dAppUIMintFee;

  // Build the reserve output box with minted tokens
  const reserveBuilder = new OutputBuilder(mintBoxValue, contractErgoTree)
    .setAdditionalRegisters({
      R4: registers.R4,
      R5: registers.R5,
      R6: registers.R6,
      R7: SColl(SByte, r7bytes),
      R8: registers.R8,
      R9: registers.R9,
    });

  // Add minted option tokens (new token ID = definition box ID, Ergo minting rule)
  reserveBuilder.addTokens({
    tokenId: definitionBoxId,
    amount: numTokens,
  });

  // Add collateral token if present (physical non-ERG or cash-settled)
  const isErgCall =
    params.optionType === 0 &&
    params.settlementType === 0 &&
    params.oracleIndex === ERG_ORACLE_INDEX;

  if (!isErgCall && definitionBox.assets.length > 0) {
    reserveBuilder.addTokens({
      tokenId: definitionBox.assets[0].tokenId,
      amount: definitionBox.assets[0].amount,
    });
  }

  // dApp UI mint fee output — goes to dAppUIFeeTree address
  const feeBoxValue = dAppUIMintFee < MIN_BOX_VALUE ? MIN_BOX_VALUE : dAppUIMintFee;
  const feeErgoTreeHex = bytesToHex(mintParams.registers.R9
    ? new Uint8Array(0) // Will be extracted from R9 by the caller
    : new Uint8Array(0));

  // NOTE: The dApp UI fee ErgoTree must be extracted from R9[1] by the caller
  // and passed as part of the registers. For now we use a placeholder.
  // The actual implementation needs the parsed R9 data.

  // Build transaction — single input (definition box)
  const txBuilder = new TransactionBuilder(currentHeight)
    .from([definitionBox])
    .to([reserveBuilder])
    .sendChangeTo(changeErgoTree)
    .payFee(txFee);

  // Add registry as data input for physical options
  if (mintParams.registryBox && params.settlementType === 0) {
    txBuilder.configureSelector((selector) =>
      selector.ensureInclusion(definitionBox.boxId)
    );
  }

  return txBuilder.build();
}
