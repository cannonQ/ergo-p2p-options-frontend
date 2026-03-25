import Callout from "../components/Callout";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata = {
  title: "Physical vs. Cash Settlement | Etcha Learn",
  description:
    "When an option is exercised, the payout happens one of two ways: the actual asset changes hands (physical), or the cash difference is paid out (cash). Etcha supports both.",
};

export default function SettlementPage() {
  return (
    <>
      <LessonHeader current={4} />
      <h1>Physical vs. Cash Settlement</h1>
      <p className="subtitle">
        When an option is exercised, the payout happens one of two ways: the
        actual asset changes hands (physical), or the cash difference is paid
        out (cash). Etcha supports both — with different collateral requirements
        for each.
      </p>

      {/* SECTION 1: FORK IN THE ROAD HERO */}
      <section>
        <div className="section-label">Two Paths, One Contract</div>
        <h2>The Settlement Fork</h2>
        <p className="section-text">
          The settlement mode is chosen when the option is created — not at
          exercise. Both paths start from the same ErgoScript contract. The
          oracle provides the spot price; the contract handles the rest.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 360"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid4a"
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
            <rect width="800" height="360" fill="url(#grid4a)" />

            {/* Central contract box */}
            <rect
              x="300"
              y="30"
              width="200"
              height="70"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="400"
              y="55"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              ERGOSCRIPT CONTRACT
            </text>
            <text
              x="400"
              y="75"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Option expires ITM → settlement triggered
            </text>

            {/* Fork lines */}
            <line
              x1="340"
              y1="100"
              x2="200"
              y2="150"
              stroke="#3fb950"
              strokeWidth="1.5"
            />
            <line
              x1="460"
              y1="100"
              x2="600"
              y2="150"
              stroke="#f0a040"
              strokeWidth="1.5"
            />

            {/* PHYSICAL PATH (left) */}
            <rect
              x="60"
              y="150"
              width="280"
              height="180"
              rx="6"
              fill="rgba(63,185,80,0.04)"
              stroke="rgba(63,185,80,0.25)"
              strokeWidth="0.5"
            />
            <text
              x="200"
              y="175"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              Physical Settlement
            </text>
            <line
              x1="80"
              y1="186"
              x2="320"
              y2="186"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />

            <text
              x="200"
              y="210"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Actual token delivered
            </text>
            <text
              x="200"
              y="230"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              from writer&apos;s locked collateral
            </text>

            <text
              x="200"
              y="260"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Calls: writer locks rsToken
            </text>
            <text
              x="200"
              y="278"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Puts: writer locks stablecoins
            </text>

            <rect
              x="110"
              y="296"
              width="180"
              height="24"
              rx="3"
              fill="rgba(63,185,80,0.08)"
            />
            <text
              x="200"
              y="313"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer receives: rsETH, rsBTC...
            </text>

            {/* CASH PATH (right) */}
            <rect
              x="460"
              y="150"
              width="280"
              height="180"
              rx="6"
              fill="rgba(240,160,64,0.04)"
              stroke="rgba(240,160,64,0.25)"
              strokeWidth="0.5"
            />
            <text
              x="600"
              y="175"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              Cash Settlement
            </text>
            <line
              x1="480"
              y1="186"
              x2="720"
              y2="186"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />

            <text
              x="600"
              y="210"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Price difference paid out
            </text>
            <text
              x="600"
              y="230"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              in SigUSD or USE
            </text>

            <text
              x="600"
              y="260"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Calls and puts: writer
            </text>
            <text
              x="600"
              y="278"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              locks stablecoins
            </text>

            <rect
              x="510"
              y="296"
              width="180"
              height="24"
              rx="3"
              fill="rgba(240,160,64,0.08)"
            />
            <text
              x="600"
              y="313"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer receives: SigUSD
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 2: PHYSICAL CALL WALKTHROUGH */}
      <section>
        <div className="section-label">Walkthrough 1</div>
        <h2>Physical Call — rsETH Changes Hands</h2>
        <p className="section-text">
          The writer locks the actual asset. If exercised, the buyer pays the
          strike price and receives the locked token. The writer keeps the
          strike payment plus the premium.
        </p>

        <div className="panels">
          <div
            className="panel"
            style={{ borderColor: "rgba(240,160,64,0.3)" }}
          >
            <div className="p-num">PANEL 1</div>
            <div className="p-title">Writer Locks</div>
            Writer deposits{" "}
            <strong style={{ color: "var(--lp-green)" }}>1 rsETH</strong> as
            collateral. Mints call at <strong>$2,000</strong> strike.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 2</div>
            <div className="p-title">Buyer Purchases</div>
            Buyer pays{" "}
            <strong style={{ color: "var(--lp-green)" }}>50 SigUSD</strong>{" "}
            premium. Writer collects it.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(56,139,253,0.3)" }}
          >
            <div className="p-num">PANEL 3</div>
            <div className="p-title">Expiry: ETH = $2,400</div>
            Buyer exercises. Pays <strong>$2,000 SigUSD</strong> strike to the
            contract.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 4</div>
            <div className="p-title">Settlement</div>
            Buyer receives{" "}
            <strong style={{ color: "var(--lp-green)" }}>1 rsETH</strong>.
            Writer keeps <strong>$2,000 + $50</strong>.
          </div>
        </div>
        <Callout variant="neutral">
          Writer deposited rsETH at creation. Buyer pays the strike to receive
          it. The actual token changes hands — this is physical delivery.
        </Callout>
      </section>

      {/* SECTION 3: CASH CALL WALKTHROUGH */}
      <section>
        <div className="section-label">Walkthrough 2</div>
        <h2>Cash-Settled Call — No Token Involved</h2>
        <p className="section-text">
          The writer locks stablecoins. If the price exceeds the strike, the
          difference is paid to the buyer in SigUSD. No bridging, no token
          transfer.
        </p>

        <div className="panels">
          <div
            className="panel"
            style={{ borderColor: "rgba(240,160,64,0.3)" }}
          >
            <div className="p-num">PANEL 1</div>
            <div className="p-title">Writer Locks</div>
            Writer deposits{" "}
            <strong style={{ color: "var(--lp-copper)" }}>SigUSD</strong>{" "}
            collateral. Mints call at <strong>$2,000</strong> strike.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 2</div>
            <div className="p-title">Buyer Purchases</div>
            Buyer pays{" "}
            <strong style={{ color: "var(--lp-green)" }}>50 SigUSD</strong>{" "}
            premium.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(56,139,253,0.3)" }}
          >
            <div className="p-num">PANEL 3</div>
            <div className="p-title">Expiry: ETH = $2,400</div>
            Payout = $2,400 − $2,000 ={" "}
            <strong style={{ color: "var(--lp-green)" }}>$400 SigUSD</strong>.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 4</div>
            <div className="p-title">Settlement</div>
            <strong style={{ color: "var(--lp-green)" }}>$400 SigUSD</strong>{" "}
            lands in buyer&apos;s wallet. No rsETH involved. No bridging.
          </div>
        </div>
        <Callout variant="neutral">
          No rsETH needed. Pure USD difference, paid in SigUSD. This is how
          commodities and indices settle too — you can&apos;t physically deliver
          a barrel of oil on-chain.
        </Callout>
      </section>

      {/* SECTION 4: CASH PUT WALKTHROUGH */}
      <section>
        <div className="section-label">Walkthrough 3</div>
        <h2>Cash-Settled Put — Protection Pays in Stablecoins</h2>

        <div className="panels">
          <div
            className="panel"
            style={{ borderColor: "rgba(240,160,64,0.3)" }}
          >
            <div className="p-num">PANEL 1</div>
            <div className="p-title">Writer Locks</div>
            Writer deposits{" "}
            <strong style={{ color: "var(--lp-copper)" }}>SigUSD</strong>{" "}
            (strike × contracts). Mints put at <strong>$0.25</strong>.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 2</div>
            <div className="p-title">Buyer Purchases</div>
            Buyer pays{" "}
            <strong style={{ color: "var(--lp-green)" }}>30 SigUSD</strong>{" "}
            premium.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(56,139,253,0.3)" }}
          >
            <div className="p-num">PANEL 3</div>
            <div className="p-title">Expiry: ERG = $0.18</div>
            Payout = $0.25 − $0.18 ={" "}
            <strong style={{ color: "var(--lp-green)" }}>$0.07/ERG</strong>.
          </div>
          <div
            className="panel"
            style={{ borderColor: "rgba(63,185,80,0.3)" }}
          >
            <div className="p-num">PANEL 4</div>
            <div className="p-title">Settlement</div>
            Buyer receives{" "}
            <strong style={{ color: "var(--lp-green)" }}>
              $0.07 × contract_size
            </strong>{" "}
            in SigUSD.
          </div>
        </div>
        <Callout variant="neutral">
          The writer was willing to buy ERG at $0.25. Cash settlement pays the
          difference instead — the writer doesn&apos;t receive ERG, the buyer
          doesn&apos;t sell it. Both sides settle in stablecoins.
        </Callout>
      </section>

      {/* SECTION 5: ROSEN BRIDGE SIDEBAR */}
      <section>
        <div className="section-label">Where rsTokens Come From</div>
        <h2>Rosen Bridge — Physical Delivery&apos;s Upstream</h2>
        <p className="section-text">
          Physical settlement on Etcha uses rsTokens (rsBTC, rsETH, etc.) —
          bridged representations of assets from other chains. The bridge
          operates upstream of Etcha; it&apos;s not part of the exercise flow.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            {/* Source chain */}
            <rect
              x="40"
              y="40"
              width="160"
              height="60"
              rx="5"
              fill="#161b22"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text
              x="120"
              y="65"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Ethereum
            </text>
            <text
              x="120"
              y="82"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Source chain
            </text>

            {/* Arrow */}
            <line
              x1="200"
              y1="70"
              x2="260"
              y2="70"
              stroke="#7d8590"
              strokeWidth="1"
            />
            <text
              x="230"
              y="64"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              lock
            </text>

            {/* Rosen Bridge */}
            <rect
              x="265"
              y="30"
              width="200"
              height="80"
              rx="5"
              fill="rgba(56,139,253,0.06)"
              stroke="rgba(56,139,253,0.3)"
              strokeWidth="1"
            />
            <text
              x="365"
              y="55"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              Rosen Bridge
            </text>
            <text
              x="365"
              y="72"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Decentralized watchers
            </text>
            <text
              x="365"
              y="86"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              verify &amp; mint rsToken
            </text>

            {/* Arrow */}
            <line
              x1="465"
              y1="70"
              x2="525"
              y2="70"
              stroke="#3fb950"
              strokeWidth="1"
            />
            <text
              x="495"
              y="64"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="8"
            >
              mint
            </text>

            {/* Ergo */}
            <rect
              x="530"
              y="40"
              width="120"
              height="60"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="590"
              y="65"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              rsETH on Ergo
            </text>
            <text
              x="590"
              y="82"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Available
            </text>

            {/* Arrow to Etcha */}
            <line
              x1="650"
              y1="70"
              x2="690"
              y2="70"
              stroke="#3fb950"
              strokeWidth="1"
            />

            <rect
              x="695"
              y="40"
              width="90"
              height="60"
              rx="5"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="740"
              y="65"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              Etcha
            </text>
            <text
              x="740"
              y="82"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral
            </text>

            {/* Supported assets */}
            <text
              x="400"
              y="140"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Supported physical delivery assets:
            </text>
            <text
              x="400"
              y="158"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              rsETH · rsBTC · rsBNB · rsDOGE · rsADA · native ERG
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral">
          Rosen Bridge uses decentralized watchers — not a single bridge
          operator. Etcha uses rsTokens as physical delivery assets. The bridge
          operates upstream; it&apos;s not involved at exercise time.
        </Callout>
      </section>

      {/* SECTION 6: DECISION MATRIX */}
      <section>
        <div className="section-label">When to Use Which</div>
        <h2>Settlement Decision Matrix</h2>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th>Use Case</th>
                <th>Best Settlement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Speculation / quick profit</td>
                <td>
                  <strong style={{ color: "var(--lp-copper)" }}>Cash</strong> —
                  Simpler, no bridging needed
                </td>
              </tr>
              <tr>
                <td className="row-label">Accumulating a specific token</td>
                <td>
                  <strong style={{ color: "var(--lp-green)" }}>Physical</strong>{" "}
                  — Receive the actual asset
                </td>
              </tr>
              <tr>
                <td className="row-label">Hedging existing holdings</td>
                <td>
                  <strong style={{ color: "var(--lp-copper)" }}>Cash</strong> —
                  Offset losses in SigUSD
                </td>
              </tr>
              <tr>
                <td className="row-label">Commodities &amp; indices</td>
                <td>
                  <strong style={{ color: "var(--lp-copper)" }}>
                    Cash only
                  </strong>{" "}
                  — No physical gold delivery on-chain
                </td>
              </tr>
              <tr>
                <td className="row-label">Writer already holds the asset</td>
                <td>
                  <strong style={{ color: "var(--lp-green)" }}>
                    Physical call
                  </strong>{" "}
                  — Lock what you own
                </td>
              </tr>
              <tr>
                <td className="row-label">Writer holds stablecoins</td>
                <td>
                  <strong style={{ color: "var(--lp-copper)" }}>Cash</strong> or{" "}
                  <strong style={{ color: "var(--lp-green)" }}>
                    physical put
                  </strong>
                </td>
              </tr>
              <tr>
                <td className="row-label">Small size trades</td>
                <td>
                  <strong style={{ color: "var(--lp-copper)" }}>Cash</strong> —
                  Avoid bridge overhead
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout variant="green" label="Etcha-Specific">
          Cash-settled options on Etcha pay out in{" "}
          <strong>SigUSD or USE</strong> — Ergo-native stablecoins. Physical
          settlement is only available for crypto assets that Rosen Bridge
          supports. Commodities (Gold, WTI) and indices (S&amp;P 500) are always
          cash-settled via oracle price feeds.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Physical settlement delivers the actual token — use it when you want
          to accumulate an asset. Cash settlement pays the price difference in
          stablecoins — use it for speculation, hedging, and anything you
          can&apos;t physically deliver (gold, oil, equities). The settlement
          mode is chosen at creation, not at exercise.
        </p>
      </Takeaway>

      <PageNav
        prev={{ href: "/learn/writing-options", title: "Writing Options" }}
        next={{
          href: "/learn/hedging",
          title: "Hedging — Protecting Your Bags",
        }}
      />
    </>
  );
}
