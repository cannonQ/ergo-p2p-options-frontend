# Ergo P2P Options Frontend — Status (2026-03-25)

## Proven on Mainnet

- **Write option** — single Nautilus signature, bot auto-mints + auto-delivers
- **Bot auto-mint** — detects DEFINITION boxes, builds + signs + submits mint TX
- **Bot auto-deliver** — detects MINTED_UNDELIVERED boxes, delivers tokens to writer
- **List for Sale** — portfolio modal with B-S suggested premium, Nautilus signs sell order TX
- **Buy from sell order** — option chain shows premium + available, TradePanel builds buy TX, Nautilus signs *(2026-03-24)*
- **Exercise (physical call)** — portfolio Exercise button, fetches registry, builds TX, Nautilus signs, collateral delivered *(2026-03-24)*
- **Option chain** — shows live OI from on-chain reserves, IV from oracle vol, premium + available from sell orders
- **Market page** — scans contract via byErgoTree, shows active + expired reserves
- **Stats bar** — live active contracts, OI in ERG, block height
- **Sparklines** — 24h price history from Supabase oracle_events
- **Wallet management** — multi-wallet discovery, disconnect, switch
- **Portfolio holdings** — matches wallet tokens against reserves, shows active positions with exercise/list actions *(2026-03-24)*
- **Activity feed** — scans fee address + reserve contract boxes for WRITE/BUY/SELL/EXERCISE/CLOSE events *(2026-03-24)*
- **Etcha landing page** — full product page at `/`, dashboard moved to `/app` *(2026-03-24)*
- **Etcha rebrand** — copper palette, Space Grotesk/DM Mono/Instrument Serif fonts, SVG icon + logo *(2026-03-24)*

## Full Lifecycle Proven (2026-03-24)

**Write → Mint → Deliver → List → Buy → Exercise** — all tested end-to-end on mainnet with real wallets.

## Contract Issues — BLOCKERS BEFORE LAUNCH

- [x] **OptionReserveV3 tested on mainnet** — V3 fixes the double-exercise vulnerability (token burn verification). Test 13 proven on mainnet 2026-03-25: both frontend defense (`.tokensToBurn()`) and contract defense (`allExercisedTokensBurned`) passed. See `~/p2p-options-contracts/TESTING-TODO.md`. *(completed 2026-03-25)*
- [x] **Backend exercise TX builders updated** — `.tokensToBurn()` added to all 3 exercise paths in `OptionLifecycle.scala` (physical call, physical put, cash-settled). `Contracts.scala` now compiles V3. *(completed 2026-03-25)*
- [t] **Exercise is all-or-nothing per token ID** — V3 burn check requires ALL option tokens in inputs to be burned. UI now locks exercise quantity to user's full balance (quantity picker removed). Tested on mainnet with V3 via Test 13. *(built 2026-03-24, tested 2026-03-25)*
- [t] **Frontend TX builders update for V3** — `config.ts` updated with V3 ErgoTree (V2 kept as `OPTION_RESERVE_V2_ERGOTREE` for backward compat). `.burnTokens()` added to all 3 Fleet SDK exercise TX builders in `exercise-physical.ts` and `exercise-cash.ts`. `CONTRACT_ADDRESSES` includes both V3 and V2. *(built 2026-03-25)*

## Open Items (Not Yet Built)

### Portfolio
- [x] **Active Options (Holding)** — matches wallet tokens against reserves *(2026-03-24)*
- [t] **Open Orders section** — scans FixedPriceSell contracts, filters by wallet EC point (R4 match), shows premium/qty/cancel button *(built 2026-03-24)*
- [t] **Written Options section** — shows reserves where wallet is issuer (RESERVE + EXPIRED states), split from "My Contract Boxes" which now only shows pending states *(built 2026-03-24)*
- [t] **Cancel sell order** — button reclaims tokens from sell order box back to wallet via seller SigmaProp *(built 2026-03-24)*
- [ ] **Batch listing** — select multiple options and list all in one TX

### Buy Flow
- [x] **Buy from sell order** — option chain shows sell orders, TradePanel wired to `buildBuyFromSellOrderTx`, partial fills supported *(2026-03-24)*
- [x] **Trade panel** — wired to buy TX building, signing, submission *(2026-03-24)*

