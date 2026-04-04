# ErgoPay — Remaining TX Flows Plan

## What's Done
- Wallet connect via QR (address prompt flow)
- Auto-reconnect on page refresh
- Balance display (nanoERG from node)
- Write option (full flow: build TX → reduce → QR → sign → bot mint/deliver)
- Portfolio loads for ErgoPay wallets (UTXOs from node)
- ErgoPayModal component (portaled, QR + deep link + polling)
- TX adapter (Fleet SDK EIP-12 → ErgoPay format)
- Reduce proxy (/api/ergopay/reduce — ErgoTree→address conversion)
- Callback + status polling API routes (global store)

## Remaining TX Flows (6 flows)

Each flow needs the same pattern:
1. Build unsigned TX with Fleet SDK (already works)
2. Convert via `adaptTxForErgoPay()` (strip change/fee outputs)
3. POST to `/api/ergopay/reduce` (convert addresses, forward to service)
4. Show ErgoPayModal with QR
5. Poll for signed TX
6. Handle post-signing (refresh data, show confirmation)

### 1. Buy Option (TradePanel.tsx)
**Current:** Nautilus signs buy TX directly
**ErgoPay change:**
- Check `walletType` from store
- If ergopay: adapt the buy TX, show ErgoPayModal
- After signed: show success, refresh option chain
- Complexity: LOW — single TX, no post-signing steps
- File: `packages/web/src/app/app/trade/[asset]/components/TradePanel.tsx`

### 2. List for Sale (portfolio page → ListForSaleModal)
**Current:** Nautilus signs sell order TX
**ErgoPay change:**
- Check `walletType` in handleListForSaleSubmit
- If ergopay: adapt TX, show ErgoPayModal
- After signed: refresh portfolio
- Complexity: LOW — single TX
- File: `packages/web/src/app/app/portfolio/page.tsx` (handleListForSaleSubmit ~line 530)

### 3. Cancel Sell Order (portfolio page)
**Current:** Nautilus signs cancel TX
**ErgoPay change:**
- Check `walletType` in handleCancelSellOrder
- If ergopay: adapt TX, show ErgoPayModal
- After signed: show success banner, refresh
- Complexity: LOW — single TX
- File: `packages/web/src/app/app/portfolio/page.tsx` (handleCancelSellOrder ~line 770)

### 4. Exercise Option (portfolio page → ExerciseDialog)
**Current:** Nautilus signs exercise TX (complex: oracle data input, multiple outputs)
**ErgoPay change:**
- Check `walletType` in handleExerciseSubmit
- If ergopay: need wallet UTXOs from node (for payment boxes)
- Adapt TX, show ErgoPayModal
- After signed: refresh portfolio
- Complexity: MEDIUM — needs data inputs (oracle box), multiple outputs
- Risk: ErgoPay service may struggle with data inputs
- File: `packages/web/src/app/app/portfolio/page.tsx` (handleExerciseSubmit ~line 900)

### 5. Close Expired (portfolio page)
**Current:** No wallet inputs needed (fee from reserve box)
**ErgoPay change:**
- Check `walletType` in handleClose
- Close TX uses only the reserve box as input (no wallet boxes)
- Adapt TX, show ErgoPayModal
- After signed: show success banner
- Complexity: LOW — but unique: no wallet inputs, contract-only
- Risk: ErgoPay service needs to evaluate contract guards on inputs
- File: `packages/web/src/app/app/portfolio/page.tsx` (handleClose ~line 680)

### 6. Reclaim/Refund (portfolio page)
**Current:** Nautilus signs refund TX
**ErgoPay change:**
- Same pattern as close
- Complexity: LOW
- File: `packages/web/src/app/app/portfolio/page.tsx` (handleReclaim ~line 590)

## Implementation Strategy

### Approach: Shared ErgoPay signing helper

Create a helper function that any TX flow can call:

```typescript
async function signViaErgoPay(
  unsignedTx: any,           // EIP-12 format from Fleet SDK
  walletAddress: string,
  message: string,
  onSigned: (txId: string) => void,
): Promise<void>
```

This encapsulates: adapt → reduce → show modal → poll → callback.

The modal state can be managed via a shared context/store so any page can trigger it without embedding ErgoPayModal in every component.

### Recommended order:
1. **Extract shared helper** from useWriteOptionErgoPay into reusable function
2. **Buy** (simplest, most impactful for users)
3. **List for Sale** (next most common action)
4. **Cancel Sell Order** (simple)
5. **Close Expired** (test contract-input reduction)
6. **Exercise** (most complex, save for last)
7. **Reclaim** (same pattern as close)

### Estimated effort per flow:
- Extract shared helper: 1 hour
- Each simple flow (buy, list, cancel, close, reclaim): 30 min each
- Exercise flow: 1-2 hours (data inputs complexity)
- Testing: 30 min per flow
- Total: ~6-8 hours

## Known Issues to Fix
- replyTo callback URL needs public hostname (ngrok for dev, real domain for prod)
- The poll endpoint uses TX ID as definition box ID proxy — works for write but needs proper box discovery for other flows
- ErgoPayModal should auto-close when flow completes (currently stays open)

## Production Deployment Notes
- Set `ERGOPAY_PUBLIC_HOST` env var to the public domain
- The ergopay.duckdns.org service stores reduced TXs for 30 minutes
- Callback URL must be reachable from the internet (the wallet POSTs to it)
- Consider: fallback to blockchain polling if callback doesn't arrive within 60s
