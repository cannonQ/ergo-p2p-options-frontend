import type { Metadata } from "next";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Callout from "../components/Callout";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata: Metadata = {
  title: "Hedging — Protecting Your Bags | Etcha Learn",
  description:
    "Options aren't just for speculation. Learn how protective puts, collars, and real-world asset hedging work on Etcha.",
};

export default function HedgingPage() {
  return (
    <>
      <LessonHeader current={5} />
      <h1>Hedging — Protecting Your Bags</h1>
      <p className="subtitle">
        Options aren&apos;t just for speculation. Their original purpose is
        insurance — paying a known premium today to define your worst case
        tomorrow. On Etcha, you can hedge crypto, commodities, and indices.
      </p>

      {/* SECTION 1: INSURANCE METAPHOR HERO */}
      <section>
        <div className="section-label">The Metaphor</div>
        <h2>Options Are Insurance</h2>
        <p className="section-text">
          You pay a premium for protection you hope you&apos;ll never use. If
          the bad thing happens, you&apos;re covered. If it doesn&apos;t,
          you&apos;re out the premium. Both home insurance and put options work
          this way.
        </p>

        <div className="side-by-side">
          <div
            className="side-card"
            style={{ borderColor: "rgba(240,160,64,0.3)" }}
          >
            <div className="sc-title" style={{ color: "var(--lp-copper)" }}>
              Home Insurance
            </div>
            <strong>Pay premium</strong> → Protected if house burns
            <br />
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Cost:</span> Annual
            premium
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Protection:</span>{" "}
            Rebuilding cost covered
            <br />
            <span style={{ color: "var(--lp-muted)" }}>
              If nothing happens:
            </span>{" "}
            You&apos;re out the premium
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Why pay:</span> You
            sleep at night
          </div>
          <div
            className="side-card"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="sc-title" style={{ color: "var(--lp-green)" }}>
              Put Option
            </div>
            <strong>Pay premium</strong> → Protected if price crashes
            <br />
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Cost:</span> Option
            premium (SigUSD)
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Protection:</span> Floor
            on your portfolio
            <br />
            <span style={{ color: "var(--lp-muted)" }}>
              If nothing happens:
            </span>{" "}
            You&apos;re out the premium
            <br />
            <span style={{ color: "var(--lp-muted)" }}>Why pay:</span> Your
            bags have a floor
          </div>
        </div>
      </section>

      {/* SECTION 2: PROTECTIVE PUT DIAGRAM */}
      <section>
        <div className="section-label">Strategy 1</div>
        <h2>Protective Put — A Floor Under Your Holdings</h2>
        <p className="section-text">
          You hold ERG and buy a put to cap your downside. Your portfolio can
          still rise with no limit, but the put creates a floor — the worst case
          is defined.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 420"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid5a"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="800" height="420" fill="url(#grid5a)" />

            {/* Axes */}
            <line
              x1="100"
              y1="40"
              x2="100"
              y2="320"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            <line
              x1="100"
              y1="200"
              x2="720"
              y2="200"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.5"
            />

            <text
              x="90"
              y="30"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              P&amp;L
            </text>
            <text
              x="90"
              y="205"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0
            </text>
            <text
              x="420"
              y="350"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              ERG Price at Expiry →
            </text>

            {/* Strike line */}
            <line
              x1="320"
              y1="40"
              x2="320"
              y2="320"
              stroke="#388bfd"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x="326"
              y="52"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              put strike $0.25
            </text>

            {/* Layer 1: ERG holdings alone */}
            <line
              x1="100"
              y1="310"
              x2="700"
              y2="60"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text
              x="660"
              y="72"
              fill="rgba(255,255,255,0.3)"
              fontFamily="Courier New"
              fontSize="9"
            >
              ERG only
            </text>

            {/* Layer 2: Combined portfolio with put (the "floor") */}
            {/* Flat section (below strike -- loss capped) */}
            <path
              d="M100,260 L320,260"
              stroke="#3fb950"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Rising section (above strike -- unlimited upside minus premium) */}
            <path
              d="M320,260 L700,80"
              stroke="#3fb950"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Floor annotation */}
            <rect
              x="110"
              y="240"
              width="200"
              height="16"
              rx="2"
              fill="rgba(63,185,80,0.08)"
            />
            <text
              x="210"
              y="252"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              ← THE FLOOR — max loss capped here
            </text>

            {/* Premium cost gap annotation */}
            <line
              x1="420"
              y1="145"
              x2="420"
              y2="165"
              stroke="#f0a040"
              strokeWidth="1"
            />
            <text
              x="426"
              y="150"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              premium cost
            </text>
            <text
              x="426"
              y="162"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              (gap from ERG-only line)
            </text>

            {/* Max loss annotation */}
            <line
              x1="140"
              y1="200"
              x2="140"
              y2="260"
              stroke="#f85149"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x="146"
              y="235"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
            >
              max loss:
            </text>
            <text
              x="146"
              y="247"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
            >
              $500 + 200 = $700
            </text>

            {/* Breakeven */}
            <line
              x1="380"
              y1="192"
              x2="380"
              y2="208"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            <text
              x="386"
              y="218"
              fill="rgba(255,255,255,0.4)"
              fontFamily="Courier New"
              fontSize="9"
            >
              breakeven
            </text>

            {/* Legend */}
            <line
              x1="140"
              y1="380"
              x2="160"
              y2="380"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text
              x="166"
              y="384"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              ERG only (no hedge)
            </text>
            <line
              x1="340"
              y1="380"
              x2="360"
              y2="380"
              stroke="#3fb950"
              strokeWidth="2.5"
            />
            <text
              x="366"
              y="384"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              ERG + protective put
            </text>

            {/* Example box */}
            <rect
              x="480"
              y="365"
              width="280"
              height="42"
              rx="4"
              fill="rgba(56,139,253,0.06)"
              stroke="rgba(56,139,253,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="620"
              y="382"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              10,000 ERG at $0.30 + $0.25 put
            </text>
            <text
              x="620"
              y="398"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Premium: 200 SigUSD · Floor: $0.25
            </text>
          </svg>
        </Graphic>

        <p className="section-text">
          You hold 10,000 ERG at $0.30. You buy a $0.25 put for 200 SigUSD.
          Your worst case: $500 unrealized loss + 200 premium = $700 maximum.
          Without the put? Unlimited downside if ERG collapses.
        </p>
      </section>

      {/* SECTION 3: COLLAR STRATEGY */}
      <section>
        <div className="section-label">Strategy 2 — Advanced</div>
        <h2>Collar — Floor and Ceiling</h2>
        <p className="section-text">
          Own the asset + buy a put (floor) + sell a call (ceiling). Your P&amp;L
          is &quot;banded&quot; — limited downside AND limited upside. The call
          premium can offset the put cost, making the net cost near zero.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 380"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid5b"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="800" height="380" fill="url(#grid5b)" />

            {/* Axes */}
            <line
              x1="100"
              y1="40"
              x2="100"
              y2="300"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            <line
              x1="100"
              y1="180"
              x2="720"
              y2="180"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.5"
            />
            <text
              x="90"
              y="30"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              P&amp;L
            </text>
            <text
              x="90"
              y="185"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0
            </text>

            {/* Put strike (floor) */}
            <line
              x1="260"
              y1="40"
              x2="260"
              y2="300"
              stroke="#3fb950"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            <text
              x="266"
              y="52"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              put strike (floor)
            </text>

            {/* Call strike (ceiling) */}
            <line
              x1="500"
              y1="40"
              x2="500"
              y2="300"
              stroke="#f0a040"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            <text
              x="506"
              y="52"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              call strike (ceiling)
            </text>

            {/* Collar combined P&L */}
            {/* Floor (flat left of put strike) */}
            <path
              d="M100,240 L260,240"
              stroke="#388bfd"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Rising middle section */}
            <path
              d="M260,240 L500,120"
              stroke="#388bfd"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Ceiling (flat right of call strike) */}
            <path
              d="M500,120 L700,120"
              stroke="#388bfd"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Banded zone fill */}
            <rect
              x="100"
              y="120"
              width="620"
              height="120"
              fill="rgba(56,139,253,0.04)"
              stroke="none"
            />

            {/* Annotations */}
            <text
              x="160"
              y="232"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              ↑ FLOOR
            </text>
            <text
              x="160"
              y="248"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Can&apos;t lose more
            </text>

            <text
              x="580"
              y="115"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              ↓ CEILING
            </text>
            <text
              x="580"
              y="131"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Can&apos;t gain more
            </text>

            <text
              x="380"
              y="175"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
            >
              ↕ Banded zone
            </text>

            {/* ERG alone for reference */}
            <line
              x1="100"
              y1="290"
              x2="700"
              y2="60"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text
              x="660"
              y="72"
              fill="rgba(255,255,255,0.2)"
              fontFamily="Courier New"
              fontSize="9"
            >
              ERG only
            </text>

            {/* Net cost annotation */}
            <rect
              x="260"
              y="320"
              width="300"
              height="40"
              rx="4"
              fill="rgba(56,139,253,0.06)"
              stroke="rgba(56,139,253,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="410"
              y="338"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              Net cost can be near $0
            </text>
            <text
              x="410"
              y="354"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              if call premium offsets put cost
            </text>
          </svg>
        </Graphic>

        <p className="section-text">
          You give up moonshots to eliminate crash risk. The collar is zero-cost
          (or near it) when the call premium you collect equals the put premium
          you pay. It&apos;s the &quot;I just want to survive the bear
          market&quot; strategy.
        </p>
      </section>

      {/* SECTION 4: NON-CRYPTO HEDGING */}
      <section>
        <div className="section-label">Beyond Crypto</div>
        <h2>Hedging Real-World Assets on Etcha</h2>
        <p className="section-text">
          Etcha isn&apos;t limited to crypto. Oracle price feeds enable
          cash-settled options on commodities and indices — all settled in
          SigUSD, no brokerage required.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            {/* Gold */}
            <rect
              x="30"
              y="20"
              width="230"
              height="80"
              rx="5"
              fill="rgba(240,160,64,0.04)"
              stroke="rgba(240,160,64,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="145"
              y="44"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              Gold Put
            </text>
            <text
              x="145"
              y="62"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Worried gold will drop
            </text>
            <text
              x="145"
              y="78"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              before you sell?
            </text>
            <text
              x="145"
              y="93"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              → Buy a gold put on Etcha
            </text>

            {/* Oil */}
            <rect
              x="285"
              y="20"
              width="230"
              height="80"
              rx="5"
              fill="rgba(63,185,80,0.04)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="400"
              y="44"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              WTI Call
            </text>
            <text
              x="400"
              y="62"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Think oil will spike?
            </text>
            <text
              x="400"
              y="78"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Hedge against fuel costs.
            </text>
            <text
              x="400"
              y="93"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              → Buy a WTI call on Etcha
            </text>

            {/* S&P 500 */}
            <rect
              x="540"
              y="20"
              width="230"
              height="80"
              rx="5"
              fill="rgba(56,139,253,0.04)"
              stroke="rgba(56,139,253,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="655"
              y="44"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              S&amp;P 500 Put
            </text>
            <text
              x="655"
              y="62"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Hedge your equity
            </text>
            <text
              x="655"
              y="78"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              portfolio on-chain.
            </text>
            <text
              x="655"
              y="93"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              → Settled in SigUSD
            </text>

            {/* Bottom note */}
            <text
              x="400"
              y="140"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              All settled in SigUSD via oracle price feeds. No brokerage. No
              KYC. No physical delivery.
            </text>
            <text
              x="400"
              y="160"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              Commodities and indices are always cash-settled — you can&apos;t
              deliver gold bars on-chain.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 5: COST OF INSURANCE TABLE */}
      <section>
        <div className="section-label">Tradeoffs</div>
        <h2>Cost of Insurance — Picking Your Floor</h2>
        <p className="section-text">
          The closer your floor is to the current price, the more expensive the
          protection. Deeper out-of-the-money puts are cheaper but only kick in
          after a bigger drop.
        </p>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th>Put Strike (Spot: $0.30)</th>
                <th>Premium</th>
                <th>Protection Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">$0.28 — 7% OTM</td>
                <td style={{ color: "var(--lp-green)" }}>Low</td>
                <td>
                  Less protection, cheaper. Only kicks in on a 7%+ drop.
                </td>
              </tr>
              <tr>
                <td className="row-label">$0.25 — 17% OTM</td>
                <td style={{ color: "var(--lp-copper)" }}>Medium</td>
                <td>Moderate floor. Reasonable for longer-term holds.</td>
              </tr>
              <tr>
                <td className="row-label">$0.30 — ATM</td>
                <td style={{ color: "var(--lp-red)" }}>High</td>
                <td>
                  Full floor at current price. Maximum protection, maximum cost.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout variant="amber" label="The Tradeoff">
          Deeper OTM = cheaper premium, but higher deductible. ATM = full
          protection, but expensive. Choose based on how much drawdown you can
          tolerate before the insurance kicks in.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Options let you define your worst case in advance for a known cost. The
          premium is the price of certainty. Protective puts create a floor
          under your holdings. Collars trade moonshot potential for crash
          protection. On Etcha, you can hedge crypto, gold, oil, and equities —
          all settled in SigUSD.
        </p>
      </Takeaway>

      <PageNav
        prev={{
          href: "/learn/settlement",
          title: "Physical vs. Cash Settlement",
        }}
        next={{
          href: "/learn/why-on-chain",
          title: "Why On-Chain Options?",
        }}
      />
    </>
  );
}