### Exercise Flow
- [x] **Exercise button** — ExerciseDialog wired to TX building with status/txId display *(2026-03-24)*
- [x] **Physical exercise TX** — buyer sends stablecoin, receives underlying from reserve *(2026-03-24)*
- [ ] **Cash exercise TX** — wired in UI but untested on mainnet (no cash-settled options created yet)
- [x] **Double-exercise vulnerability FIXED** — V3 contract proven on mainnet (Test 13). Backend builders updated. Frontend `.burnTokens()` added to all 3 exercise paths. *(2026-03-25)*
- [ ] **Post-burn token display** — After V3 exercise, burned tokens have 0 supply on-chain. Portfolio/activity must derive "Exercised" status from TX history (reserve spending chain), NOT wallet token balance. Needs UI testing with a V3-exercised option.

### Close/Refund
- [ ] **Close expired** — button exists + wired, needs creationHeight fix (same pattern applied to exercise). Untested.
- [ ] **Reclaim definition** — button exists + wired, untested

### Contract Issues — Non-blocking
- [ ] **FixedPriceSellV2** — stablecoin-based sell contract compiled, sell + buy tested on mainnet *(2026-03-24)*, cancel untested
- [ ] **BuyTokenRequestV2** — stablecoin bid contract compiled, NOT tested at all

### UX Polish
- [x] **Learn pages** — 6 guides converted to Next.js routes at `/learn/*` with Etcha design, clickable SVG diagrams, lesson navigation *(2026-03-24)*
- [t] Write page auto-list checkbox removed, replaced with note directing to Portfolio for listing *(built 2026-03-25)*
- [x] **TX status display** — reusable TxStatus component with copy button + ergexplorer.com link, integrated into ExerciseDialog, ListForSaleModal, TradePanel *(2026-03-24)*
- [ ] Responsive mobile layout not tested
- [ ] No ErgoPay (mobile QR) support

### Bot
- [ ] **Auto-close expired** — built but untested (no options have expired through the full 720-block window yet)

### Deployment
- [ ] Not deployed to Vercel yet (running localhost only)
- [ ] Supabase anon key in .env.local (needs Vercel env vars)

## What Was Tested on Mainnet (2026-03-24)

1. Write ERG Call $0.30 — Nautilus signed Create TX ✓
2. Bot detected DEFINITION box — auto-minted after 1 block ✓
3. Bot detected MINTED_UNDELIVERED — auto-delivered ✓
4. Portfolio shows contract box as Active with expiry info ✓
5. List for Sale modal — set premium, Nautilus signed sell order TX ✓
6. Option chain shows OI=1, premium=0.1000, available=2 at $0.2966 strike ✓
7. **Buy from sell order** — wallet B bought 1 option token via TradePanel ✓
8. **Exercise physical call** — wallet B exercised 1 ERG call, received ~1 ERG, paid 0.296 USE ✓
9. Portfolio "Active Options (Holding)" shows held option tokens ✓
10. Activity feed shows WRITE/BUY/EXERCISE events ✓
11. **Double-exercise discovered** — exercised token returned in change, re-exercise possible (V2 vulnerability) ✓ documented
12. **V3 contract written** — burn verification fix, two-pass audit passed ✓
13. **V3 double-exercise fix proven on mainnet** — Test 13 passed both frontend + contract defense *(2026-03-25)*
    - Exercise TX: `84431b43e71da9111c02780b2786646cd9b8fe8cb578a7122956cdaf6d238a5f`
    - Phase 3b: V3 `allExercisedTokensBurned` rejected non-burn TX → `Script reduced to false` ✓

## Critical Bugs Found and Fixed (2026-03-24)

1. **creationHeight mismatch** — Fleet SDK output creation height lower than max input creation height. Node rejects TX. Fixed: ensure `currentHeight >= max(all input creationHeights)` in exercise + buy TX builders.
2. **Portfolio expiry showing wrong time** — `currentHeight` was 0 for buyers (only set from `my-boxes` API which returns nothing for non-issuers). Fixed: fetch height via `fetchHeight()` at start of `loadTokens`.
3. **Exercise with 0 tokens** — stale wallet cache showed exercised position as active. Clicking exercise built TX with 0 tokens → cryptic Fleet SDK error. Fixed: guard check before TX building with clear message.
4. **Activity feed empty** — was scanning non-existent `byErgoTree` transaction endpoint. Fixed: scan fee address via `byAddress` + reserve contract boxes via `byErgoTree` (spent+unspent).

## Previous Bugs (2026-03-23)

