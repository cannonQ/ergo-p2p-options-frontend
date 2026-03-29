/**
 * GET /api/ergopay/status/[requestId]
 *
 * Frontend polls this to check if the mobile wallet has signed the TX.
 * Returns: pending | signed (with txId) | expired
 */
import { NextResponse } from "next/server";
import { getRequest } from "@/lib/ergopay";

export async function GET(
  _request: Request,
  { params }: { params: { requestId: string } },
) {
  const { requestId } = params;

  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  const req = getRequest(requestId);

  if (!req) {
    return NextResponse.json({ status: "expired" });
  }

  // Check if expired (30 min)
  if (Date.now() - req.createdAt > 30 * 60 * 1000) {
    return NextResponse.json({ status: "expired" });
  }

  if (req.status === "signed" && req.txId) {
    return NextResponse.json({ status: "signed", txId: req.txId });
  }

  return NextResponse.json({ status: "pending" });
}
