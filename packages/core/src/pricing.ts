/**
 * Black-Scholes pricing module for Ergo P2P options.
 *
 * All functions use plain `number` — these are advisory (off-chain) calculations.
 * Default risk-free rate r = 0 (no Ergo staking yield).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minutes per year (365.25 * 24 * 60) */
const MINUTES_PER_YEAR = 525960;

/** Approximate Ergo block time in minutes */
const BLOCK_TIME_MINUTES = 2;

/** Blocks per year */
const BLOCKS_PER_YEAR = MINUTES_PER_YEAR / BLOCK_TIME_MINUTES; // 262980

// ---------------------------------------------------------------------------
// Cumulative Normal Distribution — Abramowitz & Stegun (formula 26.2.17)
// ---------------------------------------------------------------------------

/**
 * Standard normal probability density function.
 */
function phi(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative distribution function of the standard normal distribution.
 *
 * Uses the Abramowitz & Stegun rational approximation (|error| < 7.5e-8).
 */
function cdf(x: number): number {
  if (x === 0) return 0.5;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y =
    1.0 - (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) * Math.exp(-0.5 * absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Internal: compute d1 and d2 for Black-Scholes. */
function d1d2(
  S: number,
  K: number,
  sigma: number,
  T: number,
  r: number,
): { d1: number; d2: number } {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2 };
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * European call price (Black-Scholes).
 *
 * @param S     Spot price of the underlying
 * @param K     Strike price
 * @param sigma Annualized volatility (decimal, e.g. 0.80 for 80%)
 * @param T     Time to expiry in years
 * @param r     Risk-free rate (default 0)
 */
export function bsCall(S: number, K: number, sigma: number, T: number, r: number = 0): number {
  if (T <= 0 || sigma <= 0) return Math.max(0, S - K);
  const { d1, d2 } = d1d2(S, K, sigma, T, r);
  return S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
}

/**
 * European put price (Black-Scholes).
 *
 * @param S     Spot price of the underlying
 * @param K     Strike price
 * @param sigma Annualized volatility (decimal, e.g. 0.80 for 80%)
 * @param T     Time to expiry in years
 * @param r     Risk-free rate (default 0)
 */
export function bsPut(S: number, K: number, sigma: number, T: number, r: number = 0): number {
  if (T <= 0 || sigma <= 0) return Math.max(0, K - S);
  const { d1, d2 } = d1d2(S, K, sigma, T, r);
  return K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
}

// ---------------------------------------------------------------------------
// Greeks
// ---------------------------------------------------------------------------

export type BSOptionType = 'call' | 'put';

/**
 * Delta — rate of change of option price with respect to underlying price.
 *
 * Call delta is in [0, 1]; put delta is in [-1, 0].
 */
export function delta(
  S: number,
  K: number,
  sigma: number,
  T: number,
  r: number = 0,
  type: BSOptionType = 'call',
): number {
  if (T <= 0 || sigma <= 0) {
    if (type === 'call') return S > K ? 1 : 0;
    return S < K ? -1 : 0;
  }
  const { d1 } = d1d2(S, K, sigma, T, r);
  return type === 'call' ? cdf(d1) : cdf(d1) - 1;
}

/**
 * Gamma — rate of change of delta with respect to underlying price.
 *
 * Same for calls and puts.
 */
export function gamma(
  S: number,
  K: number,
  sigma: number,
  T: number,
  r: number = 0,
): number {
  if (T <= 0 || sigma <= 0) return 0;
  const { d1 } = d1d2(S, K, sigma, T, r);
  return phi(d1) / (S * sigma * Math.sqrt(T));
}

/**
 * Theta — rate of change of option price with respect to time (per year).
 *
 * Returns a negative number for long positions (time decay).
 */
export function theta(
  S: number,
  K: number,
  sigma: number,
  T: number,
  r: number = 0,
  type: BSOptionType = 'call',
): number {
  if (T <= 0 || sigma <= 0) return 0;
  const { d1, d2 } = d1d2(S, K, sigma, T, r);
  const sqrtT = Math.sqrt(T);
  const term1 = -(S * phi(d1) * sigma) / (2 * sqrtT);
  if (type === 'call') {
    return term1 - r * K * Math.exp(-r * T) * cdf(d2);
  }
  return term1 + r * K * Math.exp(-r * T) * cdf(-d2);
}

/**
 * Vega — rate of change of option price with respect to volatility.
 *
 * Same for calls and puts. Returned per 1.0 change in sigma (not per 1%).
 */
export function vega(
  S: number,
  K: number,
  sigma: number,
  T: number,
  r: number = 0,
): number {
  if (T <= 0 || sigma <= 0) return 0;
  const { d1 } = d1d2(S, K, sigma, T, r);
  return S * phi(d1) * Math.sqrt(T);
}

// ---------------------------------------------------------------------------
// Implied Volatility — Newton-Raphson solver
// ---------------------------------------------------------------------------

/**
 * Solve for implied volatility using Newton-Raphson iteration.
 *
 * @param price   Observed option price
 * @param S       Spot price
 * @param K       Strike price
 * @param T       Time to expiry in years
 * @param r       Risk-free rate (default 0)
 * @param type    'call' or 'put'
 * @param tol     Convergence tolerance (default 1e-8)
 * @param maxIter Maximum iterations (default 100)
 * @returns       Implied volatility (decimal), or NaN if solver fails
 */
export function impliedVolatility(
  price: number,
  S: number,
  K: number,
  T: number,
  r: number = 0,
  type: BSOptionType = 'call',
  tol: number = 1e-8,
  maxIter: number = 100,
): number {
  if (T <= 0) return NaN;

  // Initial guess via Brenner-Subrahmanyam approximation
  let sig = Math.sqrt((2 * Math.PI) / T) * (price / S);
  if (sig <= 0 || !isFinite(sig)) sig = 0.5;

  const priceFn = type === 'call' ? bsCall : bsPut;

  for (let i = 0; i < maxIter; i++) {
    const p = priceFn(S, K, sig, T, r);
    const v = vega(S, K, sig, T, r);
    if (v < 1e-12) return NaN; // vega too small — no convergence possible
    const diff = p - price;
    if (Math.abs(diff) < tol) return sig;
    sig -= diff / v;
    if (sig <= 0) sig = 1e-6; // keep sigma positive
  }

  return NaN; // did not converge
}

// ---------------------------------------------------------------------------
// Oracle / chain conversion helpers
// ---------------------------------------------------------------------------

/**
 * Convert oracle companion-box R5 volatility (annualized basis points) to
 * a decimal suitable for Black-Scholes.
 *
 * Example: 8000 bps (80%) -> 0.80
 */
export function oracleVolToDecimal(bps: number): number {
  return bps / 10_000;
}

/**
 * Convert a block-height difference to fractional years.
 *
 * Uses 1 block ~ 2 minutes, 525960 minutes per year (365.25 days).
 */
export function blocksToYears(blocks: number): number {
  return (blocks * BLOCK_TIME_MINUTES) / MINUTES_PER_YEAR;
}

// Re-export the CDF for testing or external use
export { cdf, phi, BLOCKS_PER_YEAR };
