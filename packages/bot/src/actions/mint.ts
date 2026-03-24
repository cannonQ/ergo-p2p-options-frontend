/**
 * Auto-mint action — builds and submits a mint-option TX
 * for DEFINITION boxes (pre-mint, created by the writer).
 *
 * This is a permissionless operation: the bot's wallet just pays the miner fee.
 * New token ID = definition box ID (Ergo minting rule).
 * Tokens stay in the reserve box until delivery.
 */
import { config } from '../config.js';
import { signAndSubmitTx } from '../signer.js';
import { parseCollLong, parseCollCollByte, bytesToHex } from '../sigma.js';
import type { ClassifiedBox } from '../scanner.js';
import {
  computeTokenCount,
  MIN_BOX_VALUE,
  OPTION_RESERVE_ERGOTREE,
  REGISTRY_NFT_ID,
  REGISTRY_RATES,
  ERG_ORACLE_INDEX,
} from '@ergo-options/core';
import type { OptionParams } from '@ergo-options/core';

/**
 * Fetch a box's raw bytes (hex-encoded) from the node.
 * Used for inputsRaw / dataInputsRaw in the signing request.
 */
async function fetchBoxRawBytes(boxId: string): Promise<string> {
  const res = await fetch(`${config.nodeUrl}/utxo/withPool/byIdBinary/${boxId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch box bytes for ${boxId}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.bytes as string;
}

/**
 * Fetch the first unspent box containing a given token ID.
 */
async function fetchBoxByTokenId(tokenId: string): Promise<{ boxId: string }> {
  const res = await fetch(
    `${config.nodeUrl}/blockchain/box/unspent/byTokenId/${tokenId}?offset=0&limit=1`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch box by token ${tokenId}: ${res.status}`);
  }
  const boxes = await res.json();
  if (!boxes || boxes.length === 0) {
    throw new Error(`No unspent box found with token ${tokenId}`);
  }
  return boxes[0];
}

/**
 * Parse R8 Coll[Long] into an OptionParams struct.
 */
function parseR8Params(r8hex: string): OptionParams | undefined {
  const values = parseCollLong(r8hex);
  if (!values || values.length < 11) return undefined;

  return {
    optionType: Number(values[0]) as 0 | 1,
    style: Number(values[1]) as 0 | 1,
    shareSize: values[2],
    maturityDate: values[3],
    strikePrice: values[4],
    dAppUIMintFee: values[5],
    txFee: values[6],
    oracleIndex: Number(values[7]),
    settlementType: Number(values[8]) as 0 | 1,
    collateralCap: values[9],
    stablecoinDecimal: values[10],
  };
}

/**
 * Convert a node API box to the shape expected by computeTokenCount.
 */
