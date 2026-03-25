# Ergo P2P Options Frontend — Status (2026-03-24 EOD)

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

- [ ] **OptionReserveV3 deployment** — V3 fixes the double-exercise vulnerability (token burn verification). V2 is UNSAFE for production. See `~/p2p-options-contracts/DOUBLE-EXERCISE-VULNERABILITY.md`. V3 contract written, needs compile + test + deploy.
- [t] **Exercise is all-or-nothing per token ID** — V3 burn check requires ALL option tokens in inputs to be burned. UI now locks exercise quantity to user's full balance (quantity picker removed). Needs testing on mainnet with V3. *(built 2026-03-24)*
- [ ] **Frontend TX builders update for V3** — Once V3 is deployed with a new ErgoTree, update `config.ts` with the new `OPTION_RESERVE_ERGOTREE`, recompile core, and add `.burnTokens()` to exercise TX builders so Fleet SDK doesn't reject the token imbalance.

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
- [ ] **Double-exercise vulnerability** — V2 does not burn tokens during exercise. V3 fix written. See BLOCKERS above.

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

## Handoff Prompts

- `LEARN-PAGES-PROMPT.md` — convert 6 HTML learn pages to Next.js with Etcha design
- `~/p2p-options-contracts/DOUBLE-EXERCISE-FIX-PROMPT.md` — compile V3, test, deploy, update frontend
