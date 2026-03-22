/**
 * EIP-12 wallet connector for Nautilus.
 * Handles connection, UTXO fetching, TX signing, and submission.
 */

// EIP-12 types (Nautilus injects these on window)
declare global {
  interface Window {
    ergoConnector?: {
      nautilus?: {
        connect: (params?: { createErgoObject: boolean }) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        getContext: () => Promise<ErgoAPI>;
      };
    };
    ergo?: ErgoAPI;
  }
}

interface ErgoAPI {
  get_utxos: (amount?: string, tokenId?: string) => Promise<any[]>;
  get_balance: (tokenId?: string) => Promise<string>;
  get_used_addresses: () => Promise<string[]>;
  get_unused_addresses: () => Promise<string[]>;
  get_change_address: () => Promise<string>;
  sign_tx: (tx: any) => Promise<any>;
  submit_tx: (tx: any) => Promise<string>;
}

export async function isNautilusAvailable(): Promise<boolean> {
  // Wait briefly for injection
  if (typeof window === 'undefined') return false;
  if (window.ergoConnector?.nautilus) return true;
  await new Promise(r => setTimeout(r, 100));
  return !!window.ergoConnector?.nautilus;
}

export async function connectNautilus(): Promise<ErgoAPI> {
  if (!window.ergoConnector?.nautilus) {
    throw new Error('Nautilus wallet not found. Please install the Nautilus extension.');
  }
  const connected = await window.ergoConnector.nautilus.connect({ createErgoObject: true });
  if (!connected) {
    throw new Error('User declined connection request');
  }
  const api = await window.ergoConnector.nautilus.getContext();
  return api;
}

export async function getWalletUtxos(api: ErgoAPI): Promise<any[]> {
  return api.get_utxos() ?? [];
}

export async function getChangeAddress(api: ErgoAPI): Promise<string> {
  return api.get_change_address();
}

export async function getUsedAddresses(api: ErgoAPI): Promise<string[]> {
  return api.get_used_addresses();
}

export async function getErgBalance(api: ErgoAPI): Promise<string> {
  return api.get_balance('ERG');
}

export async function signTx(api: ErgoAPI, unsignedTx: any): Promise<any> {
  return api.sign_tx(unsignedTx);
}

export async function submitTx(api: ErgoAPI, signedTx: any): Promise<string> {
  return api.submit_tx(signedTx);
}
