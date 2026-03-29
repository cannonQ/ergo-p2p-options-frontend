import { Metadata } from "next";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Callout from "../components/Callout";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata: Metadata = {
  title: "Writing Options — Earning Premium | Etcha Learn",
  description:
    "Writers are the supply side of options. They lock collateral, mint an option token, and list it for sale. Learn about covered calls, cash-secured puts, and the P2P writer lifecycle on Etcha.",
};

export default function WritingOptionsPage() {
  return (
    <>
      <LessonHeader current={3} />
      <h1>Writing Options — Earning Premium</h1>
      <p className="subtitle">
        Writers are the supply side of options. They lock collateral, mint an
        option token, and list it for sale. If a buyer appears, they collect a
        premium. If not, their collateral sits idle until expiry.
      </p>

      {/* SECTION 1: P2P WRITER'S FLOW (HERO) */}
      <section>
        <div className="section-label">The Writer&#39;s Journey</div>
        <h2>A Linear Flow, Not a Guaranteed Loop</h2>
        <p className="section-text">
          Writing on Etcha is not a &quot;set it and collect&quot; operation.
          It&#39;s a multi-step process where the critical variable — finding a
          buyer — is never guaranteed.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 420"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <marker
                id="arr"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#7d8590"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrG"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#3fb950"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrR"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#7d8590"
                  strokeWidth="1"
                />
              </marker>
            </defs>

            {/* STEP 1: Lock collateral */}
            <rect
              x="30"
              y="50"
              width="140"
              height="60"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="100"
              y="75"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Lock
            </text>
            <text
              x="100"
              y="92"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral
            </text>
            <line
              x1="170"
              y1="80"
              x2="200"
              y2="80"
              stroke="#7d8590"
              strokeWidth="1"
              markerEnd="url(#arr)"
            />

            {/* STEP 2: List option */}
            <rect
              x="205"
              y="50"
              width="140"
              height="60"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="275"
              y="75"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              List option
            </text>
            <text
              x="275"
              y="92"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              for sale
            </text>
            <line
              x1="345"
              y1="80"
              x2="375"
              y2="80"
              stroke="#7d8590"
              strokeWidth="1"
              markerEnd="url(#arr)"
            />

            {/* STEP 3: WAIT FOR BUYER */}
            <rect
              x="380"
              y="36"
              width="160"
              height="88"
              rx="5"
              fill="rgba(240,160,64,0.08)"
              stroke="#f0a040"
              strokeWidth="1.5"
            />
            <text
              x="460"
              y="62"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              Wait for
            </text>
            <text
              x="460"
              y="80"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              buyer
            </text>
            <text
              x="460"
              y="102"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              not guaranteed
            </text>

            {/* BRANCH A: Buyer found (green path) */}
            <line
              x1="540"
              y1="60"
              x2="590"
              y2="60"
              stroke="#3fb950"
              strokeWidth="1"
              markerEnd="url(#arrG)"
            />
            <rect
              x="595"
              y="30"
              width="170"
              height="60"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="680"
              y="55"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              Buyer purchases
            </text>
            <text
              x="680"
              y="72"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              Premium received ✓
            </text>

            {/* Continue green path down */}
            <line
              x1="680"
              y1="90"
              x2="680"
              y2="130"
              stroke="#3fb950"
              strokeWidth="1"
              markerEnd="url(#arrG)"
            />
            <rect
              x="595"
              y="135"
              width="170"
              height="50"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="680"
              y="157"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Option expires
            </text>
            <text
              x="680"
              y="173"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Oracle checks price
            </text>

            {/* Branch: OTM (writer wins) */}
            <line
              x1="640"
              y1="185"
              x2="600"
              y2="220"
              stroke="#3fb950"
              strokeWidth="1"
            />
            <rect
              x="490"
              y="220"
              width="180"
              height="50"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="580"
              y="240"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              Expires OTM
            </text>
            <text
              x="580"
              y="256"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              Keep collateral + premium ✓
            </text>

            {/* Branch: ITM (buyer exercises) */}
            <line
              x1="720"
              y1="185"
              x2="720"
              y2="220"
              stroke="#f0a040"
              strokeWidth="1"
            />
            <rect
              x="630"
              y="220"
              width="160"
              height="50"
              rx="5"
              fill="rgba(240,160,64,0.05)"
              stroke="rgba(240,160,64,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="710"
              y="240"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              Expires ITM
            </text>
            <text
              x="710"
              y="256"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              Collateral pays out
            </text>

            {/* BRANCH B: No buyer (gray path) */}
            <line
              x1="460"
              y1="124"
              x2="460"
              y2="160"
              stroke="#7d8590"
              strokeWidth="1"
              strokeDasharray="4 3"
              markerEnd="url(#arrR)"
            />
            <rect
              x="340"
              y="165"
              width="240"
              height="70"
              rx="5"
              fill="rgba(255,255,255,0.02)"
              stroke="var(--border-subtle)"
              strokeWidth="0.5"
            />
            <text
              x="460"
              y="190"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              No buyer appears
            </text>
            <text
              x="460"
              y="208"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Collateral locked, zero premium
            </text>
            <text
              x="460"
              y="224"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Wait for expiry → reclaim
            </text>

            {/* Bottom caveat */}
            <rect
              x="30"
              y="300"
              width="740"
              height="55"
              rx="4"
              fill="rgba(240,160,64,0.06)"
              stroke="rgba(240,160,64,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="50"
              y="320"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              ⚠ IMPORTANT
            </text>
            <text
              x="50"
              y="338"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Premium is collected only when a buyer purchases your option token.
              Collateral is locked at mint regardless.
            </text>
            <text
              x="50"
              y="348"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              The &quot;~80% expire worthless&quot; stat only applies to options
              that were actually sold.
            </text>

            {/* Stats label */}
            <text
              x="400"
              y="395"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Do NOT frame writing as guaranteed income. It is a P2P marketplace.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 2: COVERED CALL EXPLAINER */}
      <section>
        <div className="section-label">Strategy 1</div>
        <h2>Covered Call — Selling Upside You&#39;re Willing to Give Up</h2>
        <p className="section-text">
          You hold an asset and write a call against it. You earn premium in
          exchange for capping your upside. If the price stays below strike, you
          keep everything. If it rises past strike, you sell at that price — plus
          the premium.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <text
              x="400"
              y="18"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              Covered Call: 1000 ERG, $0.35 Strike, 5 SigUSD Premium
            </text>

            {/* Step 0: Buyer must exist */}
            <rect
              x="10"
              y="40"
              width="130"
              height="68"
              rx="5"
              fill="rgba(56,139,253,0.05)"
              stroke="rgba(56,139,253,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="75"
              y="62"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
              letterSpacing="1"
            >
              STEP 0
            </text>
            <text
              x="75"
              y="78"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer must
            </text>
            <text
              x="75"
              y="92"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              purchase first
            </text>

            <text
              x="155"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>

            {/* Step 1: Hold ERG */}
            <rect
              x="170"
              y="40"
              width="120"
              height="68"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="230"
              y="62"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              WALLET
            </text>
            <text
              x="230"
              y="80"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              1,000 ERG
            </text>
            <text
              x="230"
              y="96"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              spot: $0.29
            </text>

            <text
              x="305"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>

            {/* Step 2: Write + sold */}
            <rect
              x="320"
              y="40"
              width="140"
              height="68"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="390"
              y="62"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              SOLD
            </text>
            <text
              x="390"
              y="80"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.35 call written
            </text>
            <text
              x="390"
              y="96"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              +5 SigUSD ✓
            </text>

            <text
              x="475"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>
          </svg>
        </Graphic>

        <div className="panels-2col">
          <div className="panel panel-green">
            <div className="p-label">Price stays below $0.35</div>
            Keep 1,000 ERG + keep 5 SigUSD premium. Option expires worthless.
            Best case for the writer.
          </div>
          <div className="panel panel-amber">
            <div className="p-label">Price rises above $0.35</div>
            Sell ERG at $0.35 + keep 5 SigUSD. You miss the upside past $0.35.
            Capped, not a loss — amber.
          </div>
        </div>
        <div className="panel panel-gray" style={{ marginBottom: 16 }}>
          <div className="p-label">No buyer found</div>
          Keep 1,000 ERG. Earn nothing. Collateral locked until expiry, then
          reclaimed. Opportunity cost only.
        </div>
      </section>

      {/* SECTION 3: CASH-SECURED PUT EXPLAINER */}
      <section>
        <div className="section-label">Strategy 2</div>
        <h2>Cash-Secured Put — Get Paid to Wait for Your Price</h2>
        <p className="section-text">
          You have stablecoins and want to buy an asset at a lower price. You
          write a put, locking stablecoins as collateral. If the price drops to
          your target, you buy at that price — plus you kept the premium. If it
          doesn&#39;t, you keep the premium and your stablecoins.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <text
              x="400"
              y="18"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              Cash-Secured Put: 300 SigUSD, $0.25 Strike, 3 SigUSD Premium
            </text>

            <rect
              x="10"
              y="40"
              width="130"
              height="68"
              rx="5"
              fill="rgba(56,139,253,0.05)"
              stroke="rgba(56,139,253,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="75"
              y="62"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
              letterSpacing="1"
            >
              STEP 0
            </text>
            <text
              x="75"
              y="78"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer must
            </text>
            <text
              x="75"
              y="92"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              purchase first
            </text>

            <text
              x="155"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>

            <rect
              x="170"
              y="40"
              width="120"
              height="68"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="230"
              y="62"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              WALLET
            </text>
            <text
              x="230"
              y="80"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              300 SigUSD
            </text>
            <text
              x="230"
              y="96"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              target: $0.25
            </text>

            <text
              x="305"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>

            <rect
              x="320"
              y="40"
              width="140"
              height="68"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="390"
              y="62"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              SOLD
            </text>
            <text
              x="390"
              y="80"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.25 put written
            </text>
            <text
              x="390"
              y="96"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              +3 SigUSD ✓
            </text>

            <text
              x="475"
              y="78"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="14"
            >
              →
            </text>
          </svg>
        </Graphic>

        <div className="panels-2col">
          <div className="panel panel-green">
            <div className="p-label">Price stays above $0.25</div>
            Keep 300 SigUSD + keep 3 SigUSD premium. Put expires worthless.
            Pure income.
          </div>
          <div className="panel panel-green">
            <div className="p-label">Price drops below $0.25</div>
            Buy ERG at $0.25 (your target!) + keep 3 SigUSD premium. You wanted
            this price anyway.
          </div>
        </div>
        <div className="panel panel-gray" style={{ marginBottom: 16 }}>
          <div className="p-label">No buyer found</div>
          300 SigUSD remains locked. No premium earned. Reclaim at expiry.
          Opportunity cost of holding idle stablecoins.
        </div>

        <Callout variant="amber" label="Honest framing">
          &quot;Getting paid to wait for your target price&quot; only holds when
          a buyer exists. Without a buyer, your stablecoins are locked idle for
          the contract duration.
        </Callout>
      </section>

      {/* SECTION 4: WRITER'S RISK/REWARD MATRIX */}
      <section>
        <div className="section-label">Risk &amp; Reward</div>
        <h2>Writer&#39;s Risk/Reward Matrix</h2>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th></th>
                <th style={{ color: "#3fb950" }}>Covered Call</th>
                <th style={{ color: "#f0a040" }}>Cash-Secured Put</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Max profit</td>
                <td>Premium collected</td>
                <td>Premium collected</td>
              </tr>
              <tr>
                <td className="row-label">Max loss</td>
                <td>
                  Capped upside beyond strike (you still keep strike + premium)
                </td>
                <td>Full strike value minus premium (asset goes to zero)</td>
              </tr>
              <tr>
                <td className="row-label">Breakeven</td>
                <td>Spot price at entry − premium</td>
                <td>Strike − premium</td>
              </tr>
              <tr>
                <td className="row-label">Probability of profit</td>
                <td>Typically &gt;50% for OTM writes</td>
                <td>Typically &gt;50% for OTM writes</td>
              </tr>
              <tr>
                <td className="row-label">If no buyer</td>
                <td style={{ color: "var(--text-muted)" }}>
                  Collateral locked, zero income. No loss beyond opportunity
                  cost.
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  Stablecoins locked, zero income. No loss beyond opportunity
                  cost.
                </td>
              </tr>
              <tr>
                <td className="row-label">Collateral (Etcha)</td>
                <td>rsToken (physical) or SigUSD (cash)</td>
                <td>SigUSD or USE</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="section-text">
          Probability-of-profit stats only apply to options that were actually
          traded. An unsold option has zero probability of generating premium.
        </p>
      </section>

      {/* SECTION 5: P2P RISK CALLOUT */}
      <section>
        <div className="section-label">P2P Reality Check</div>
        <h2>What&#39;s Different About Etcha</h2>

        <Callout variant="amber" label="P2P Risks Specific to Etcha">
          <strong>No guaranteed counterparty</strong> — You set the price, the
          market decides whether to buy. There&#39;s no market maker standing on
          the other side.
          <br />
          <br />
          <strong>Wide spreads possible</strong> — On a thin P2P market, bid/ask
          spreads can be significant. Price competitively or wait longer for a
          fill.
          <br />
          <br />
          <strong>Collateral locked at mint</strong> — Whether or not a buyer
          appears, your collateral is committed the moment you mint.
          <br />
          <br />
          <strong>Rolling is two transactions</strong> — Cancel the listed sell
          order AND write a new option. You can&#39;t do it in one step, and it requires finding
          a new buyer.
          <br />
          <br />
          <strong>American-style exercise</strong> — The buyer can exercise at
          any time before expiry. This is token-holder-controlled, not randomly
          assigned like TradFi.
        </Callout>
      </section>

      {/* SECTION 6: UTXO STATE MACHINE */}
      <section>
        <div className="section-label">Under the Hood</div>
        <h2>The Option Lifecycle on Etcha</h2>
        <p className="section-text">
          Every option on Etcha follows a fixed sequence of steps. Each step
          is a transaction on the Ergo blockchain — no admin keys, no database.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <marker
                id="arrS"
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
              >
                <path
                  d="M0,0 L5,2.5 L0,5"
                  fill="none"
                  stroke="#7d8590"
                  strokeWidth="0.8"
                />
              </marker>
            </defs>

            {/* Row 1 */}
            <rect
              x="10"
              y="20"
              width="100"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="60"
              y="40"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Select asset
            </text>
            <text
              x="60"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              strike, expiry
            </text>
            <line
              x1="110"
              y1="43"
              x2="130"
              y2="43"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            <rect
              x="135"
              y="20"
              width="100"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="rgba(240,160,64,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="185"
              y="40"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              Lock
            </text>
            <text
              x="185"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              collateral
            </text>
            <line
              x1="235"
              y1="43"
              x2="255"
              y2="43"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            <rect
              x="260"
              y="20"
              width="100"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="310"
              y="40"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Definition
            </text>
            <text
              x="310"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              box created
            </text>
            <line
              x1="360"
              y1="43"
              x2="380"
              y2="43"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            <rect
              x="385"
              y="20"
              width="100"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="435"
              y="40"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Mint TX
            </text>
            <text
              x="435"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              N+1 tokens
            </text>
            <line
              x1="485"
              y1="43"
              x2="505"
              y2="43"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            <rect
              x="510"
              y="20"
              width="100"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="560"
              y="40"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Deliver TX
            </text>
            <text
              x="560"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              N → writer
            </text>
            <line
              x1="610"
              y1="43"
              x2="630"
              y2="43"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            <rect
              x="635"
              y="20"
              width="130"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="700"
              y="40"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              FixedPriceSell
            </text>
            <text
              x="700"
              y="54"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              list for sale
            </text>

            {/* Row 2 */}
            <line
              x1="700"
              y1="66"
              x2="700"
              y2="100"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            {/* Buyer step (prominent) */}
            <rect
              x="620"
              y="105"
              width="160"
              height="56"
              rx="4"
              fill="rgba(240,160,64,0.06)"
              stroke="#f0a040"
              strokeWidth="1"
            />
            <text
              x="700"
              y="128"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              fontWeight="700"
            >
              Buyer purchases
            </text>
            <text
              x="700"
              y="148"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              not guaranteed
            </text>

            <line
              x1="620"
              y1="133"
              x2="570"
              y2="133"
              stroke="#7d8590"
              strokeWidth="0.8"
              markerEnd="url(#arrS)"
            />

            {/* At expiry */}
            <rect
              x="420"
              y="110"
              width="145"
              height="46"
              rx="4"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="492"
              y="130"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              At expiry
            </text>
            <text
              x="492"
              y="144"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              oracle price checked
            </text>

            {/* Branch to exercise or expire */}
            <line
              x1="460"
              y1="156"
              x2="420"
              y2="195"
              stroke="#3fb950"
              strokeWidth="0.8"
            />
            <line
              x1="530"
              y1="156"
              x2="570"
              y2="195"
              stroke="#f85149"
              strokeWidth="0.8"
            />

            <rect
              x="320"
              y="195"
              width="130"
              height="40"
              rx="4"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="385"
              y="220"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              OTM → Expire
            </text>

            <rect
              x="500"
              y="195"
              width="130"
              height="40"
              rx="4"
              fill="rgba(248,81,73,0.05)"
              stroke="rgba(248,81,73,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="565"
              y="220"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
            >
              ITM → Exercise
            </text>

            {/* Bottom annotation */}
            <text
              x="400"
              y="270"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Each step is a UTXO transaction. The smart contract holds
              collateral — not Etcha, not a team.
            </text>
            <text
              x="400"
              y="288"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              The premium is set by the writer via FixedPriceSell — the contract
              has no concept of pricing.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* ETCHA CALLOUT */}
      <Callout variant="green" label="Etcha Guarantee">
        <strong>All writes are fully collateralized.</strong> No margin calls, no
        liquidation risk. Your max loss is defined at contract creation.
        Black-Scholes on the write UI is a suggestion — the writer sets the
        premium via a separate sell order.
      </Callout>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Writing options earns premium — but only when a buyer appears. Covered
          calls cap your upside in exchange for income. Cash-secured puts pay you
          to wait for a target price. On Etcha, all collateral is locked in an
          ErgoScript contract, not held by any team or platform. The tradeoff for
          full decentralization is P2P liquidity — you set the price, but no one
          is obligated to buy.
        </p>
      </Takeaway>

      <PageNav
        prev={{ href: "/learn/premiums", title: "Premiums" }}
        next={{
          href: "/learn/settlement",
          title: "Physical vs. Cash Settlement",
        }}
      />
    </>
  );
}
