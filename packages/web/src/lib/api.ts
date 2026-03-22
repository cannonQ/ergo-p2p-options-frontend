/**
 * Client-side API wrapper for Next.js API routes.
 * Fetches oracle data, boxes, and submits transactions.
 */

const API_BASE = '/api';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export interface OracleResponse {
  spotPrices: string[];  // bigint as string (JSON can't serialize bigint)
  volatility: string[];
  epoch: number;
}

export interface HeightResponse {
  height: number;
}

export interface BoxesResponse {
  boxes: any[];
}

export async function fetchOracleData(): Promise<OracleResponse> {
  return fetchJson<OracleResponse>('/oracle');
}

export async function fetchHeight(): Promise<number> {
  const data = await fetchJson<HeightResponse>('/height');
  return data.height;
}

export async function fetchBoxesAtAddress(address: string): Promise<any[]> {
  const data = await fetchJson<BoxesResponse>(`/boxes?address=${encodeURIComponent(address)}`);
  return data.boxes;
}

export async function submitTransaction(signedTx: any): Promise<string> {
  const res = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedTx),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit failed: ${text}`);
  }
  const data = await res.json();
  return data.txId;
}

export async function checkMempoolTx(txId: string): Promise<any> {
  return fetchJson(`/mempool/${txId}`);
}
