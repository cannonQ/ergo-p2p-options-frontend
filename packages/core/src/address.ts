import { bytesToHex, hexToBytes } from './config.js';

// P2PK ErgoTree prefix: 0x0008cd (3 bytes)
const P2PK_PREFIX = new Uint8Array([0x00, 0x08, 0xcd]);

/**
 * Convert a 33-byte compressed EC point to a P2PK ErgoTree (36 bytes).
 * Pattern: 0x0008cd + 33-byte EC point
 */
export function ecPointToErgoTree(ecPoint: Uint8Array): Uint8Array {
  if (ecPoint.length !== 33) {
    throw new Error(`EC point must be 33 bytes, got ${ecPoint.length}`);
  }
  const tree = new Uint8Array(36);
  tree.set(P2PK_PREFIX, 0);
  tree.set(ecPoint, 3);
  return tree;
}

/**
 * Convert a 33-byte EC point to a hex ErgoTree string.
 */
export function ecPointToErgoTreeHex(ecPoint: Uint8Array): string {
  return bytesToHex(ecPointToErgoTree(ecPoint));
}

/**
 * Extract the 33-byte EC point from a P2PK ErgoTree.
 * Validates the prefix is 0x0008cd.
 */
export function ergoTreeToECPoint(ergoTree: Uint8Array): Uint8Array {
  if (ergoTree.length !== 36) {
    throw new Error(`P2PK ErgoTree must be 36 bytes, got ${ergoTree.length}`);
  }
  if (ergoTree[0] !== 0x00 || ergoTree[1] !== 0x08 || ergoTree[2] !== 0xcd) {
    throw new Error('Not a P2PK ErgoTree (missing 0x0008cd prefix)');
  }
  return ergoTree.slice(3);
}

/**
 * Check if an ErgoTree is a simple P2PK (36 bytes, 0x0008cd prefix).
 */
export function isP2PK(ergoTreeHex: string): boolean {
  return ergoTreeHex.length === 72 && ergoTreeHex.startsWith('0008cd');
}
