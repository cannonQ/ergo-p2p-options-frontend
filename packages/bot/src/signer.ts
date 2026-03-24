/**
 * Transaction signing via Fleet SDK mnemonic (no node wallet needed).
 *
 * Uses ErgoHDKey from @fleet-sdk/wallet to derive keys from a mnemonic.
 * The mnemonic is read from the BOT_MNEMONIC env var (source ~/.secrets).
 *
 * This avoids conflicting with the node's wallet (which may be in use
 * by other services like the oracle operator).
 */
import { ErgoHDKey, Prover } from '@fleet-sdk/wallet';
import { ErgoAddress } from '@fleet-sdk/core';
import { config } from './config.js';

let cachedKey: ErgoHDKey | null = null;
let cachedAddress: string | null = null;
let cachedErgoTree: string | null = null;

function getMnemonic(): string {
  const mnemonic = process.env.BOT_MNEMONIC;
  if (!mnemonic) {
    throw new Error(
      'BOT_MNEMONIC env var not set. Run: source ~/.secrets\n' +
      'Expected: export BOT_MNEMONIC="your 15 or 24 word mnemonic"'
    );
  }
  return mnemonic;
}

function getHDKey(): ErgoHDKey {
  if (cachedKey) return cachedKey;
  const mnemonic = getMnemonic();
  const master = ErgoHDKey.fromMnemonicSync(mnemonic);
  // Derive the first EIP-3 address (m/44'/429'/0'/0/0)
  const derived = master.derive("m/44'/429'/0'/0/0");
  cachedKey = derived;
  return derived;
}

/**
 * Get the bot's wallet address (derived from mnemonic).
 */
export function getChangeAddress(): string {
  if (cachedAddress) return cachedAddress;
  const key = getHDKey();
  const addr = ErgoAddress.fromPublicKey(key.publicKey);
  cachedAddress = addr.toString();
  console.log(`[SIGNER] Bot address: ${cachedAddress}`);
  return cachedAddress;
}

/**
 * Get the ErgoTree hex for the bot's wallet address.
 */
export function getChangeErgoTree(): string {
  if (cachedErgoTree) return cachedErgoTree;
  const key = getHDKey();
  const addr = ErgoAddress.fromPublicKey(key.publicKey);
  cachedErgoTree = addr.ergoTree;
  return cachedErgoTree;
}

/**
 * Sign an unsigned transaction using the bot's mnemonic-derived key.
 *
 * For permissionless contract TXs (mint, deliver, close), the contract
 * inputs evaluate to true without a signature. The bot's key only signs
 * the P2PK input(s) that provide miner fee ERG.
 */
export function signTx(unsignedTx: any): any {
  const key = getHDKey();
  const prover = new Prover();
  return prover.signTransaction(unsignedTx, [key]);
}

/**
 * Sign and submit a transaction to the Ergo network.
 *
 * @param unsignedTx EIP-12 format unsigned transaction
 * @returns Transaction ID
 */
export async function signAndSubmitTx(unsignedTx: any): Promise<string> {
  const signedTx = signTx(unsignedTx);

  // Submit to network via node API (no wallet auth needed for submission)
  // Use BigInt-safe serializer (Ergo TXs may contain BigInt values)
  const submitRes = await fetch(`${config.nodeUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx, (_, v) => typeof v === 'bigint' ? v.toString() : v),
  });
  if (!submitRes.ok) {
    const body = await submitRes.text();
    throw new Error(`Submit failed (${submitRes.status}): ${body}`);
  }

  const txId: string = await submitRes.json();
  return txId;
}
