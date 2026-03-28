import { Metadata } from "next";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Callout from "../components/Callout";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata: Metadata = {
  title: "Why On-Chain Options? | Etcha Learn",
  description:
    "Traditional options work, but intermediaries make them slow, expensive, and permission-gated. Learn what changes when you remove them with on-chain options on Ergo.",
};

export default function WhyOnChainPage() {
  return (
    <>
      <LessonHeader current={6} />
      <h1>Why On-Chain Options?</h1>
      <p className="subtitle">
        Traditional options work. They&apos;ve worked for decades. So why rebuild
        them on a blockchain? Because the intermediaries that make them
        &quot;work&quot; also make them slow, expensive, and permission-gated.
        Here&apos;s what changes when you remove them.
      </p>

      {/* SECTION 1: INTERMEDIARY STACK HERO */}
      <section>
        <div className="section-label">The Problem</div>
        <h2>Six Layers Between You and Your Trade</h2>
        <p className="section-text">
          In traditional finance, an option trade passes through a broker, a
          clearinghouse, an exchange, and a market maker before reaching a
          counterparty. Each layer adds fees, delays, counterparty risk, and KYC
          requirements.
        </p>

        <Graphic>
          <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
              <pattern id="grid6a" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
              <marker id="arrD" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#f85149" strokeWidth="0.8" />
              </marker>
              <marker id="arrE" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#3fb950" strokeWidth="0.8" />
              </marker>
            </defs>
            <rect width="800" height="400" fill="url(#grid6a)" />

            {/* TRADFI STACK (top) */}
            <text x="400" y="24" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="10" letterSpacing="2">TRADITIONAL FINANCE</text>

            {/* You */}
            <rect x="30" y="45" width="80" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.3)" strokeWidth="0.5" />
            <text x="70" y="70" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="10">You</text>
            <line x1="110" y1="65" x2="140" y2="65" stroke="#f85149" strokeWidth="0.8" markerEnd="url(#arrD)" />

            {/* Broker */}
            <rect x="145" y="45" width="90" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.15)" strokeWidth="0.5" />
            <text x="190" y="62" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="9">Broker</text>
            <text x="190" y="76" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="8">fee + KYC</text>
            <line x1="235" y1="65" x2="265" y2="65" stroke="#f85149" strokeWidth="0.8" markerEnd="url(#arrD)" />

            {/* Clearinghouse */}
            <rect x="270" y="45" width="110" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.15)" strokeWidth="0.5" />
            <text x="325" y="62" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="9">Clearinghouse</text>
            <text x="325" y="76" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="8">verification · delay</text>
            <line x1="380" y1="65" x2="410" y2="65" stroke="#f85149" strokeWidth="0.8" markerEnd="url(#arrD)" />

            {/* Exchange */}
            <rect x="415" y="45" width="90" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.15)" strokeWidth="0.5" />
            <text x="460" y="62" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="9">Exchange</text>
            <text x="460" y="76" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="8">fee</text>
            <line x1="505" y1="65" x2="535" y2="65" stroke="#f85149" strokeWidth="0.8" markerEnd="url(#arrD)" />

            {/* Market Maker */}
            <rect x="540" y="45" width="110" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.15)" strokeWidth="0.5" />
            <text x="595" y="62" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="9">Market Maker</text>
            <text x="595" y="76" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="8">spread</text>
            <line x1="650" y1="65" x2="680" y2="65" stroke="#f85149" strokeWidth="0.8" markerEnd="url(#arrD)" />

            {/* Counterparty */}
            <rect x="685" y="45" width="90" height="40" rx="4" fill="#161b22" stroke="rgba(248,81,73,0.3)" strokeWidth="0.5" />
            <text x="730" y="70" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="9">Counterparty</text>

            {/* Layer count */}
            <text x="400" y="110" textAnchor="middle" fill="#f85149" fontFamily="Courier New" fontSize="11">6 layers  ·  4+ fees  ·  next-day settlement  ·  KYC required  ·  market hours only</text>

            {/* Divider */}
            <line x1="40" y1="140" x2="760" y2="140" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <text x="400" y="160" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">vs.</text>

            {/* ETCHA STACK (bottom) */}
            <text x="400" y="195" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="10" letterSpacing="2">ETCHA ON ERGO</text>

            {/* You */}
            <rect x="160" y="215" width="120" height="50" rx="4" fill="rgba(63,185,80,0.05)" stroke="rgba(63,185,80,0.3)" strokeWidth="1" />
            <text x="220" y="238" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="12">You</text>
            <text x="220" y="254" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="9">self-custody wallet</text>
            <line x1="280" y1="240" x2="340" y2="240" stroke="#3fb950" strokeWidth="1.5" markerEnd="url(#arrE)" />

            {/* ErgoScript */}
            <rect x="345" y="215" width="140" height="50" rx="4" fill="rgba(56,139,253,0.06)" stroke="rgba(56,139,253,0.3)" strokeWidth="1" strokeDasharray="4 2" />
            <text x="415" y="238" textAnchor="middle" fill="#388bfd" fontFamily="Courier New" fontSize="12">ErgoScript</text>
            <text x="415" y="254" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">smart contract</text>
            <line x1="485" y1="240" x2="540" y2="240" stroke="#3fb950" strokeWidth="1.5" markerEnd="url(#arrE)" />

            {/* Counterparty */}
            <rect x="545" y="215" width="120" height="50" rx="4" fill="rgba(63,185,80,0.05)" stroke="rgba(63,185,80,0.3)" strokeWidth="1" />
            <text x="605" y="238" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="12">Counterparty</text>
            <text x="605" y="254" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="9">P2P peer</text>

            <text x="400" y="300" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="11">2 layers  ·  network fee only  ·  instant settlement  ·  no KYC  ·  24/7/365</text>

            {/* Honest caveat */}
            <rect x="120" y="330" width="560" height="40" rx="4" fill="rgba(240,160,64,0.06)" stroke="rgba(240,160,64,0.15)" strokeWidth="0.5" />
            <text x="400" y="348" textAnchor="middle" fill="#f0a040" fontFamily="Courier New" fontSize="10">The tradeoff: no guaranteed counterparty. You set the price; no one is obligated to buy.</text>
            <text x="400" y="362" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">P2P liquidity is the cost of removing intermediaries.</text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 2: SELF-CUSTODY */}
      <section>
        <div className="section-label">Ownership</div>
        <h2>Your Option Is a Token in Your Wallet</h2>

        <div className="side-by-side">
          <div className="side-card" style={{ borderColor: "rgba(248,81,73,0.3)" }}>
            <div className="sc-title" style={{ color: "var(--lp-red)" }}>TradFi</div>
            &quot;Your option is a number in their database&quot;<br /><br />
            <span style={{ color: "var(--lp-muted)" }}>Custody:</span> Broker holds it<br />
            <span style={{ color: "var(--lp-muted)" }}>Access:</span> Market hours only<br />
            <span style={{ color: "var(--lp-muted)" }}>Risk:</span> Broker insolvency, freezes, deplatforming<br />
            <span style={{ color: "var(--lp-muted)" }}>Portability:</span> Transfer between brokers takes days
          </div>
          <div className="side-card" style={{ borderColor: "rgba(63,185,80,0.3)" }}>
            <div className="sc-title" style={{ color: "var(--lp-green)" }}>Etcha</div>
            &quot;Your option is a token in your wallet&quot;<br /><br />
            <span style={{ color: "var(--lp-muted)" }}>Custody:</span> You hold it (Nautilus wallet)<br />
            <span style={{ color: "var(--lp-muted)" }}>Access:</span> 24/7/365<br />
            <span style={{ color: "var(--lp-muted)" }}>Risk:</span> Smart contract risk only<br />
            <span style={{ color: "var(--lp-muted)" }}>Portability:</span> Transfer = send a token
          </div>
        </div>
      </section>

      {/* SECTION 3: PERMISSIONLESS SETTLEMENT */}
      <section>
        <div className="section-label">Resilience</div>
        <h2>The Protocol Survives Without the Team</h2>
        <p className="section-text">
          Anyone can submit the expiry transaction and earn a small reward for
          processing it. Settlement is enforced by the contract — no admin keys,
          no team dependency. The protocol works even if the Etcha team disappears
          tomorrow.
        </p>

        <Graphic>
          <svg viewBox="0 0 800 160" xmlns="http://www.w3.org/2000/svg" fill="none">
            {/* Three settlement actors */}
            <rect x="60" y="30" width="180" height="60" rx="5" fill="rgba(63,185,80,0.05)" stroke="rgba(63,185,80,0.2)" strokeWidth="0.5" />
            <text x="150" y="55" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="11">Anyone can settle</text>
            <text x="150" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">Submit expiry TX</text>

            <rect x="310" y="30" width="180" height="60" rx="5" fill="rgba(63,185,80,0.05)" stroke="rgba(63,185,80,0.2)" strokeWidth="0.5" />
            <text x="400" y="55" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="11">Earn a small reward</text>
            <text x="400" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">Incentive to participate</text>

            <rect x="560" y="30" width="180" height="60" rx="5" fill="rgba(56,139,253,0.05)" stroke="rgba(56,139,253,0.2)" strokeWidth="0.5" />
            <text x="650" y="55" textAnchor="middle" fill="#388bfd" fontFamily="Courier New" fontSize="11">Contract enforces it</text>
            <text x="650" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">No admin keys needed</text>

            <text x="400" y="120" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="11">No team required for settlement. No admin keys. No database.</text>
            <text x="400" y="140" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="11">The smart contract holds collateral and enforces every rule.</text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 4: UTXO ADVANTAGE */}
      <section>
        <div className="section-label">Architecture</div>
        <h2>Each Option Is Its Own Box</h2>
        <p className="section-text">
          On Ergo, value lives in individual &quot;boxes&quot; (called UTXOs)
          rather than in shared accounts. Each option contract is its own
          isolated box — not a shared pool. One bad trade can&apos;t trigger a
          chain reaction that wipes out other users, and physical delivery is
          native to the model.
        </p>

        <Graphic>
          <svg viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg" fill="none">
            {/* Individual boxes */}
            <rect x="50" y="30" width="130" height="80" rx="5" fill="rgba(63,185,80,0.04)" stroke="rgba(63,185,80,0.2)" strokeWidth="0.5" />
            <text x="115" y="55" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="10">ERG $0.35 Call</text>
            <text x="115" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">isolated box</text>
            <text x="115" y="88" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">own collateral</text>

            <rect x="210" y="30" width="130" height="80" rx="5" fill="rgba(240,160,64,0.04)" stroke="rgba(240,160,64,0.2)" strokeWidth="0.5" />
            <text x="275" y="55" textAnchor="middle" fill="#f0a040" fontFamily="Courier New" fontSize="10">rsETH $2K Put</text>
            <text x="275" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">isolated box</text>
            <text x="275" y="88" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">own collateral</text>

            <rect x="370" y="30" width="130" height="80" rx="5" fill="rgba(56,139,253,0.04)" stroke="rgba(56,139,253,0.2)" strokeWidth="0.5" />
            <text x="435" y="55" textAnchor="middle" fill="#388bfd" fontFamily="Courier New" fontSize="10">Gold $2800 Call</text>
            <text x="435" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">isolated box</text>
            <text x="435" y="88" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">own collateral</text>

            <rect x="530" y="30" width="130" height="80" rx="5" fill="rgba(63,185,80,0.04)" stroke="rgba(63,185,80,0.2)" strokeWidth="0.5" />
            <text x="595" y="55" textAnchor="middle" fill="#3fb950" fontFamily="Courier New" fontSize="10">WTI $70 Put</text>
            <text x="595" y="72" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">isolated box</text>
            <text x="595" y="88" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="9">own collateral</text>

            {/* No shared risk annotation */}
            <text x="400" y="140" textAnchor="middle" fill="#e6edf3" fontFamily="Courier New" fontSize="11">No shared pool of risk (unlike AMM-based options)</text>
            <text x="400" y="158" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">Each UTXO box is composable, isolated, and can hold rsTokens directly.</text>
            <text x="400" y="176" textAnchor="middle" fill="#7d8590" fontFamily="Courier New" fontSize="10">Physical delivery is native to the model — not an afterthought.</text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 5: COMPARISON TABLE */}
      <section>
        <div className="section-label">Comparison</div>
        <h2>Etcha vs. TradFi vs. Other DeFi Options</h2>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Feature</th>
                <th>TradFi Broker</th>
                <th>Other DeFi</th>
                <th style={{ color: "var(--lp-green)" }}>Etcha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Self-custody</td>
                <td className="cross">✗</td>
                <td className="partial">Partial</td>
                <td className="check">✓</td>
              </tr>
              <tr>
                <td className="row-label">No KYC</td>
                <td className="cross">✗</td>
                <td className="check">✓</td>
                <td className="check">✓</td>
              </tr>
              <tr>
                <td className="row-label">Physical delivery</td>
                <td className="check">✓ (traditional)</td>
                <td className="cross">✗</td>
                <td className="check">✓ (via Rosen)</td>
              </tr>
              <tr>
                <td className="row-label">Permissionless settlement</td>
                <td className="cross">✗</td>
                <td className="partial">Partial</td>
                <td className="check">✓</td>
              </tr>
              <tr>
                <td className="row-label">Stablecoin settlement</td>
                <td className="check">✓</td>
                <td className="check">✓</td>
                <td className="check">✓</td>
              </tr>
              <tr>
                <td className="row-label">P2P (no AMM pool)</td>
                <td className="cross">✗</td>
                <td className="partial">Partial</td>
                <td className="check">✓</td>
              </tr>
              <tr style={{ background: "rgba(240,160,64,0.04)" }}>
                <td className="row-label">Guaranteed counterparty</td>
                <td className="check">✓</td>
                <td className="check">✓ (pool)</td>
                <td className="cross">✗ (P2P tradeoff)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout variant="amber" label="The Honest Tradeoff">
          The last row matters. TradFi and pool-based DeFi guarantee that someone
          is on the other side of every trade. Etcha&apos;s P2P model does not. You
          set your price; no one is obligated to buy.{" "}
          <strong>
            Guaranteed liquidity is the one thing intermediaries provide that Etcha
            does not.
          </strong>{" "}
          We name this tradeoff openly.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          On-chain options trade intermediary convenience for self-custody and
          permissionlessness. Your option is a token you hold, not a row in a
          broker&apos;s database. The contract enforces every rule — no team
          required. The tradeoff is P2P liquidity: you set your price, but no one
          is obligated to buy.
        </p>
      </Takeaway>

      <PageNav
        prev={{ href: "/learn/hedging", title: "Hedging" }}
        next={{ href: "/learn/calls-and-puts", title: "Start Learning: Calls & Puts" }}
      />
    </>
  );
}
