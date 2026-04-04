/**
 * Shared ErgoPay signing helper.
 *
 * Any TX flow can call signViaErgoPay() to:
 * 1. Adapt the Fleet SDK unsigned TX to ErgoPay format
 * 2. POST to the reduction service via proxy
 * 3. Return the ergopay:// URL and requestId for the modal
 *
 * The caller is responsible for showing ErgoPayModal and handling onSigned.
 */

import { adaptTxForErgoPay } from "./ergopay-adapter";
import { requestErgoPayTx } from "./ergopay";
import { MINER_FEE } from "@ergo-options/core";

export interface ErgoPaySignResult {
  ergoPayUrl: string;
  requestId: string;
}

/**
 * Prepare an unsigned TX for ErgoPay signing.
 *
 * @param eip12Tx The EIP-12 format unsigned TX (from Fleet SDK's toEIP12Object())
 * @param walletAddress The user's base58 Ergo address
 * @param message Description shown in the wallet (e.g. "Etcha: Buy ERG Call $0.35")
 * @returns ergopay:// URL and requestId for polling
 */
export async function prepareErgoPayTx(
  eip12Tx: any,
  walletAddress: string,
  message: string,
): Promise<ErgoPaySignResult> {
  // Convert Fleet SDK format to ErgoPay format (strip change/fee outputs)
  const ergoPayTx = adaptTxForErgoPay(eip12Tx, walletAddress, MINER_FEE);

  // POST to reduction service, get ergopay:// URL
  const { requestId, ergoPayUrl } = await requestErgoPayTx({
    unsignedTx: ergoPayTx,
    address: walletAddress,
    message,
  });

  return { ergoPayUrl, requestId };
}

/**
 * Fetch UTXOs for an address from the node (for ErgoPay, replaces Nautilus API).
 */
export async function fetchWalletBoxes(address: string): Promise<any[]> {
  const res = await fetch(`/api/boxes?address=${address}`);
  if (!res.ok) throw new Error("Failed to fetch wallet boxes");
  const { boxes } = await res.json();
  return (boxes || []).map((b: any) => ({
    boxId: b.boxId,
    transactionId: b.transactionId,
    index: b.index,
    ergoTree: b.ergoTree,
    creationHeight: b.creationHeight,
    value: b.value.toString(),
    assets: (b.assets || []).map((a: any) => ({
      tokenId: a.tokenId,
      amount: a.amount.toString(),
    })),
    additionalRegisters: b.additionalRegisters || {},
  }));
}
