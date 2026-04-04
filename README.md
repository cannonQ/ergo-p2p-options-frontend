# Etcha — P2P Options on Ergo

Write and trade options on any oracle-tracked asset, settled on-chain with no intermediary.

Physical delivery (rsADA, rsBTC, rsETH, DexyGold, ERG) and cash settlement (USE/SigUSD) against the AVL Multi-Oracle Pool — 21 feeds covering crypto, commodities, and indices.

---

## Quick Start

### Frontend

```bash
pnpm install
pnpm --filter web dev          # http://localhost:3005
```

### Bot (scanner daemon)

```bash
source ~/.secrets               # provides BOT_MNEMONIC
pnpm --filter bot start
```

The bot watches the mempool and chain for pending option boxes and automatically handles mint, deliver, and close transactions. Anyone can run it — it is permissionless and cannot steal funds.

---

## Project Structure

```
packages/
  core/    Fleet SDK TX builders, Black-Scholes pricing, contract config
  web/     Next.js 14 frontend (port 3005)
  bot/     Node.js scanner daemon (auto-mint, deliver, close)
```

Monorepo managed with pnpm workspaces.

---

## Key Features

- **One-signature write flow** — writer signs once; the bot handles mint + deliver + auto-list automatically
- **V5 auto-list** — option tokens go directly into a FixedPriceSell order on delivery
- **American and European styles** — American options exercisable any time before expiry; European only at maturity
- **Black-Scholes premium estimation** — uses on-chain oracle volatility from the companion box
- **ErgoPay support** — QR code signing for mobile wallets (Ergo Wallet, Terminus)
- **Multi-buyer exercise** — any wallet holding option tokens can exercise against the reserve

---

## Documentation

| Document | Description |
|----------|-------------|
| [HOW-ETCHA-WORKS.md](HOW-ETCHA-WORKS.md) | End-to-end explanation of the protocol |
| [TX-ANATOMY-GUIDE.md](TX-ANATOMY-GUIDE.md) | Input/output structure of every transaction type |
| [FEE-REVIEW.md](FEE-REVIEW.md) | Fee structure and analysis |
| [V5-UPGRADE-PLAN.md](V5-UPGRADE-PLAN.md) | Auto-list delivery mode design |
| [BETA-LAUNCH-CHECKLIST.md](BETA-LAUNCH-CHECKLIST.md) | Pre-launch verification checklist |
| [BOT-PROTOCOL.md](BOT-PROTOCOL.md) | Scanner daemon behavior and safety guarantees |

---

## Contract Versions

| Version | Status | Change |
|---------|--------|--------|
| V2 | Superseded | Core lifecycle — create, mint, deliver, exercise, close |
| V3 | Superseded | Burn verification to prevent double-exercise |
| V4 | Proven on mainnet | Non-decimal rate fix for Gold and rsADA |
| V5 | **Active** | Auto-list delivery — tokens go directly to sell order |

Contract source and deployment details: [p2p-options-contracts](https://github.com/cannonQ/p2p-options-contracts)

---

## Environment

- Node.js 18+
- pnpm 8+
- Ergo node at `localhost:9053`
- Bot mnemonic: `BOT_MNEMONIC` env var (from `~/.secrets`)
- Fee address: `9ewpUXoFqTomiiAxkj7P5x1FLvQ5Ldsn95XZiTpJaVpgUr3VZeS`

---

## License

AGPL-3.0 — see [LICENSE](LICENSE).
