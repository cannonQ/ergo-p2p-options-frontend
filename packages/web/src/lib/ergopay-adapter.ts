/**
 * ErgoPay TX Adapter
 *
 * Converts Fleet SDK EIP-12 unsigned transactions into the format
 * expected by ergopay.duckdns.org/api/v1/reducedTx.
 *
 * Key differences:
 * - Inputs only need { boxId } — the service fetches full box data
 * - Data inputs need { boxId } only
 * - Outputs keep full structure (value, address/ergoTree, assets, registers)
 * - Fee and changeAddress are top-level fields
 */

export interface ErgoPayUnsignedTx {
  creationHeight: number;
  fee: number;
  changeAddress: string;
  inputs: Array<{ boxId: string; extension?: Record<string, string> }>;
  dataInputs: Array<{ boxId: string }>;
  outputs: Array<{
    value: string;
    address?: string;
    ergoTree?: string;
    assets: Array<{ tokenId: string; amount: string }>;
    additionalRegisters: Record<string, string>;
  }>;
}

/**
 * Convert an EIP-12 unsigned TX (from Fleet SDK's toEIP12Object())
 * to the format ergopay.duckdns.org expects.
 *
 * @param eip12Tx The EIP-12 format unsigned transaction
 * @param changeAddress The address for change output (wallet address)
 * @param fee Miner fee in nanoERG
 * @returns Formatted unsigned TX for the ErgoPay reduction service
 */
export function adaptTxForErgoPay(
  eip12Tx: any,
  changeAddress: string,
  fee: number | bigint,
): ErgoPayUnsignedTx {
  // Extract inputs — only boxId needed
  const inputs = (eip12Tx.inputs || []).map((input: any) => {
    const entry: any = { boxId: input.boxId };
    if (input.extension && Object.keys(input.extension).length > 0) {
      entry.extension = input.extension;
    }
    return entry;
  });

  // Extract data inputs — only boxId needed
  const dataInputs = (eip12Tx.dataInputs || []).map((di: any) => ({
    boxId: di.boxId,
  }));

  // Extract outputs — keep full structure but normalize values to strings
  const outputs = (eip12Tx.outputs || []).map((output: any) => ({
    value: String(output.value),
    ...(output.ergoTree ? { ergoTree: output.ergoTree } : {}),
    ...(output.address ? { address: output.address } : {}),
    assets: (output.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: String(a.amount),
    })),
    additionalRegisters: output.additionalRegisters || {},
  }));

  // Get creation height from the first output or default
  const creationHeight =
    eip12Tx.outputs?.[0]?.creationHeight ||
    eip12Tx.creationHeight ||
    0;

  return {
    creationHeight,
    fee: Number(fee),
    changeAddress,
    inputs,
    dataInputs,
    outputs,
  };
}

/**
 * Convert an Ergo address to the format the ErgoPay service expects.
 * The service accepts both base58 addresses and ErgoTree hex.
 */
export function ergoTreeToAddress(ergoTree: string): string {
  // The ErgoPay service can work with ErgoTree hex directly
  return ergoTree;
}
