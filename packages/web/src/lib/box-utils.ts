/**
 * Shared box format converters for Fleet SDK.
 * Used by portfolio page, trade panel, and any TX-building flow.
 */

/**
 * Convert a Nautilus UTXO (EIP-12 format) to Fleet SDK Box format.
 */
export function nautilusBoxToFleet(box: any): any {
  return {
    boxId: box.boxId,
    transactionId: box.transactionId,
    index: box.index,
    ergoTree: box.ergoTree,
    creationHeight: box.creationHeight,
    value: box.value.toString(),
    assets: (box.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: box.additionalRegisters || {},
  };
}

/**
 * Convert node box format to Fleet SDK box format.
 */
export function nodeBoxToFleet(box: any): any {
  return {
    boxId: box.boxId,
    transactionId: box.transactionId,
    index: box.index,
    ergoTree: box.ergoTree,
    creationHeight: box.creationHeight,
    value: box.value.toString(),
    assets: (box.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: box.additionalRegisters || {},
  };
}
