"use client";
import { useState, useEffect, useCallback } from "react";

interface OracleData {
  spotPrice: number;
  oracleVol: number;
}

/**
 * Periodically refreshes oracle data from /api/spot.
 * Returns the latest spotPrice + vol, or the initial SSR values if no refresh yet.
 *
 * The /api/spot endpoint accepts `?index=N` and returns:
 *   { price: number, rawPrice: number, vol: number, index: number }
 * where `price` is rawPrice / 1_000_000 and `vol` is annualized bps.
 */
export function useOracleRefresh(
  oracleIndex: number,
  initialSpot: number,
  initialVol: number,
  intervalMs = 60_000,
): OracleData {
  const [data, setData] = useState<OracleData>({
    spotPrice: initialSpot,
    oracleVol: initialVol,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/spot?index=${oracleIndex}`);
      if (!res.ok) return;
      const json = await res.json();
      // price is already divided by ORACLE_DECIMAL on the server
      if (typeof json.price === "number" && json.price > 0) {
        setData({
          spotPrice: json.price,
          oracleVol: typeof json.vol === "number" ? json.vol : initialVol,
        });
      }
    } catch {
      // Keep existing data on error
    }
  }, [oracleIndex, initialVol]);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return data;
}
