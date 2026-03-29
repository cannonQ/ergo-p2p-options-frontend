/**
 * POST /api/ergopay/reduce
 *
 * Proxies the unsigned TX to ergopay.duckdns.org/api/v1/reducedTx.
 * Avoids CORS issues from calling the ErgoPay service directly from the browser.
 */
import { NextResponse } from "next/server";

const ERGOPAY_SERVICE = "https://ergopay.duckdns.org";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("[ErgoPay Reduce] Sending to service:", JSON.stringify(body, null, 2).slice(0, 2000));

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
