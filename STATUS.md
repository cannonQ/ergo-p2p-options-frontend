# Ergo P2P Options Frontend — Status (2026-03-23)

## What's Built

### Core Library (`packages/core/`) — 15 files
- Fleet SDK TX builders for all option lifecycle operations (create, mint, deliver, exercise physical/cash, close, sell orders)
- Black-Scholes pricing with Greeks (delta, gamma, theta, vega) + Newton-Raphson IV solver
- Safe box selector (protected token + option token exclusion)
- Box state classifier (DEFINITION, MINTED_UNDELIVERED, RESERVE, EXPIRED)
- All constants, token IDs, registry rates from Config.scala

### Frontend (`packages/web/`) — ~40 files
- **Landing page**: Live oracle prices from node, sparklines + 24h change from Supabase, Rosen Bridge badges, all 21 feeds across 4 categories
- **Option chain**: Strikes generated around spot price, IV populated via oracle vol + smile skew, volume bar columns, settlement filter (Physical/Cash), ATM highlighting, ITM shading
- **Trade panel**: Slide-out with buy/sell toggle, stablecoin-denominated premium + total, exercise preview (pay/receive in stablecoins), breakeven, slippage, stablecoin selector
- **Write flow**: Full form (type, style with tooltip, settlement, strike defaulting to oracle, expiry, collateral, contracts calculator, B-S suggested premium with reset, summary, auto-list checkbox), 3-step TX stepper wired to `useWriteOption` hook
- **Portfolio**: Wallet tokens via Nautilus + Zustand, filtered to relevant assets (ERG/USE/SigUSD/Rosen Bridge), pagination, exercise dialog, stuck box sections
- **Market**: Reserve scanner + filterable table (asset, type, expiry, ITM only)
- **Platform stats bar**: 24h Volume, OI, Active Contracts, Avg IV
- **Activity feed**: Live activity component with TX classifier stub
- **Wallet**: EIP-12 Nautilus connector with async polling + structured error codes (per MCP skill best practices)
- **API routes**: /oracle, /boxes, /submit, /height, /mempool, /spot, /activity

### Bot (`packages/bot/`) — 8 files
- Poller (30s interval), scanner with full R7/R8 register parsing
- Delivery retry action (MINTED_UNDELIVERED, max 3 retries)
- Close expired action (returns collateral to writer)
- Node wallet API signer (sign + submit)
- SQLite state tracking
- Health endpoint (:8090)
- Fully permissionless — anyone can run

### Infrastructure
- Monorepo (pnpm workspaces)
- GitHub repo: `cannonQ/ergo-p2p-options-frontend` (private)
- AGPL-3.0 license
- Supabase integration for price history (shared with oracle dashboard)
- Public Ergo nodes: Jumei + TheStophe

---

## What's Ready to Test Tomorrow

### Write an Option (needs Nautilus + wallet with tokens)
1. Go to `/trade/ada/write`
2. Fill form (Call, European, Physical, strike ~$0.25, 5 rsADA collateral, USE)
3. Click "Lock Collateral & Mint"
4. Nautilus signs 3 TXs: Create → Mint → Deliver
5. Option tokens appear in wallet

**Blockers for testing:**
- `OPTION_CONTRACT_ERGOTREE` is a placeholder — needs the actual deployed V2 contract ErgoTree hex
- `DAPP_UI_FEE_TREE` is zeroed — needs a real fee collection address (or set fee to 0)
- `CONTRACT_ADDRESSES` in core config is empty — needs production contract address for scanner/market

### What you need to provide before testing:
1. **Contract ErgoTree hex** — compile OptionReserveV2.es with production constants (exercise window = 720) and get the ErgoTree
2. **Contract address** — derive from the ErgoTree
3. **FixedPriceSellV2 ErgoTree** — compile the updated stablecoin-based sell contract
4. **Fee address** — your P2PK address for dApp UI fees (or set to 0n for testing)

### Quick test without deploying new contracts:
You could test against the existing test deployment (exercise window = 5 blocks) if you still have that contract address. Just add it to `CONTRACT_ADDRESSES` in `packages/core/src/config.ts`.

---

## What's NOT Done Yet

### Frontend
- [ ] Option chain doesn't populate from on-chain data (shows generated strikes only)
- [ ] Market page empty until CONTRACT_ADDRESSES populated
- [ ] Portfolio doesn't match tokens against reserves yet
- [ ] Exercise flow UI exists but isn't wired to TX building
- [ ] No ErgoPay (mobile QR) support
- [ ] No price charts (Lightweight Charts / TradingView)
- [ ] Responsive mobile layout not optimized
- [ ] Settings page not built

### Contracts
- [ ] FixedPriceSellV2 (stablecoin-priced) needs audit + mainnet test
- [ ] BuyTokenRequestV2 (stablecoin bid) needs audit + mainnet test
- [ ] Production OptionReserveV2 deployment (exercise window = 720)

### Bot
- [ ] TX signing works but untested against live contract addresses
- [ ] Activity feed TX classifier is a stub

### Data
- [ ] Stats bar shows 0s (needs on-chain reserves to aggregate)
- [ ] OI / IV rank on asset cards not populated
- [ ] No 24h volume tracking (needs TX scanning or event logging)

---

## File Count Summary

| Package | Files | Purpose |
|---------|-------|---------|
| `packages/core/src/` | 15 | TX builders, pricing, config |
| `packages/web/src/` | ~40 | Next.js frontend |
| `packages/bot/src/` | 8 | Scanner daemon |
| **Total** | **~63** | |

---

## To Deploy to Vercel

1. Connect GitHub repo to Vercel
2. Set env vars: `ERGO_NODE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build command: `cd packages/core && npx tsc && cd ../web && npx next build`
4. Output dir: `packages/web/.next`

---

## To Run Bot

```bash
cd packages/bot
ERGO_NODE=http://localhost:9053 CONTRACT_ADDRESSES=addr1,addr2 npm start
```
