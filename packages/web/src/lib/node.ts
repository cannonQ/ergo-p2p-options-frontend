/**
 * Ergo node URL — required via ERGO_NODE_URL env var.
 * In production: fails loudly if unset so deployments don't silently use a dev node.
 * In development: falls back to local/dev node for convenience.
 */
const DEV_FALLBACK = "http://96.255.150.220:9053";
export const NODE_URL = process.env.ERGO_NODE_URL !== undefined
  ? process.env.ERGO_NODE_URL
  : (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK);

export async function fetchCurrentHeight(): Promise<number> {
  try {
    const res = await fetch(`${NODE_URL}/info`, { cache: "no-store" });
    if (!res.ok) return 0;
    const info = await res.json();
    return info.fullHeight ?? 0;
  } catch {
    return 0;
  }
}