function nodeBoxToFleetLike(raw: ClassifiedBox['raw']): {
  boxId: string;
  value: string;
  assets: { tokenId: string; amount: string }[];
} {
  return {
    boxId: raw.boxId,
    value: raw.value.toString(),
    assets: (raw.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
  };
}

/**
 * Execute a mint TX for a DEFINITION box.
 *
 * The mint TX structure:
 *   INPUT[0]:      definition box (spent)
 *   DATA INPUT[0]: registry box (for physical options, not spent)
 *   OUTPUT[0]:     reserve box (minted tokens + collateral + registers)
 *   OUTPUT[1]:     dApp UI fee box
 *
 * @param box Classified box from the scanner
 * @param currentHeight Current blockchain height
 * @returns TX ID on success, or null if the action should be skipped
 * @throws On unrecoverable errors (signing failure, etc.)
 */
export async function executeMint(
  box: ClassifiedBox,
  currentHeight: number,
): Promise<string | null> {
  const raw = box.raw;
  const definitionBoxId = raw.boxId;
  const shortId = definitionBoxId.slice(0, 16);

  // --- Parse registers ---
  const r8hex = raw.additionalRegisters.R8;
  if (!r8hex) {
    console.warn(`[MINT] Box ${shortId}... missing R8, skipping`);
    return null;
  }
  const params = parseR8Params(r8hex);
  if (!params) {
    console.warn(`[MINT] Box ${shortId}... failed to parse R8 params, skipping`);
    return null;
  }

  const r9hex = raw.additionalRegisters.R9;
  if (!r9hex) {
    console.warn(`[MINT] Box ${shortId}... missing R9, skipping`);
    return null;
  }
  const r9parts = parseCollCollByte(r9hex);
  if (!r9parts || r9parts.length < 2) {
    console.warn(`[MINT] Box ${shortId}... R9 must have at least 2 elements (issuer + fee tree), skipping`);
    return null;
  }

  // Validate required registers R4, R5, R6
  for (const reg of ['R4', 'R5', 'R6'] as const) {
    if (!raw.additionalRegisters[reg]) {
      console.warn(`[MINT] Box ${shortId}... missing ${reg}, skipping`);
      return null;
    }
  }

  // --- Compute token count ---
  const fleetLikeBox = nodeBoxToFleetLike(raw);
  const isErgCall =
    params.optionType === 0 &&
    params.settlementType === 0 &&
    params.oracleIndex === ERG_ORACLE_INDEX;

  const registryRates = isErgCall ? REGISTRY_RATES : undefined;

  const numTokens = computeTokenCount(params, fleetLikeBox as any, registryRates);
  if (numTokens <= 1n) {
    console.warn(`[MINT] Box ${shortId}... computed token count <= 1, skipping`);
    return null;
  }

  console.log(`[MINT] Box ${shortId}... minting ${numTokens} tokens (type=${params.optionType}, settlement=${params.settlementType})`);

  // --- Build R7: Coll[Byte] sigma encoding of definition box ID ---
  // 0x0e = Coll[Byte] type, 0x20 = VLQ(32), then 32 raw bytes
  const r7hex = '0e20' + definitionBoxId;

  // --- Compute values ---
  const txFee = params.txFee;
  const dAppUIMintFee = params.dAppUIMintFee;
  const reserveValue = BigInt(raw.value) - txFee - dAppUIMintFee;
  if (reserveValue < MIN_BOX_VALUE) {
    console.warn(`[MINT] Box ${shortId}... reserve value too low (${reserveValue}), skipping`);
    return null;
  }

  // --- Build output assets ---
  const reserveAssets: { tokenId: string; amount: bigint }[] = [
    { tokenId: definitionBoxId, amount: numTokens },
  ];
  // Non-ERG collateral token is carried through
  if (!isErgCall && raw.assets.length > 0) {
    reserveAssets.push({
      tokenId: raw.assets[0].tokenId,
      amount: BigInt(raw.assets[0].amount),
    });
  }

  // --- dApp UI fee output (only if mint fee > 0) ---
  const dAppUIFeeTreeHex = bytesToHex(r9parts[1]);
  const hasMintFee = dAppUIMintFee >= MIN_BOX_VALUE;
  const feeValue = hasMintFee ? dAppUIMintFee : 0n;

  // Adjust reserve value: only deduct mint fee if we're creating the fee output
  const reserveValueAdjusted = hasMintFee ? reserveValue : BigInt(raw.value) - txFee;

  // --- Fetch raw box bytes for signing ---
  const definitionBoxRaw = await fetchBoxRawBytes(definitionBoxId);

  // --- Registry box as data input (physical options only) ---
  const dataInputs: { boxId: string }[] = [];
  const dataInputsRaw: string[] = [];

  if (params.settlementType === 0) {
    const registryBox = await fetchBoxByTokenId(REGISTRY_NFT_ID);
    const registryBoxRaw = await fetchBoxRawBytes(registryBox.boxId);
    dataInputs.push({ boxId: registryBox.boxId });
    dataInputsRaw.push(registryBoxRaw);
  }

  // --- Build unsigned TX (EIP-12 format for node's /wallet/transaction/sign) ---
  const unsignedTx = {
    inputs: [
      {
        boxId: definitionBoxId,
        extension: {},
      },
    ],
    dataInputs,
    outputs: [
      // OUTPUT[0]: Reserve box with minted option tokens
      {
        value: reserveValueAdjusted.toString(),
        ergoTree: OPTION_RESERVE_ERGOTREE,
        creationHeight: currentHeight,
        assets: reserveAssets.map(a => ({
          tokenId: a.tokenId,
          amount: a.amount.toString(),
        })),
        additionalRegisters: {
          R4: raw.additionalRegisters.R4,
          R5: raw.additionalRegisters.R5,
          R6: raw.additionalRegisters.R6,
          R7: r7hex,
          R8: raw.additionalRegisters.R8,
          R9: raw.additionalRegisters.R9,
        },
      },
      // OUTPUT[1]: dApp UI fee box (only if mint fee >= MIN_BOX_VALUE)
      ...(hasMintFee ? [{
        value: feeValue.toString(),
        ergoTree: dAppUIFeeTreeHex,
        creationHeight: currentHeight,
        assets: [] as { tokenId: string; amount: string }[],
        additionalRegisters: {} as Record<string, string>,
      }] : []),
      // OUTPUT[last]: Miner fee — explicit output, NOT implicit
      {
        value: txFee.toString(),
        ergoTree: '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
        creationHeight: currentHeight,
        assets: [] as { tokenId: string; amount: string }[],
        additionalRegisters: {} as Record<string, string>,
      },
    ],
    inputsRaw: [definitionBoxRaw],
    dataInputsRaw,
  };

  try {
    const txId = await signAndSubmitTx(unsignedTx);
    console.log(`[MINT] Submitted TX ${txId} for definition box ${shortId}...`);
    return txId;
  } catch (err: any) {
    const msg = err?.message || String(err);

    // "Input already spent" means someone else minted it — not an error
    if (msg.includes('already spent') || msg.includes('double spending')) {
      console.log(`[MINT] Box ${shortId}... already spent (minted by another party)`);
      return null;
    }

    throw err;
  }
}
