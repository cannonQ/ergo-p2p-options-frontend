/**
 * ErgoPay (mobile wallet) helpers.
 *
 * Handles:
 * 1. Mobile detection
 * 2. Posting unsigned TXs to ergopay.duckdns.org for reduction
 * 3. Polling for TX confirmation
 */

const ERGOPAY_SERVICE = "https://ergopay.duckdns.org";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

// ── In-memory request store (server-side, per-instance) ─────────

// For MVP we use Next.js API route memory. In production, use Redis or DB.
const requestStore = new Map<
  string,
  { status: string; txId?: string; createdAt: number }
>();

export function storeRequest(requestId: string) {
  requestStore.set(requestId, { status: "pending", createdAt: Date.now() });
}

export function getRequest(requestId: string) {
  return requestStore.get(requestId) ?? null;
}

export function markSigned(requestId: string, txId: string) {
  const req = requestStore.get(requestId);
  if (req && req.status === "pending") {
    req.status = "signed";
    req.txId = txId;
  }
}

// Clean up expired requests (>30 min)
export function cleanupRequests() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, req] of requestStore) {
    if (req.createdAt < cutoff) requestStore.delete(id);
  }
}

// ── Client-side: request + poll ─────────────────────────────────

export interface ErgoPayTxRequest {
  requestId: string;
  ergoPayUrl: string;
}

export type ErgoPayTxStatus =
  | { status: "pending" }
  | { status: "signed"; txId: string }
  | { status: "expired" };

/**
 * Submit an unsigned TX to the ErgoPay reduction service.
 * Returns the ergopay:// URL for QR/deep-link and a requestId for polling.
 */
export async function requestErgoPayTx(params: {
  unsignedTx: any;
  address: string;
  message: string;
}): Promise<ErgoPayTxRequest> {
  // Generate request ID without crypto.randomUUID (not available on non-HTTPS)
  const requestId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();

  // Register the request on our backend for callback tracking
  const registerRes = await fetch("/api/ergopay/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (!registerRes.ok) throw new Error("Failed to register ErgoPay request");

  // Build the callback URL
  const host = window.location.origin;
  const replyTo = `${host}/api/ergopay/callback/${requestId}`;

  // POST via our proxy (avoids CORS with ergopay.duckdns.org)
  const res = await fetch("/api/ergopay/reduce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: params.address,
      message: params.message,
      messageSeverity: "INFORMATION",
      replyTo,
      unsignedTx: params.unsignedTx,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ErgoPay service error (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.url) throw new Error("ErgoPay service returned no URL");

  return { requestId, ergoPayUrl: data.url };
}

/**
 * Poll our backend for the status of an ErgoPay TX request.
 */
export async function pollErgoPayTxStatus(
  requestId: string,
): Promise<ErgoPayTxStatus> {
  const res = await fetch(`/api/ergopay/status/${requestId}`);
  if (!res.ok) throw new Error("Failed to check ErgoPay status");
  return res.json();
}
