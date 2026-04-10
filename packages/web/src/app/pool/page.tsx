import type { Metadata } from "next";
import { LandingNav } from "../components/LandingNav";
import { LandingFooter } from "../components/LandingFooter";
import "../landing.css";
import "./pool.css";

export const metadata: Metadata = {
  title: "EtchaPool — LP Bootstrapping Proposal | Etcha",
  description:
    "Deposit USE stablecoin. The pool writes covered options across the Rosen Bridge ecosystem. LPs earn the net of premiums collected minus payouts — no custody, no operator, no KYC.",
};

export default function PoolProposalPage() {
  return (
    <>
      <div className="landing landing-chrome">
        <LandingNav />
      </div>

      <div className="pool-proposal">
        <div className="page">
        {/* HERO */}
        <div className="hero">
          <div className="eyebrow">EtchaPool · Community Liquidity Proposal · April 2026</div>
          <h1>
            The first permissionless
            <br />
            <span
              style={{
                fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif",
                fontStyle: "italic",
                color: "rgba(240,237,230,0.4)",
              }}
            >
              options pool on Ergo
            </span>
          </h1>
          <p className="hero-sub">
            {"Deposit USE stablecoin. The pool writes covered options across the Rosen Bridge ecosystem. LPs earn the net of premiums collected minus payouts — no custody, no operator, no KYC."}
          </p>
          <div className="hero-stats">
            <div className="hs">
              <span className="hs-num">~17.5%</span>
              <span className="hs-label">Avg ann. yield (all Rosen assets)</span>
            </div>
            <div className="hs">
              <span className="hs-num">1.27</span>
              <span className="hs-label">Avg Sharpe ratio</span>
            </div>
            <div className="hs">
              <span className="hs-num">4.2 yrs</span>
              <span className="hs-label">Backtest period</span>
            </div>
            <div className="hs">
              <span className="hs-num">9</span>
              <span className="hs-label">Launch assets</span>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="section">
          <h2>How it works</h2>
          <p>The pool runs a covered options writing strategy. Six steps, fully on-chain:</p>
          <div className="steps" style={{ marginTop: "1.1rem" }}>
            <div className="step">
              <span className="step-num">01</span>
              <p>LPs deposit USE stablecoin into a smart contract</p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <p>An autonomous bot writes European cash-settled options on oracle feeds — ERG, BTC, ETH, ADA, DOGE, BNB, CKB, FIRO, HNS</p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <p>
                Each option is priced at <strong style={{ color: "var(--text)" }}>130% of Black-Scholes fair value</strong>
                {" "}— the 30% markup is the pool&apos;s structural edge, enforced on-chain. The contract refuses any option priced below this floor.
              </p>
            </div>
            <div className="step">
              <span className="step-num">04</span>
              <p>Option buyers pay premium upfront in USE</p>
            </div>
            <div className="step">
              <span className="step-num">05</span>
              <p>
                At expiry, the pool pays out on in-the-money options and keeps the premium on the rest. Settlement uses a{" "}
                <strong style={{ color: "var(--text)" }}>70/30 spot/TWAP blend</strong> to dampen flash-pump exploitation.
              </p>
            </div>
            <div className="step">
              <span className="step-num">06</span>
              <p>Net premium income accrues to LP token value. Deposit or withdraw at any time.</p>
            </div>
          </div>

          <div className="callout" style={{ marginTop: "1.25rem" }}>
            <p>
              <strong style={{ color: "var(--green)" }}>Why 130% and not higher?</strong>
              {" "}At 200% markup the exercise rate drops to 8% — buyers stop returning and the market dies. At 130%, the exercise rate is ~25–30%. Buyers get fair enough pricing to sustain demand; the pool retains structural edge over thousands of cycles. The markup was determined by backtesting 40,320 parameter combinations — not set arbitrarily.
            </p>
          </div>
        </div>

        {/* BACKTEST PERFORMANCE */}
        <div className="section">
          <h2>Backtested performance</h2>
          <p>
            4.2 years of daily data (Jan 2022 – Mar 2026), $50K USE pool equivalent, 130% B-S markup, 70/30 TWAP blend, 7–14 day expiries, tight ATM strike ladder. The test period includes crypto bear markets, flash crashes, and sustained rallies across all assets.
          </p>

          <div className="stat-grid" style={{ marginTop: "1.25rem" }}>
            <div className="sc"><div className="sc-num">~17.5%</div><div className="sc-label">Weighted avg return</div></div>
            <div className="sc"><div className="sc-num">1.27</div><div className="sc-label">Avg Sharpe</div></div>
            <div className="sc"><div className="sc-num">~25%</div><div className="sc-label">Avg exercise rate</div></div>
            <div className="sc"><div className="sc-num">40,320</div><div className="sc-label">Param combos tested</div></div>
            <div className="sc"><div className="sc-num">100%</div><div className="sc-label">Configs profitable</div></div>
          </div>

          {/* Rosen mainnet */}
          <div className="section-bar" style={{ marginTop: "1.75rem" }}>
            Rosen Bridge mainnet assets · calls + puts · launch day
          </div>
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Status</th>
                <th>Ann. Return</th>
                <th>Sharpe</th>
                <th>Max DD</th>
                <th>Exercise Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>ERG</td><td><span className="tag tag-live">Launch</span></td><td className="ret">19.0%</td><td>1.56</td><td>6.3%</td><td>29.1%</td></tr>
              <tr><td>DOGE</td><td><span className="tag tag-live">Launch</span></td><td className="ret">16.1%</td><td>1.26</td><td>7.3%</td><td>24.2%</td></tr>
              <tr><td>ADA</td><td><span className="tag tag-live">Launch</span></td><td className="ret">14.4%</td><td>1.13</td><td>6.2%</td><td>29.1%</td></tr>
              <tr><td>ETH</td><td><span className="tag tag-live">Launch</span></td><td className="ret">11.9%</td><td>1.15</td><td>7.7%</td><td>20.5%</td></tr>
              <tr><td>BNB</td><td><span className="tag tag-live">Launch</span></td><td className="ret">10.0%</td><td>1.27</td><td>5.0%</td><td>12.6%</td></tr>
              <tr><td>BTC</td><td><span className="tag tag-live">Launch</span></td><td className="ret">9.4%</td><td>1.54</td><td>5.1%</td><td>13.9%</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.4rem" }}>
            Average: 13.5% annualized · 1.32 Sharpe
          </p>

          {/* Rosen pending */}
          <div className="section-bar section-bar-purple" style={{ marginTop: "1.5rem" }}>
            Rosen Bridge pending assets · calls only · imminent bridge mainnet
          </div>
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Status</th>
                <th>Ann. Return (calls only)</th>
                <th>Sharpe</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>CKB</td><td><span className="tag tag-calls">Calls only</span></td><td className="ret-blue">27.2%</td><td>1.47</td><td>Puts auto-enabled by trend gate when stable</td></tr>
              <tr><td>FIRO</td><td><span className="tag tag-calls">Calls only</span></td><td className="ret-blue">25.8%</td><td>0.84</td><td>Calls-only at launch</td></tr>
              <tr><td>HNS</td><td><span className="tag tag-calls">Calls only</span></td><td className="ret-blue">23.7%</td><td>1.18</td><td>Calls-only at launch</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.4rem" }}>
            Average: 25.6% annualized · 1.16 Sharpe · Calls-only returns are high because these assets experienced 5–49× price drawdowns during the test period — selling calls into a downtrend expires worthless at an exceptional rate. Puts are disabled until price stabilization.
          </p>

          {/* Future */}
          <div className="section-bar" style={{ marginTop: "1.5rem", borderLeftColor: "#444" }}>
            Cosmos Bridge assets · future listing · pending bridge mainnet
          </div>
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Status</th>
                <th>Ann. Return</th>
                <th>Sharpe</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ATOM</td>
                <td><span className="tag tag-future">Future</span></td>
                <td style={{ fontFamily: "var(--font-dm-mono), 'DM Mono', monospace", color: "#555" }}>13.1%</td>
                <td style={{ color: "#555" }}>0.98</td>
                <td style={{ color: "#555" }}>Pending Cosmos bridge mainnet</td>
              </tr>
              <tr>
                <td>RON</td>
                <td><span className="tag tag-future">Future</span></td>
                <td style={{ fontFamily: "var(--font-dm-mono), 'DM Mono', monospace", color: "#555" }}>23.3% (calls only)</td>
                <td style={{ color: "#555" }}>1.36</td>
                <td style={{ color: "#555" }}>Pending Cosmos bridge mainnet</td>
              </tr>
            </tbody>
          </table>

          <div className="callout callout-warn" style={{ marginTop: "1.5rem" }}>
            <p>
              <strong style={{ color: "var(--amber)" }}>Honest caveat:</strong>
              {" "}The backtest uses daily close prices and misses intraday spikes real buyers would exercise against. Real-world returns are likely 10–30% lower than backtested figures. The 50% fill rate assumption is untested against real buyer demand. Adverse selection (informed buyers) is not modeled — the 130% markup is the buffer, but it doesn&apos;t eliminate the risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>

        {/* COMPARISON */}
        <div className="section">
          <h2>How it compares</h2>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Est. Return</th>
                <th>Risk</th>
                <th>Liquidity</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Hold stablecoin (SigUSD/USE)</td><td>0%</td><td>Low</td><td>High</td></tr>
              <tr><td>Ergo DeFi lending</td><td>3–8%</td><td>Low–Med</td><td>Medium</td></tr>
              <tr className="highlight">
                <td><strong>EtchaPool (this)</strong></td>
                <td><strong style={{ color: "var(--green)" }}>~14–18%</strong></td>
                <td><strong>Med</strong></td>
                <td><strong>Medium</strong></td>
              </tr>
              <tr><td>Leveraged yield farming</td><td>10–30%</td><td>High</td><td>Low–Med</td></tr>
              <tr><td>Crypto spot holding</td><td>Volatile</td><td>High</td><td>High</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.5rem" }}>
            Comparison returns are illustrative estimates. EtchaPool return range represents the 6-asset Rosen mainnet basket average (13.5%) weighted toward higher-vol assets including Rosen pending.
          </p>
        </div>

        {/* ROSEN BRIDGE ANGLE */}
        <div className="section">
          <h2>Why this is Rosen Bridge infrastructure</h2>
          <div className="callout callout-blue">
            <p>
              <strong style={{ color: "var(--blue)" }}>Every asset that bridges to Ergo gains an instant options market.</strong>
              {" "}The pool is designed as infrastructure for the Rosen Bridge ecosystem, not a standalone yield product. As bridge adoption grows and new assets reach mainnet, the pool adds them to its writing set — without LPs needing to provide new capital. The addressable market scales automatically with the bridge.
            </p>
          </div>
          <p style={{ marginTop: "1rem" }}>
            CKB, FIRO, and HNS are in active Rosen Bridge testing with mainnet release imminent. Offering options on day one of bridge mainnet launch creates a compelling reason to move liquidity through Ergo. These are the first native options markets for these tokens anywhere.
          </p>
        </div>

        {/* LP MECHANICS */}
        <div className="section">
          <h2>LP mechanics</h2>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="mechanic-row"><span className="mechanic-label">Deposit token</span><span className="mechanic-val">USE stablecoin</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Receive</span><span className="mechanic-val">LP tokens at current NAV price</span></div>
            <div className="mechanic-row"><span className="mechanic-label">LP token price</span><span className="mechanic-val">Pool NAV ÷ circulating supply</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Yield mechanism</span><span className="mechanic-val">LP token appreciates as premiums accrue</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Minimum deposit</span><span className="mechanic-val">10 USE</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Lockup</span><span className="mechanic-val">None — withdraw anytime</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Withdrawal constraint</span><span className="mechanic-val">5% minimum liquid reserve (contract-enforced). Worst case: up to 2-week wait if reserve is fully deployed into options.</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Withdrawal fees</span><span className="mechanic-val">Network transaction costs only</span></div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            LP tokens are burned on withdrawal and USE is returned at current NAV. There is no admin key that can pause the pool, freeze withdrawals, or change the rules. The contract is immutable once deployed.
          </p>
        </div>

        {/* PROTOCOL FEE */}
        <div className="section">
          <h2>Protocol fee</h2>
          <p>
            A <strong style={{ color: "var(--text)" }}>10% fee on collected premiums</strong> routes to a developer LP position each time an option is purchased from the pool. This is the only compensation mechanism for the protocol developer.
          </p>

          <div className="card" style={{ margin: "1.25rem 0" }}>
            <div className="mechanic-row"><span className="mechanic-label">Fee basis</span><span className="mechanic-val">10% of premium at point of sale — not on unsold options, not on principal</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Mechanism</span><span className="mechanic-val">PoolFixedPriceSell.es routes 10% of sale price to mint LP tokens to dev wallet</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Dev wallet</span><span className="mechanic-val">2-of-3 multisig — frozen at deployment, key compromise does not brick fee collection</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Fee rate</span><span className="mechanic-val">Compile-time constant — cannot be changed without full redeployment and new pool address</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Enforcement</span><span className="mechanic-val">Deploy path verifies pool options use PoolFixedPriceSell.es — buyers cannot route around the fee</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Dev LP lock</span><span className="mechanic-val">Public commitment: dev multisig will not withdraw while pool has active options. On-chain balance is auditable by anyone at any time.</span></div>
            <div className="mechanic-row"><span className="mechanic-label">Dilution note</span><span className="mechanic-val">As dev LP grows, user share of total NAV compresses proportionally — equivalent to a continuous fee taken via dilution</span></div>
            <div className="mechanic-row"><span className="mechanic-label">LP return after fee</span><span className="mechanic-val">~12–18% (backtest range, weighted by asset mix)</span></div>
          </div>

          <div className="callout">
            <p>
              <strong style={{ color: "var(--green)" }}>Why fee-at-sale, not fee-at-deploy.</strong>
              {" "}The pool only earns when options are actually purchased. Collecting a dev fee on options that never sell would dilute LPs for zero benefit to anyone. <code>PoolFixedPriceSell.es</code> ensures the fee is only triggered when real premium hits the pool — dev earns when LPs earn, nothing otherwise.
            </p>
          </div>

          <div className="callout callout-warn" style={{ marginTop: "0.75rem" }}>
            <p>
              <strong style={{ color: "var(--amber)" }}>Transparency commitment.</strong>
              {" "}The fee rate, dev multisig address, and all LP token minting events are visible on-chain from day one. The dev wallet balance and its share of pool NAV are public. The lock on dev LP withdrawal is a public commitment enforced by social accountability and on-chain visibility — not a contract guarantee in v1. A stricter on-chain lock is planned for v2.
            </p>
          </div>
        </div>

        {/* LAUNCH ROADMAP */}
        <div className="section">
          <h2>Where things stand</h2>
          <div className="phases">
            <div className="phase">
              <div className="pd done"></div>
              <div className="phase-meta">Live on mainnet</div>
              <div className="phase-title">EtchaP2P — peer-to-peer options</div>
              <p className="phase-body">
                16+ assets, physical and cash settlement, SigUSD/USE denominated. Full educational front-end and writing wizard. Permissionless settlement bots. All Rosen L1s accessible.
              </p>
            </div>
            <div className="phase">
              <div className="pd done"></div>
              <div className="phase-meta">Complete</div>
              <div className="phase-title">EtchaPool contracts + backtest</div>
              <p className="phase-body">
                PoolState.es, PoolOptionReserve.es, OptionEscrow.es, ProxyDeposit.es, ProxyWithdraw.es — all written and audited. 40,320-combination backtest complete. V6+V7 contract fixes (required for micro-price assets CKB, HNS) in progress before deployment.
              </p>
            </div>
            <div className="phase">
              <div className="pd active"></div>
              <div className="phase-meta">In progress — bootstrap target</div>
              <div className="phase-title">MM Bot testing + pool deployment</div>
              <p className="phase-body">
                Market-making bot framework complete — needs end-to-end mainnet testing. Pool deployment pending V6+V7 backport and initial liquidity seed. etcha.io DNS migration on this milestone.
              </p>
            </div>
            <div className="phase">
              <div className="pd next"></div>
              <div className="phase-meta">Phase 2</div>
              <div className="phase-title">Multi-feed expansion + trend gate</div>
              <p className="phase-body">
                Rosen pending assets (CKB, FIRO, HNS) added as calls-only on bridge mainnet. On-chain directional trend gate shipped — automatically enables puts per-asset once price stabilization is observed. No manual intervention.
              </p>
            </div>
            <div className="phase">
              <div className="pd next"></div>
              <div className="phase-meta">Future</div>
              <div className="phase-title">Cosmos Bridge assets + longer tranches</div>
              <p className="phase-body">
                ATOM and RON added once Cosmos bridge (degens.world) reaches mainnet. Multi-TWAP companion box enables 30-day options tranche.
              </p>
            </div>
          </div>
        </div>

        {/* BOOTSTRAP ASK */}
        <div className="section">
          <h2>The ask</h2>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-hi)",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              margin: "1rem 0",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                marginBottom: "0.5rem",
              }}
            >
              Bootstrap target
            </div>
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: "3.2rem",
                color: "var(--green)",
                lineHeight: 1,
              }}
            >
              50,000 USE
            </div>
            <div style={{ fontSize: "0.83rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              Minimum viable pool · accepts SigUSD or USE · no maximum
            </div>
          </div>
          <p>
            {"The backtest was run on a $50K pool — that's the number that produces the figures above. A smaller seed works but generates proportionally lower absolute premium volume. This is not a grant: depositors receive LP tokens, earn yield, and can withdraw. The ask is for initial TVL, not development funds."}
          </p>
        </div>

        {/* TRUST STACK */}
        <div className="section">
          <h2>The trust stack</h2>
          <div className="trust-stack">
            <div className="trust-item">
              <span className="trust-num">1</span>
              <div className="trust-body">
                <h3>Ergo blockchain</h3>
                <p>Consensus, censorship resistance, UTXO finality.</p>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-num">2</span>
              <div className="trust-body">
                <h3>Multi-operator oracle</h3>
                <p>21 price feeds, bonded operator keys, median aggregation. No single-source dependency. Oracle code is open source.</p>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-num">3</span>
              <div className="trust-body">
                <h3>P2Pool smart contracts</h3>
                <p>
                  All capital-affecting operations are fully permissionless and verified on-chain. Only one spend path (parameter update) requires an operator signature — and it cannot touch LP capital. No admin key, no kill switch, no upgrade proxy. Once deployed, frozen.
                </p>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-num" style={{ color: "var(--muted)" }}>—</span>
              <div className="trust-body">
                <h3 style={{ color: "var(--muted)" }}>No one else</h3>
                <p>
                  There is no DAO vote, no multisig, no centralized admin. If the team disappears tomorrow, existing options continue to exercise and expire normally. New deployments need a running bot — anyone can run one.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RISKS */}
        <div className="section">
          <h2>Risks</h2>
          <div className="card-grid">
            <div className="card">
              <h3>Market risk</h3>
              <p style={{ fontSize: "0.86rem" }}>
                Sharp moves outpacing TWAP dampening can cause the pool to pay out more than collected premiums. Historical backtest worst-case drawdown: ~7.7% (ETH). Conservative per-feed exposure limits are the primary mitigation.
              </p>
            </div>
            <div className="card">
              <h3>Adverse selection</h3>
              <p style={{ fontSize: "0.86rem" }}>
                {"Informed buyers with better short-term directional views will buy options more likely to pay out. The 130% markup is the structural buffer — it raises buyer break-even but does not eliminate the risk."}
              </p>
            </div>
            <div className="card">
              <h3>Smart contract risk</h3>
              <p style={{ fontSize: "0.86rem" }}>
                Contracts completed two-pass automated audit with all critical issues resolved. No external firm audit yet. Bugs could result in partial or total loss of funds. Codebase is fully open source.
              </p>
            </div>
            <div className="card">
              <h3>Withdrawal timing</h3>
              <p style={{ fontSize: "0.86rem" }}>
                If reserve is fully deployed into options, withdrawals above the 5% liquid floor are queued until options expire. Worst case: up to 2 weeks. Not triggered in any backtest scenario.
              </p>
            </div>
            <div className="card">
              <h3>Oracle risk</h3>
              <p style={{ fontSize: "0.86rem" }}>
                Wrong oracle prices produce wrong settlements. The oracle is multi-operator and bonded, but not immune to operator collusion or source compromise. TWAP blend provides partial protection against short-duration manipulation.
              </p>
            </div>
            <div className="card">
              <h3>Protocol maturity</h3>
              <p style={{ fontSize: "0.86rem" }}>
                The pool has not been deployed on mainnet before. Early LPs take on protocol maturity risk. Initial deployment uses a small seed while monitoring before opening to larger deposits.
              </p>
            </div>
          </div>
        </div>

        {/* DOCS */}
        <div className="section">
          <h2>Further reading</h2>
          <div className="card" style={{ padding: "1rem 1.25rem" }}>
            <div className="mechanic-row">
              <span className="mechanic-label">Live app</span>
              <span className="mechanic-val">
                <a href="https://ergo-p2p-options-frontend-web.vercel.app" target="_blank" rel="noopener noreferrer">
                  ergo-p2p-options-frontend-web.vercel.app
                </a>
              </span>
            </div>
            <div className="mechanic-row">
              <span className="mechanic-label">GitHub</span>
              <span className="mechanic-val">
                <a href="https://github.com/cannonQ/ergo-p2p-options-frontend" target="_blank" rel="noopener noreferrer">
                  github.com/cannonQ/ergo-p2p-options-frontend
                </a>
              </span>
            </div>
            <div className="mechanic-row">
              <span className="mechanic-label">Diligence pack</span>
              <span className="mechanic-val">POOL-DILIGENCE.md — contract architecture, audit summary, full backtest methodology, known limitations</span>
            </div>
            <div className="mechanic-row">
              <span className="mechanic-label">Community</span>
              <span className="mechanic-val">Degens.world · Ergo Discord · Ergo Forum</span>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.75rem" }}>
            This document is for informational purposes only and does not constitute investment advice. Backtested performance is hypothetical. Cryptocurrency derivatives carry significant risk including potential total loss of principal. Do your own research.
          </p>
        </div>

          <div className="pool-footer">
            <p>Etcha · etcha.io · April 2026</p>
            <p>Degens.world</p>
          </div>
        </div>
      </div>

      <div className="landing landing-chrome">
        <LandingFooter />
      </div>
    </>
  );
}
