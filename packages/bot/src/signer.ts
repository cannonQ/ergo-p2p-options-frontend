/**
 * Transaction signing and submission via the Ergo node wallet API.
 *
 * The node must have its wallet unlocked (POST /wallet/unlock with password).
 * This avoids the WASM context extension serialization bug and is simpler
 * than using Fleet SDK's ErgoHDKey for signing.
 */
import { config } from './config.js';

/**
 * Get the bot's wallet change address from the node.
 * Cached after first call.
 */
let cachedChangeAddress: string | null = null;

export async function getChangeAddress(): Promise<string> {
  if (cachedChangeAddress) return cachedChangeAddress;

  const res = await fetch(`${config.nodeUrl}/wallet/addresses`, {
    headers: { 'Content-Type': 'application/json', 'api_key': 'hello' },
  });
  if (!res.ok) {
    throw new Error(`Failed to get wallet addresses: ${res.status} ${await res.text()}`);
  }
  const addresses: string[] = await res.json();
  if (addresses.length === 0) {
    throw new Error('No wallet addresses found — is the node wallet initialized?');
  }
  cachedChangeAddress = addresses[0];
  return cachedChangeAddress;
}

/**
 * Get the ErgoTree hex for the bot's wallet change address.
 */
export async function getChangeErgoTree(): Promise<string> {
  const address = await getChangeAddress();
  const res = await fetch(`${config.nodeUrl}/utils/addressToRaw/${address}`);
  if (!res.ok) {
    throw new Error(`Failed to convert address to ErgoTree: ${res.status}`);
  }
  const data = await res.json();
  return data.raw as string;
}

/**
 * Sign a transaction via the Ergo node wallet API and submit it to the network.
 *
 * @param unsignedTx EIP-12 format unsigned transaction object
 * @returns Transaction ID of the submitted transaction
 */
export async function signAndSubmitTx(unsignedTx: unknown): Promise<string> {
  // Sign via node wallet
  const signRes = await fetch(`${config.nodeUrl}/wallet/transaction/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': 'hello' },
    body: JSON.stringify(unsignedTx),
  });
  if (!signRes.ok) {
    const body = await signRes.text();
    throw new Error(`Sign failed (${signRes.status}): ${body}`);
  }
  const signedTx = await signRes.json();

  // Submit to network
  const submitRes = await fetch(`${config.nodeUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx),
  });
  if (!submitRes.ok) {
    const body = await submitRes.text();
    throw new Error(`Submit failed (${submitRes.status}): ${body}`);
  }

  // Returns TX ID as a JSON string
  const txId: string = await submitRes.json();
  return txId;
}
