import Link from "next/link";
import Image from "next/image";
import { LandingNav } from "./components/LandingNav";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-lines" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="dot" />
              Live on Ergo Mainnet
            </div>
            <h1>Contracts carved <em>in code</em></h1>
            <p className="hero-sub">
              Decentralized options on Ergo. Write calls and puts on crypto, commodities,
              and indices — peer-to-peer or through permissionless liquidity pools. Physical
              delivery of real tokens. Cash settlement in stablecoins. No
              intermediaries. No databases. Just contracts.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="btn-launch">Start Trading &rarr;</Link>
              <a href="#learn" className="btn-secondary">Learn Options</a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-label">Markets</span>
                <span className="stat-value">16+ <span className="unit">assets</span></span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Settlement</span>
                <span className="stat-value">SigUSD <span className="unit">/ USE</span></span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Products</span>
                <span className="stat-value">2 <span className="unit">modes</span></span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Off-chain Gates</span>
                <span className="stat-value">0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO PRODUCTS */}
      <section className="products-section" id="products">
        <div className="container">
          <div className="section-tag">Two Products</div>
          <h2>P2P today. Pooled liquidity <em>next</em>.</h2>
          <p className="section-desc">
            Two ways to trade options, both fully decentralized. No admin keys, no databases,
            no offline decision points. Smart contracts on-chain, settlement bots anyone can run.
          </p>
          <div className="products-grid">
            {/* P2P */}
            <div className="product-card">
              <div className="product-badge badge-live"><span className="badge-dot" /> Live Now</div>
              <h3>EtchaP2P</h3>
              <p className="product-subtitle">Peer-to-peer options marketplace</p>
              <p className="product-desc">
                {"Writers create option contracts by locking collateral \u2014 the underlying asset (rsETH, ERG, DexyGold) for physical calls, or stablecoins (SigUSD/USE) for puts and cash-settled options. Each option is minted as a standard Ergo token. Buyers purchase tokens and exercise against the reserve."}
              </p>
              <div className="product-features">
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Writer sets strike, expiry, type (call/put), settlement mode</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Collateral locked in ErgoScript reserve box</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Option tokens minted and delivered to writer</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Writer lists tokens at chosen premium</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Any holder can exercise against the reserve</div>
              </div>
              <div className="product-diagram">
                <span className="hl">Writer</span> &rarr; locks collateral (rsToken or stablecoin)<br />
                <span className="grn">Contract</span> &rarr; Definition &rarr; Mint &rarr; Deliver<br />
                <span className="blu">Buyer</span> &rarr; purchases option tokens<br />
                <span className="hl">Exercise</span> &rarr; reserve pays out, collateral moves
              </div>
            </div>
            {/* P2Pool */}
            <div className="product-card">
              <div className="product-badge badge-next"><span className="badge-dot" /> In Development</div>
              <h3>EtchaPool</h3>
              <p className="product-subtitle">Liquidity pool writes the contracts</p>
              <p className="product-desc">
                LPs deposit into a pool that automatically writes option contracts. Any wallet can
                buy options from the pool. Off-chain bots (permissionless, anyone can operate)
                handle pricing and settlement. No central operator.
              </p>
              <div className="product-features">
                <div className="pf-item"><span className="pf-icon">&rarr;</span>LPs deposit capital into a pool that automatically writes and prices options</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Pool writes options, earns premiums</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Buyers purchase directly from pool</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Off-chain bots handle settlement — anyone can run them</div>
                <div className="pf-item"><span className="pf-icon">&rarr;</span>Zero databases, zero admin keys, zero gates</div>
              </div>
              <div className="product-diagram">
                <span className="prp">LP</span> &rarr; deposits to pool<br />
                <span className="grn">Pool contract</span> &rarr; writes options<br />
                <span className="blu">Buyer</span> &rarr; purchases from pool<br />
                <span className="prp">Bot</span> &rarr; settles (permissionless)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SETTLEMENT */}
      <section className="settle-section">
        <div className="container">
          <div className="section-tag">Settlement</div>
          <h2>Premiums and strikes in stablecoins.</h2>
          <p className="section-desc">
            {"Strike prices denominated in stablecoins \u2014 SigUSD or USE, writer's choice. Physical options deliver the real asset. Cash options pay stablecoin profit. No ERG volatility risk on your strike price."}
          </p>
          <div className="settle-grid">
            <div className="settle-card">
              <h3>SigUSD</h3>
              <p>{"Ergo's original algorithmic stablecoin backed by the SigmaUSD protocol. Battle-tested since 2021, collateralized by ERG reserves in the AgeUSD protocol."}</p>
              <span className="token-tag">ALGORITHMIC</span>
            </div>
            <div className="settle-card">
              <h3>USE</h3>
              <p>{"Ergo's newer USD stablecoin from the USE Protocol. Algorithmic stabilization with active market operations. Growing liquidity across Ergo DEXes."}</p>
              <span className="token-tag">ALGORITHMIC</span>
            </div>
            <div className="settle-card">
              <h3>Why Stablecoins?</h3>
              <p>{"Options are already complex instruments. Settling in a volatile asset like ERG adds a second layer of price risk that obscures P&L. Stablecoin settlement means your profit/loss is exactly what the contract says."}</p>
              <span className="token-tag">USD-DENOMINATED</span>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section className="markets-section" id="markets">
        <div className="container">
          <div className="section-tag">Markets</div>
          <h2>Every asset class. One protocol.</h2>
          <p className="section-desc">
{"Physical options lock the real asset \u2014 Rosen Bridge tokens, native ERG, or DexyGold for physical delivery. Stablecoins for cash settlement. The oracle determines settlement."}
          </p>
          <div className="market-categories">
            <div className="market-category">
              <h3>Crypto — Physical Settlement</h3>
              <p className="cat-desc">Writer locks the underlying asset. Buyer receives it from the reserve at exercise.</p>
              <div className="market-grid">
                <div className="market-chip"><span className="ticker">ETH</span><span className="type-badge type-physical">rsETH</span></div>
                <div className="market-chip"><span className="ticker">BTC</span><span className="type-badge type-physical">rsBTC</span></div>
                <div className="market-chip"><span className="ticker">BNB</span><span className="type-badge type-physical">rsBNB</span></div>
                <div className="market-chip"><span className="ticker">DOGE</span><span className="type-badge type-physical">rsDOGE</span></div>
                <div className="market-chip"><span className="ticker">ADA</span><span className="type-badge type-physical">rsADA</span></div>
                <div className="market-chip"><span className="ticker">ERG</span><span className="type-badge type-physical">Native</span></div>
              </div>
            </div>
            <div className="market-category">
              <h3>Crypto — Cash Settlement in SigUSD / USE</h3>
              <p className="cat-desc">Oracle determines payout. Writer locks stablecoins. No underlying changes hands.</p>
              <div className="market-grid">
                <div className="market-chip"><span className="ticker">HNS</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">CKB</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">ATOM</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">FIRO</span><span className="type-badge type-cash">Cash</span></div>
              </div>
            </div>
            <div className="market-category">
              <h3>Commodities — Physical Delivery</h3>
              <p className="cat-desc">Writer locks the underlying token. Buyer receives it from the reserve at exercise.</p>
              <div className="market-grid">
                <div className="market-chip"><span className="ticker">GOLD</span><span className="type-badge type-physical">DexyGold</span></div>
              </div>
            </div>
            <div className="market-category">
              <h3>Commodities &amp; Metals — Cash Settlement</h3>
              <p className="cat-desc">Silver, crude, natgas — oracle-fed, stablecoin-settled.</p>
              <div className="market-grid">
                <div className="market-chip"><span className="ticker">SILVER</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">COPPER</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">BRENT</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">WTI</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">NATGAS</span><span className="type-badge type-cash">Cash</span></div>
              </div>
            </div>
            <div className="market-category">
              <h3>Indices — Cash Settlement</h3>
              <p className="cat-desc">Major equity indices, denominated in USD stablecoins.</p>
              <div className="market-grid">
                <div className="market-chip"><span className="ticker">S&amp;P 500</span><span className="type-badge type-cash">Cash</span></div>
                <div className="market-chip"><span className="ticker">DJI</span><span className="type-badge type-cash">Cash</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW P2P WORKS */}
      <section className="how-section" id="how">
        <div className="container">
          <div className="section-tag">How EtchaP2P Works</div>
          <h2>Three moves. Fully on-chain.</h2>
          <p className="section-desc">
            {"No orderbooks, no market makers, no intermediaries. Writers lock collateral into ErgoScript reserve boxes \u2014 the underlying asset for physical options, stablecoins for cash-settled. Buyers receive tokenized options they can hold, trade, or exercise."}
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">01 — WRITE</div>
              <h3>Etch the contract</h3>
              <p>
                {"Choose asset, strike price, expiration, type, and settlement mode. Lock collateral \u2014 the underlying asset for physical calls (rsETH, ERG, DexyGold), or stablecoins for puts and cash-settled options. The reserve box holds everything until exercise or expiry."}
              </p>
              <div className="step-diagram">
                <span className="hl">Writer</span> deposits collateral &rarr;<br />
                Definition box created on-chain &rarr;<br />
                <span className="grn">Mint TX</span> &rarr; option tokens created &rarr;<br />
                Deliver TX &rarr; tokens sent to writer
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">02 — TRADE</div>
              <h3>Buy the print</h3>
              <p>
                {"Buy them peer-to-peer on Etcha. Hold, transfer, or exercise \u2014 they're standard Ergo tokens in your wallet, composable with any Ergo dApp."}
              </p>
              <div className="step-diagram">
                <span className="hl">Buyer</span> pays premium &rarr;<br />
                Receives option token &rarr;<br />
                Can hold, sell, or exercise<br />
                <span className="grn">Fully transferable</span>
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">03 — SETTLE</div>
              <h3>Exercise or expire</h3>
              <p>
                At expiration, exercise ITM options. Physical: pay stablecoin to the reserve, receive the underlying asset (rsETH, ERG, DexyGold). Cash: receive stablecoin payout based on oracle price. OTM options expire; collateral returns to writer.
              </p>
              <div className="step-diagram">
                <span className="grn">In the money?</span><br />
                &rarr; Physical call: pay strike in SigUSD, receive rsToken<br />
                &rarr; Cash: receive stablecoin profit<br />
                <span className="hl">Expired OTM?</span> Collateral &rarr; Writer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section className="learn-section" id="learn">
        <div className="container">
          <div className="section-tag">Learn</div>
          <h2>New to options?</h2>
          <p className="section-desc">
            Options give you the right — but not the obligation — to buy or sell an asset at a set
            price before a set date. {"They're"} the most versatile instrument in finance. {"Here's"}
            everything you need to start.
          </p>
          <div className="learn-grid">
            <Link href="/learn/calls-and-puts" className="learn-card">
              <div className="learn-icon">&#9680;</div>
              <h3>Calls &amp; Puts: The Two Sides</h3>
              <p>
                A <strong>call</strong> gives the right to buy at the strike — profit when price goes
                up. A <strong>put</strong> gives the right to sell — profit when price goes down.
                Writers take the opposite side and earn premium upfront. {"The buyer's"} max loss is
                the premium paid; {"the writer's"} max loss is the collateral locked.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
            <Link href="/learn/premiums" className="learn-card">
              <div className="learn-icon">&#11041;</div>
              <h3>Premiums: What Options Cost</h3>
              <p>
                The premium is what buyers pay writers for the contract. {"It's"} driven by three
                forces: <strong>intrinsic value</strong> (how far in-the-money),{" "}
                <strong>time value</strong> (longer expiry = more expensive), and{" "}
                <strong>volatility</strong> (wilder price swings = more expensive). On Etcha,
                premiums are denominated in stablecoins.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
            <Link href="/learn/writing-options" className="learn-card">
              <div className="learn-icon">&#8862;</div>
              <h3>Writing Options: Earning Yield</h3>
              <p>
                Writers lock collateral and collect premiums — like being a landlord of financial
                contracts. <strong>Covered calls</strong> on tokens you already hold generate income
                in flat markets. <strong>Cash-secured puts</strong> let you get paid to wait for
                your target buy price. Both strategies work on Etcha.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
            <Link href="/learn/settlement" className="learn-card">
              <div className="learn-icon">&#9672;</div>
              <h3>Physical vs. Cash Settlement</h3>
              <p>
                <strong>Physical settlement</strong> means the writer locks the actual underlying asset (rsETH, ERG, DexyGold) as collateral. At exercise, the buyer pays stablecoin and receives the asset directly from the reserve. <strong>Cash settlement</strong> means the writer locks stablecoins and the oracle determines the payout. Both modes, same smart contracts.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
            <Link href="/learn/hedging" className="learn-card">
              <div className="learn-icon">&#8856;</div>
              <h3>Hedging: Protecting Your Bags</h3>
              <p>
                Holding ERG but worried about a drawdown? Buy a put to lock in a floor price. Want
                gold exposure but scared of a dip before you buy? Buy a call to cap your entry
                price. Options let you <strong>define your worst case</strong> in advance for a known cost.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
            <Link href="/learn/why-on-chain" className="learn-card">
              <div className="learn-icon">&#11042;</div>
              <h3>Why On-Chain Options?</h3>
              <p>
                Traditional options need brokers, clearinghouses, margin accounts, and KYC. DeFi
                options replace all of that with smart contracts: collateral is locked
                programmatically, settlement is trustless, and <strong>anyone can participate</strong>
                {" "}— write, buy, or provide liquidity. No permission needed.
              </p>
              <span className="learn-link">Read guide &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="arch-section">
        <div className="container">
          <div className="section-tag">Architecture</div>
          <h2>No admin keys. No kill switches.</h2>
          <p className="section-desc">
            Etcha is designed so that once deployed, it runs without any team intervention. Every
            component is either on-chain code or a permissionless off-chain bot that anyone can operate.
          </p>
          <div className="arch-grid">
            <div className="arch-card">
              <h3>ErgoScript Contracts</h3>
              <p>All option logic — collateral locking, exercise conditions, expiration, settlement — lives in ErgoScript smart contracts. Immutable once deployed. No proxy patterns, no upgrade keys.</p>
            </div>
            <div className="arch-card">
              <h3>Oracle-Powered Settlement</h3>
              <p>{"Strike prices and settlement values come from Ergo's decentralized oracle pools. Crypto, commodities, and indices — all verifiable on-chain. No single-source dependency."}</p>
            </div>
            <div className="arch-card">
              <h3>Permissionless Bots</h3>
              <p>{"Open-source bots handle the operational plumbing \u2014 minting tokens, delivering to writers, closing expired contracts. Anyone can run one. If the team disappears tomorrow, the protocol still works."}</p>
            </div>
            <div className="arch-card">
              <h3>Rosen Bridge Assets</h3>
              <p>{"Write options on any token Rosen Bridge has brought to Ergo \u2014 rsETH, rsBTC, rsADA, rsBNB, rsDOGE. The bridge brings assets on-chain; the option contract holds them as collateral. Real tokens, not synthetics."}</p>
            </div>
            <div className="arch-card">
              <h3>UTXO Composability</h3>
              <p>{"Standard Ergo tokens \u2014 composable with any dApp in the ecosystem as liquidity grows. Built on Ergo's UTXO model for maximum interoperability."}</p>
            </div>
            <div className="arch-card">
              <h3>No Accounts. No KYC.</h3>
              <p>{"Connect Nautilus. Trade. That's it. No registration, no custodians, no identity verification. Your keys, your contracts, your settlement."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="compare-section" id="compare">
        <div className="container">
          <div className="section-tag">Landscape</div>
          <h2>How Etcha compares</h2>
          <p className="section-desc">
            Most DeFi options protocols are vault-based or orderbook-based, crypto-only, and rely
            on centralized components. Etcha is different on every axis.
          </p>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Chain</th>
                <th>Architecture</th>
                <th>Commodities</th>
                <th>Physical Settlement</th>
                <th>Stablecoin Settle</th>
                <th>Permissionless</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-etcha">
                <td>Etcha</td>
                <td>Ergo</td>
                <td>P2P + Pool</td>
                <td><span className="check">&#10003;</span></td>
                <td><span className="check">&#10003;</span> rsTokens</td>
                <td><span className="check">&#10003;</span> SigUSD/USE</td>
                <td><span className="check">&#10003;</span> Fully</td>
              </tr>
              <tr>
                <td>Derive</td>
                <td>Arbitrum L2</td>
                <td>CLOB Orderbook</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="check">&#10003;</span> USDC</td>
                <td><span className="cross">—</span> Gated</td>
              </tr>
              <tr>
                <td>Aevo</td>
                <td>Aevo L2</td>
                <td>Hybrid Orderbook</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="check">&#10003;</span> USDC</td>
                <td><span className="cross">—</span> NFT Pass</td>
              </tr>
              <tr>
                <td>Panoptic</td>
                <td>Ethereum</td>
                <td>Uniswap V3 LP</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="check">&#10003;</span></td>
              </tr>
              <tr>
                <td>Stryke</td>
                <td>Arbitrum</td>
                <td>SSOV Vaults</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
              </tr>
              <tr>
                <td>Premia/Kyan</td>
                <td>Arbitrum</td>
                <td>AMM + OB</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="check">&#10003;</span></td>
                <td><span className="cross">—</span></td>
              </tr>
              <tr>
                <td>{"SigmaO \u2020"}</td>
                <td>Ergo</td>
                <td>P2P</td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span></td>
                <td><span className="cross">—</span> ERG only</td>
                <td><span className="check">&#10003;</span></td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "16px", fontFamily: "'DM Mono', monospace" }}>
            &dagger; SigmaO — discontinued. Etcha P2P contracts are modeled on the SigmaO architecture.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="section-tag">Get Started</div>
          <h2>Etch your <em>edge</em></h2>
          <p className="section-desc">
            Connect Nautilus. Write your first contract. No registration, no approval, no databases.
            Just code and stablecoins.
          </p>
          <div className="cta-actions">
            <Link href="/app" className="btn-launch">Launch App &rarr;</Link>
            <a href="/learn/calls-and-puts" className="btn-secondary">Learn Options</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div>
              <Link href="/" className="nav-logo" style={{ marginBottom: "8px" }}>
                <Image src="/etcha-logo.svg" alt="Etcha — Options etched on-chain" width={180} height={52} />
              </Link>
              <p className="footer-copy">Decentralized options on Ergo</p>
            </div>
            <ul className="footer-links">
              <li><a href="/learn/calls-and-puts">Learn</a></li>
              <li><a href="https://github.com/cannonQ" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://t.me/eraborea" target="_blank" rel="noopener noreferrer">Telegram</a></li>
            </ul>
            <p className="footer-copy">etcha.io — $ETCH</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