1. **byAddress URL too long** — P2S addresses are 2000+ chars, node returns 400. Fixed: use POST byErgoTree
2. **Miner fee must be explicit output** — node rejects TX without fee output box. Fixed: add FEE_CONTRACT output
3. **BigInt serialization** — JSON.stringify fails on BigInt. Fixed: .toString() all values
4. **Conditional mint fee output** — 0-fee creates underfunded box. Fixed: skip output when fee < MIN_BOX_VALUE
5. **EC point extraction** — Nautilus ergoTree format doesn't always start with 0008cd. Fixed: use node addressToRaw API
6. **B-S premium for expired options** — blocksToExpiry < 0 caused early return. Fixed: fallback to intrinsic value
7. **Sparkline data window** — 24 points only covered ~5 hours. Fixed: use full 24h of data (~120 epochs)

## Alpha Release Checklist

### Blockers — must pass before community alpha

- [x] **1. Write at V3 address** — Write from UI, bot auto-mints + delivers, reserve appears in Written Options *(passed 2026-03-25)*
- [x] **2. List for sale** — List from Portfolio, TxStatus shows (copy + explorer), sell order appears in Open Orders *(passed 2026-03-25)*
- [x] **3. Buy from sell order** — Second wallet buys, TxStatus shows, option appears in Active Options *(passed 2026-03-25, required ensureInclusion fix)*
- [x] **4. Exercise (physical call) via frontend** — Tokens BURNED on explorer, no quantity picker, TxStatus works *(passed 2026-03-25, V3 burn confirmed on-chain)*
- [x] **5. Cancel sell order** — Cancel from Open Orders, tokens return to wallet *(passed 2026-03-25)*
- [ ] **6. Close expired** — Wait for expiry, close from Written Options, collateral returned to writer *(bot auto-close proven, frontend close button untested — need expiry wait)*
- [x] **7. Reclaim definition** — Cancel a definition before bot mints, ERG returned *(passed 2026-03-25, required 2-output fix for contract refund path)*
- [x] **8. Cash exercise TX** — Write a cash-settled option (FIRO Call $0.60), exercise it, USE payout correct ($0.079 profit) *(passed 2026-03-26, required R5 stablecoin ID fix + spot price API fix)*
- [x] **9. Post-burn token display** — After V3 exercise, no ghost positions in Portfolio *(passed 2026-03-25)*
- [x] **10. Cancel sell order (FixedPriceSellV2)** — USE cancel tested (2026-03-25). SigUSD sell order listed and bought successfully (2026-03-26) *(passed)*
- [x] **11. Auto-close expired bot** — Bot detects and sweeps expired reserves after 720-block window *(proven 2026-03-25, closed reserve a731be99)*
- [ ] **12. Vercel deployment** — Deploy with env vars (Supabase anon key, node URLs), verify prod works

### Bugs Found & Fixed During Testing (2026-03-25)

