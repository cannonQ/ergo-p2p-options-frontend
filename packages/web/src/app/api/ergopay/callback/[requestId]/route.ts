/**
 * POST /api/ergopay/callback/[requestId]
 *
 * Wallet callback endpoint (replyTo). The mobile wallet POSTs
 * { signedTxId } or { txId } here after signing and broadcasting.
 */
import { NextResponse } from "next/server";
import { markSigned, getRequest } from "@/lib/ergopay";

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } },
) {
  const { requestId } = params;

  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const txId = body.signedTxId || body.txId;

    if (!txId || typeof txId !== "string") {
      return NextResponse.json(
        { error: "signedTxId required" },
        { status: 400 },
      );
    }

    // Validate txId format (64 hex chars)
    if (!/^[0-9a-fA-F]{64}$/.test(txId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID format" },
        { status: 400 },
      );
    }

    const req = getRequest(requestId);
    if (!req) {
      // Request not found or expired — still return 200 (wallet expects success)
      return NextResponse.json({ ok: true });
    }

    markSigned(requestId, txId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ErgoPay callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
