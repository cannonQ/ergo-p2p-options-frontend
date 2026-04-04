/**
 * GET /api/ergopay/connect/[sessionId]/[address]
 *
 * ErgoPay wallet callback for address-prompt flow.
 * Mobile wallet calls this after replacing #P2PK_ADDRESS# with the real address.
 * Must return ErgoPaySigningRequest JSON (EIP-20 spec).
 * Since we just need the address (no TX to sign), we return a message only.
 */
import { NextResponse } from "next/server";
import { getRequest, markSigned } from "@/lib/ergopay";

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string; address: string } },
) {
  const { sessionId, address } = params;

  if (!sessionId || !address) {
    return NextResponse.json(
      { message: "Missing session or address", messageSeverity: "ERROR" },
      { status: 400 },
    );
  }

  // Basic Ergo address validation
  if (!/^[1-9A-HJ-NP-Za-km-z]{30,60}$/.test(address)) {
    return NextResponse.json(
      { message: "Invalid Ergo address format", messageSeverity: "ERROR" },
      { status: 400 },
    );
  }

  const session = getRequest(sessionId);
  if (!session) {
    return NextResponse.json(
      { message: "Session not found or expired. Please try again.", messageSeverity: "ERROR" },
      { status: 404 },
    );
  }

  if (session.status !== "pending") {
    return NextResponse.json(
      { message: "Session already used.", messageSeverity: "ERROR" },
      { status: 409 },
    );
  }

  // Store the address — reuse markSigned with the address as the "txId"
  markSigned(sessionId, address);

  return NextResponse.json({
    message: "Connected to Etcha!",
    messageSeverity: "INFORMATION",
  });
}
