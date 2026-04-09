/**
 * POST /api/ergopay/init
 *
 * Creates an ErgoPay address-prompt session.
 * Returns an ergopay:// URL with #P2PK_ADDRESS# placeholder.
 * The wallet replaces the placeholder with the user's real address
 * and GETs the /connect endpoint.
 */
import { NextResponse } from "next/server";
import { storeRequest, cleanupRequests } from "@/lib/ergopay";

export async function POST() {
  try {
    const host = process.env.ERGOPAY_PUBLIC_HOST || process.env.VERCEL_URL;
    if (!host) {
      return NextResponse.json({ error: "ERGOPAY_PUBLIC_HOST not configured" }, { status: 500 });
    }

    cleanupRequests();

    const sessionId = crypto.randomUUID().replace(/-/g, "").slice(0, 32).toUpperCase();
    storeRequest(sessionId);

    // The wallet replaces #P2PK_ADDRESS# with the real address
    const ergoPayUrl = `ergopay://${host}/api/ergopay/connect/${sessionId}/#P2PK_ADDRESS#`;

    return NextResponse.json({
      sessionId,
      ergoPayUrl,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