1. **fetchHeight() cached stale value** — Next.js cached server-side `fetch()` to node AND client-side fetch. Height returned 1748559 when actual was 1749950. Fixed: `cache: 'no-store'` on both server route (`/api/height`) and client `fetchHeight()` + timestamp cache-buster. Nuked `.next/cache/fetch-cache/`.
2. **Write page maturity set to past height** — Caused by stale fetchHeight (bug #1). Option created already expired, bot immediately auto-closed it. Fixed by bug #1 fix.
3. **creationHeight mismatch on create TX** — `buildCreateOptionTx` didn't guard against input boxes with higher creationHeight than fetchHeight. Fixed: added `safeHeight = max(currentHeight, max(input creationHeights))`.
4. **Buy TX didn't include sell order box** — Fleet SDK's `TransactionBuilder.from()` skipped the sell box during box selection (not needed for ERG balance). Buyer paid premium but never received option token. Fixed: `.configureSelector((s) => s.ensureInclusion(sellBox.boxId))` in `buildBuyFromSellOrderTx`.
5. **Expiry input was days-only** — No way to enter blocks directly. User entered "54" meaning 54 blocks but UI interpreted as 54 days. Fixed: added Days/Blocks toggle with smart defaults.
6. **Reclaim TX built with 3 outputs** — Contract refund path requires exactly 2 outputs (refund + fee). Was building with 3 (refund + change + fee). Fixed: single contract box input, no wallet boxes, no sendChangeTo.
7. **Cash-settled R5 was empty** — For cash options, R5 must contain the stablecoin token ID. Was empty for cash-only assets causing bot mint to fail ("Script reduced to false"). Fixed: `useWriteOption` sets R5 to USE/SigUSD token ID for cash settlement.
8. **Exercise spot price API wrong** — Exercise dialog used `/api/oracle` which returns raw companion data with no parsed spotPrices array. Cash options always showed "out of the money". Fixed: use `/api/spot?index=N` instead.
9. **Trade page revalidate=30 cached stale data** — Option chain showed no options because page-level cache served stale HTML. Fixed: `revalidate = 0` on trade and market pages.
10. **Cash-only assets defaulted to Physical settlement** — Write page defaulted to "physical" even when unavailable. Fixed: auto-default to "cash" when `!hasPhysicalDelivery(index)`.

### UI/UX Issues Noted During Testing (to fix)

1. **Write page: TxStatus missing** — Step 1 shows raw TX hex with no copy/explorer link. Need TxStatus component on write page.
2. **Write page: polling timeout too aggressive** — 5-minute hard timeout shows scary error when bot is working fine. Should poll indefinitely with soft "taking longer than usual" warning. Reference: ErgoRaffle polling UX.
3. **Trade page: no refresh button** — Unlike Portfolio, trade page has no manual refresh. Need one.
4. **Trade page: panel closes on outside click** — After buying, clicking outside the trade panel dismisses it. Can't go back to copy TX ID. Should persist until explicitly closed.
5. **Wallet disconnects on page refresh** — Nautilus reconnect issue. Annoying but may be wallet-side.
6. **Exercise modal: no success summary** — After exercise, should show "Exercised 1 ERG Call $0.25" with TxStatus, received/paid summary. Currently just shows status text.
7. **Open Orders: raw token ID** — Shows truncated token ID instead of option name (e.g. "ERG Call $0.25"). Should resolve by matching against reserves.
8. **Open Orders: unclear section name** — "Open Orders" doesn't convey these are sell orders. Consider "My Sell Orders" or add subtitle.
9. **Written Options: "ERG Locked" column misleading** — For token-collateral options (rsETH puts, cash-settled), it's not ERG that's locked. Should show actual collateral type + amount, or rename to "Value Locked".
10. **Bot: retry-before-confirmation noise** — Bot retries mint/deliver on next block scan before previous TX confirms, causing "Double spending attempt" errors. Should check mempool before resubmitting.
11. **Pending Boxes shows spent boxes** — After reclaim/close, spent box still appears until hard refresh. Scanner should filter spent boxes or portfolio should handle "box not found" gracefully (remove row).
12. **Cash-only assets: settlement default** — Fixed: auto-defaults to Cash when physical not available. But contract size label and summary text needed fixes for cash-only display.
13. **Reclaim TX: contract requires exactly 2 outputs** — Was building with 3 (refund + change + fee). Fixed: single input (contract box only), 2 outputs (refund + fee), no sendChangeTo.
14. **Market page rows not tradeable** — Clicking a row on Market Overview should open a buy panel/modal for that option, not require navigating to the trade page separately.
15. **Cash-settled R5 was empty** — For cash options, R5 must contain the stablecoin token ID (not empty). Bot mint failed with "Script reduced to false". Fixed: `useWriteOption` now sets R5 to USE/SigUSD token ID for cash settlement.
16. **Written Options shows "List for Sale" when no tokens left** — After all tradeable tokens are sold/exercised, the reserve still shows "List for Sale" button. Should check wallet balance for option tokens before showing action.
17. **Dashboard asset cards show "0 options"** — Active contracts not counted correctly on dashboard for V3.

### Post-Alpha

- [ ] **24H Volume** — StatsBar + option chain volume columns show "—" / 0. Need TX indexing (track buy events on sell contracts) to compute rolling 24h volume per asset and aggregate
- [ ] **Mint/Deliver TX IDs on write page** — Steps 2-3 show "Bot is minting/delivering..." but no TX ID. Use node's `spentTransactionId` from `/blockchain/box/byId/{boxId}` in the poll endpoint to derive the mint TX when the definition box gets spent. No shared state needed between bot and web.
- [ ] Batch listing (select multiple options, list all in one TX)
- [ ] BuyTokenRequestV2 (bid orders — stablecoin-denominated buy requests)
- [ ] Responsive mobile layout
- [ ] ErgoPay (mobile QR) support
- [ ] Exercise history in Portfolio (show past exercises with TX links)
- [ ] Greeks display (delta, gamma, theta, vega on option chain / trade panel)
- [ ] Portfolio P&L tracking (cost basis vs current value per position)
- [ ] Price alerts / notifications
- [ ] Historical charts (option price over time)
- [ ] Educational tooltips throughout app (contextual help beyond learn pages)

## Handoff Prompts

- `LEARN-PAGES-PROMPT.md` — convert 6 HTML learn pages to Next.js with Etcha design
- `~/p2p-options-contracts/DOUBLE-EXERCISE-FIX-PROMPT.md` — compile V3, test, deploy, update frontend
