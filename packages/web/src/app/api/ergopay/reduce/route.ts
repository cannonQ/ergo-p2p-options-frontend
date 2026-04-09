/**
 * POST /api/ergopay/reduce
 *
 * Proxies the unsigned TX to ergopay.duckdns.org/api/v1/reducedTx.
 * Avoids CORS issues from calling the ErgoPay service directly from the browser.
 */
import { NextResponse } from "next/server";

const ERGOPAY_SERVICE = "https://ergopay.duckdns.org";
import { NODE_URL } from "@/lib/node";

/** Convert ErgoTree hex to base58 Ergo address via node API */
async function ergoTreeToAddress(ergoTree: string): Promise<string> {
  // If it already looks like a base58 address (starts with 9 or 3), return as-is
  if (/^[1-9A-HJ-NP-Za-km-z]{30,}$/.test(ergoTree)) return ergoTree;

  const res = await fetch(`${NODE_URL}/utils/ergoTreeToAddress/${ergoTree}`);
  if (!res.ok) throw new Error(`Failed to convert ErgoTree to address: ${res.status}`);
  const data = await res.json();
  return data.address;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Convert ErgoTree hex → base58 address on all outputs
    if (body.unsignedTx?.outputs) {
      for (const output of body.unsignedTx.outputs) {
        if (output.address && output.address.length > 60) {
          // Looks like an ErgoTree hex, convert to address
          try {
            output.address = await ergoTreeToAddress(output.address);
          } catch (e: any) {
            console.error("[ErgoPay Reduce] ErgoTree→address conversion failed:", e.message);
          }
        }
      }
    }

    const res = await fetch(`${ERGOPAY_SERVICE}/api/v1/reducedTx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[ErgoPay Reduce] Service returned", res.status, text);
      return NextResponse.json(
        { error: `ErgoPay service error (${res.status}): ${text}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
