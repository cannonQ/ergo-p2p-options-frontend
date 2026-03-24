import { NextResponse } from 'next/server';

const NODE_URL = process.env.ERGO_NODE_URL || 'http://96.255.150.220:9053';

export type BoxState = 'DEFINITION' | 'MINTED' | 'DELIVERED' | 'NOT_FOUND';

export interface PollResponse {
  state: BoxState;
  tokenCount?: number;
}

/**
 * Poll the state of a definition box by its creation box ID (R7).
 *
 * State machine:
 *   - DEFINITION: Box exists at contract address with no minted tokens (tokens[0] absent)
 *   - MINTED: Box exists with tokens[0].amount > 1 (N+1 tokens, not yet delivered)
 *   - DELIVERED: Box exists with tokens[0].amount == 1 (singleton only — tokens delivered)
 *   - NOT_FOUND: No box found (could be spent/refunded, or TX not yet confirmed)
 *
 * The boxId param is the definition box ID from the create TX. After mint/deliver
 * the box is spent and a successor is created. We find the successor by scanning
 * the contract address for boxes whose R7 matches the original creation box ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { boxId: string } },
) {
  const { boxId } = params;

  if (!boxId || boxId.length !== 64) {
    return NextResponse.json(
      { error: 'boxId must be a 64-character hex string' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('contractAddress');

  if (!contractAddress) {
    return NextResponse.json(
      { error: 'contractAddress query parameter required' },
      { status: 400 },
    );
  }

  try {
    // First, try to find the box directly by ID (still unspent = DEFINITION state)
    const directRes = await fetch(`${NODE_URL}/blockchain/box/byId/${boxId}`);
    if (directRes.ok) {
      const box = await directRes.json();
      // If the box is unspent and has no tokens, it's still in DEFINITION state
      if (!box.spentTransactionId) {
        const tokens = box.assets || [];
        if (tokens.length === 0) {
          return NextResponse.json({ state: 'DEFINITION' } satisfies PollResponse);
        }
        // Has tokens — check if minted or delivered
        const optionTokenCount = tokens[0]?.amount ?? 0;
        if (optionTokenCount > 1) {
          return NextResponse.json({
            state: 'MINTED',
            tokenCount: Number(optionTokenCount),
          } satisfies PollResponse);
        }
        if (optionTokenCount === 1) {
          return NextResponse.json({
            state: 'DELIVERED',
            tokenCount: 1,
          } satisfies PollResponse);
        }
      }
      // Box was spent — fall through to scan for successor by R7
    }

    // Scan contract address for boxes whose R7 matches this creation box ID.
    // R7 stores the original creation box ID as Coll[Byte] (32 bytes).
    // The serialized R7 hex = "0e20" + boxId (0e = Coll[Byte] type, 20 = 32 length).
    const r7Hex = `0e20${boxId}`;

    const scanRes = await fetch(
      `${NODE_URL}/blockchain/box/unspent/byAddress?offset=0&limit=100`,
      { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: contractAddress },
    );
    if (!scanRes.ok) {
      return NextResponse.json({ state: 'NOT_FOUND' } satisfies PollResponse);
    }

    const boxes: any[] = await scanRes.json();

    for (const box of boxes) {
      const registers = box.additionalRegisters || {};
      // R7 contains the creation box ID — match against our target
      if (registers.R7 === r7Hex) {
        const tokens = box.assets || [];
        if (tokens.length === 0) {
          return NextResponse.json({ state: 'DEFINITION' } satisfies PollResponse);
        }
        const optionTokenCount = tokens[0]?.amount ?? 0;
        if (optionTokenCount > 1) {
          return NextResponse.json({
            state: 'MINTED',
            tokenCount: Number(optionTokenCount),
          } satisfies PollResponse);
        }
        if (optionTokenCount === 1) {
          return NextResponse.json({
            state: 'DELIVERED',
            tokenCount: 1,
          } satisfies PollResponse);
        }
      }
    }

    return NextResponse.json({ state: 'NOT_FOUND' } satisfies PollResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
