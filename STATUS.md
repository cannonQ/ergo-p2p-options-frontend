# Ergo P2P Options Frontend — Status (2026-03-23 EOD)

## Proven on Mainnet

- **Write option** — single Nautilus signature, bot auto-mints + auto-delivers
- **Bot auto-mint** — detects DEFINITION boxes, builds + signs + submits mint TX
- **Bot auto-deliver** — detects MINTED_UNDELIVERED boxes, delivers tokens to writer
- **List for Sale** — portfolio modal with B-S suggested premium, Nautilus signs sell order TX
- **Option chain** — shows live OI from on-chain reserves, IV from oracle vol
- **Market page** — scans contract via byErgoTree, shows active + expired reserves
- **Stats bar** — live active contracts, OI in ERG, block height
- **Sparklines** — 24h price history from Supabase oracle_events
- **Wallet management** — multi-wallet discovery, disconnect, switch

## Open Items (Not Yet Built)

### Portfolio
- [ ] **Open Orders section** — needs to scan FixedPriceSell contract (USE + SigUSD) for sell orders belonging to wallet
- [ ] **Written Options section** — should show reserves where wallet is issuer (R9 match), currently only "My Contract Boxes" does this
- [ ] **Active Options (Holding)** — needs to match wallet tokens against known reserves to show positions
- [ ] **Cancel sell order** — button to reclaim tokens from a sell order
- [ ] **Batch listing** — select multiple options and list all in one TX

### Buy Flow
- [ ] **Buy from sell order** — clicking a row in the option chain should allow buying tokens from a listed sell order
- [ ] **Trade panel** — the slide-out exists but isn't wired to actual buy TXs

### Exercise Flow
- [ ] **Exercise button** — ExerciseDialog component exists but isn't wired to TX building
- [ ] **Physical exercise TX** — buyer sends stablecoin, receives underlying from reserve
- [ ] **Cash exercise TX** — buyer receives stablecoin payout based on oracle price

### Close/Refund
- [ ] **Close expired** — button exists, TX building by agent but untested
- [ ] **Reclaim definition** — button exists, TX building by agent but untested

### Contract Issues
- [ ] **FixedPriceSellV2** — stablecoin-based sell contract is compiled but NOT audited/tested on mainnet independently (the sell order TX was submitted but we haven't verified it can be bought from)
- [ ] **BuyTokenRequestV2** — stablecoin bid contract compiled, NOT tested at all

### UX Polish
- [ ] Option chain "Available" column doesn't show listed sell orders (only shows 0)
- [ ] Write page auto-list checkbox is non-functional (listing moved to portfolio)
- [ ] No TX ID shown after sell order submission in modal
- [ ] Contract boxes show incorrect exercise window for test contracts (uses production 720-block window)
- [ ] Responsive mobile layout not tested
- [ ] No ErgoPay (mobile QR) support

### Bot
- [ ] **Auto-close expired** — built but untested (no options have expired through the full 720-block window yet)
- [ ] Activity feed TX classifier is still a stub

### Deployment
- [ ] Not deployed to Vercel yet (running localhost only)
- [ ] Supabase anon key in .env.local (needs Vercel env vars)

## What Was Tested on Mainnet Today

1. Write ERG Call $0.30 — Nautilus signed Create TX ✓
2. Bot detected DEFINITION box — auto-minted after 1 block ✓
3. Bot detected MINTED_UNDELIVERED — auto-delivered ✓
4. Portfolio shows contract box as Active with expiry info ✓
5. List for Sale modal — set premium, Nautilus signed sell order TX ✓
6. Option chain shows OI=1 at the $0.2966 strike ✓
7. Market page shows ERG Call with spot price and expiry ✓
8. Stats bar shows 1 active contract, 2.00 ERG OI ✓

## Critical Bugs Found and Fixed During Testing

1. **byAddress URL too long** — P2S addresses are 2000+ chars, node returns 400. Fixed: use POST byErgoTree
2. **Miner fee must be explicit output** — node rejects TX without fee output box. Fixed: add FEE_CONTRACT output
3. **BigInt serialization** — JSON.stringify fails on BigInt. Fixed: .toString() all values
4. **Conditional mint fee output** — 0-fee creates underfunded box. Fixed: skip output when fee < MIN_BOX_VALUE
5. **EC point extraction** — Nautilus ergoTree format doesn't always start with 0008cd. Fixed: use node addressToRaw API
6. **B-S premium for expired options** — blocksToExpiry < 0 caused early return. Fixed: fallback to intrinsic value
7. **Sparkline data window** — 24 points only covered ~5 hours. Fixed: use full 24h of data (~120 epochs)
