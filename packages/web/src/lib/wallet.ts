/**
 * EIP-12 wallet connector for Nautilus.
 * Follows best practices from the Ergo dApp Connector Skill (EIP-12).
 *
 * Key patterns:
 * - Poll for ergoConnector injection (async, not available immediately)
 * - Structured error handling (code 0=APIError, 1=Refused, 2=InvalidRequest)
 * - User must approve all sensitive actions via wallet popup
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

export interface ErgoAPI {
  get_utxos: (amount?: string, tokenId?: string) => Promise<any[]>;
  get_balance: (tokenId?: string) => Promise<string>;
  get_used_addresses: (paginate?: { page: number; limit: number }) => Promise<string[]>;
  get_unused_addresses: () => Promise<string[]>;
  get_change_address: () => Promise<string>;
  sign_tx: (tx: any) => Promise<any>;
  sign_tx_input: (tx: any, index: number) => Promise<any>;
  sign_data: (address: string, message: string) => Promise<string>;
  submit_tx: (tx: any) => Promise<string>;
}

/** EIP-12 error codes */
export enum WalletErrorCode {
  APIError = 0,
  Refused = 1,
  InvalidRequest = 2,
}

export class WalletError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "WalletError";
  }
}

/**
 * Wait for the Nautilus ergoConnector to be injected.
 * Browser extensions inject asynchronously after page load — must poll.
 */
export function waitForErgoConnector(timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.ergoConnector?.nautilus) return resolve(true);

    const t0 = Date.now();
    const timer = setInterval(() => {
      if (window.ergoConnector?.nautilus) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - t0 >= timeout) {
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Check if Nautilus is available (with polling).
 */
export async function isNautilusAvailable(): Promise<boolean> {
  return waitForErgoConnector(3000);
}

/**
 * Connect to Nautilus wallet.
 * Triggers a popup for user approval.
 */
export async function connectNautilus(): Promise<ErgoAPI> {
  const available = await waitForErgoConnector(3000);
  if (!available || !window.ergoConnector?.nautilus) {
    throw new WalletError(
      WalletErrorCode.APIError,
      "Nautilus wallet not found. Please install the Nautilus browser extension."
    );
  }

  try {
    const connected = await window.ergoConnector.nautilus.connect({
      createErgoObject: true,
    });
    if (!connected) {
      throw new WalletError(WalletErrorCode.Refused, "Connection request declined by user.");
    }
  } catch (err: any) {
    if (err instanceof WalletError) throw err;
    if (err?.code === 1) throw new WalletError(WalletErrorCode.Refused, "Connection request declined.");
    throw new WalletError(WalletErrorCode.APIError, err?.message || "Failed to connect");
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
  return api.get_balance("ERG");
}

/**
 * Sign a transaction via Nautilus.
 * User will see TX details in a popup and must approve.
 */
export async function signTx(api: ErgoAPI, unsignedTx: any): Promise<any> {
  try {
    return await api.sign_tx(unsignedTx);
  } catch (err: any) {
    console.error("[signTx] Nautilus error:", err, "code:", err?.code, "info:", err?.info, "message:", err?.message);
    if (err?.code === 1) throw new WalletError(WalletErrorCode.Refused, `Signing failed (code 1): ${err?.info || err?.message || "declined or proof error"}`);
    if (err?.code === 2) throw new WalletError(WalletErrorCode.InvalidRequest, err?.message || "Invalid transaction");
    throw new WalletError(WalletErrorCode.APIError, err?.message || "Signing failed");
  }
}

/**
 * Submit a signed transaction via Nautilus node.
 */
export async function submitTx(api: ErgoAPI, signedTx: any): Promise<string> {
  try {
    return await api.submit_tx(signedTx);
  } catch (err: any) {
    throw new WalletError(WalletErrorCode.APIError, err?.message || "Submission failed");
  }
}
