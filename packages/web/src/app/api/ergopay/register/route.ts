/**
 * POST /api/ergopay/register
 *
 * Registers a new ErgoPay TX request for callback tracking.
 * Called by the frontend before posting to the ErgoPay reduction service.
 */
import { NextResponse } from "next/server";
import { storeRequest, cleanupRequests } from "@/lib/ergopay";

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();

    if (!requestId || typeof requestId !== "string" || requestId.length < 16) {
      return NextResponse.json(
        { error: "requestId required (16+ chars)" },
        { status: 400 },
      );
    }

    // Clean up old requests periodically
    cleanupRequests();

    storeRequest(requestId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
