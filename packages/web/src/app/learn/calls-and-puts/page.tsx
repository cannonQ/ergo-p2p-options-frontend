import { Metadata } from "next";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Callout from "../components/Callout";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata: Metadata = {
  title: "Calls & Puts — The Two Sides | Etcha Learn",
  description:
    "Every option has a buyer and a writer. One pays a premium for a right. The other collects that premium and takes an obligation. Everything else follows from this.",
};

export default function CallsAndPutsPage() {
  return (
    <>
      <LessonHeader current={1} />
      <h1>Calls &amp; Puts — The Two Sides</h1>
      <p className="subtitle">
        Every option has a buyer and a writer. One pays a premium for a right.
        The other collects that premium and takes an obligation. Everything else
        follows from this.
      </p>

      {/* SECTION 1: THE OPTIONS AGREEMENT HERO */}
      <section>
        <div className="section-label">The Agreement</div>
        <h2>Two Parties, One Contract</h2>
        <p className="section-text">
          An option is a contract between two peers. The buyer pays a premium for
          the right — not the obligation — to buy or sell an asset at a specific
          price. The writer collects the premium and locks collateral to
          guarantee the deal.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 380"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            {/* Background grid */}
            <defs>
              <pattern
                id="grid1"
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
            <rect width="800" height="380" fill="url(#grid1)" />

            {/* BUYER SIDE */}
            <rect
              x="40"
              y="40"
              width="240"
              height="200"
              rx="6"
              fill="#161b22"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="160"
              y="70"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              BUYER
            </text>
            <line
              x1="60"
              y1="82"
              x2="260"
              y2="82"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="160"
              y="108"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="12"
            >
              Pays premium
            </text>
            <text
              x="160"
              y="130"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              Gets: the RIGHT
            </text>
            <text
              x="160"
              y="150"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              to buy (call) or sell (put)
            </text>
            <text
              x="160"
              y="170"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              at the strike price
            </text>
            <line
              x1="60"
              y1="188"
              x2="260"
              y2="188"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="160"
              y="212"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Max loss: premium paid
            </text>
            <text
              x="160"
              y="228"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              Upside: unlimited (calls)
            </text>

            {/* CENTER CONTRACT */}
            <rect
              x="320"
              y="55"
              width="160"
              height="170"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="400"
              y="82"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              CONTRACT
            </text>
            <line
              x1="340"
              y1="94"
              x2="460"
              y2="94"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="400"
              y="116"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Asset: ERG
            </text>
            <text
              x="400"
              y="134"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Strike: $0.35
            </text>
            <text
              x="400"
              y="152"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Expiry: 30 days
            </text>
            <text
              x="400"
              y="170"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Type: Call
            </text>
            <text
              x="400"
              y="188"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Settlement: Cash
            </text>
            {/* Lock icon */}
            <rect
              x="382"
              y="198"
              width="36"
              height="22"
              rx="3"
              fill="rgba(56,139,253,0.1)"
              stroke="rgba(56,139,253,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="400"
              y="213"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              ErgoScript
            </text>

            {/* WRITER SIDE */}
            <rect
              x="520"
              y="40"
              width="240"
              height="200"
              rx="6"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="640"
              y="70"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              WRITER
            </text>
            <line
              x1="540"
              y1="82"
              x2="740"
              y2="82"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="640"
              y="108"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="12"
            >
              Collects premium
            </text>
            <text
              x="640"
              y="130"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              Takes: the OBLIGATION
            </text>
            <text
              x="640"
              y="150"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              to fulfill the contract
            </text>
            <text
              x="640"
              y="170"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              if exercised
            </text>
            <line
              x1="540"
              y1="188"
              x2="740"
              y2="188"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="640"
              y="212"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Max profit: premium
            </text>
            <text
              x="640"
              y="228"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="11"
            >
              Risk: locked collateral
            </text>

            {/* ARROWS: Premium flow */}
            <line
              x1="280"
              y1="110"
              x2="320"
              y2="110"
              stroke="#3fb950"
              strokeWidth="1.5"
              markerEnd="url(#arrowGreen)"
            />
            <line
              x1="480"
              y1="110"
              x2="520"
              y2="110"
              stroke="#3fb950"
              strokeWidth="1.5"
              markerEnd="url(#arrowGreen)"
            />
            <text
              x="400"
              y="105"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              {"15 SigUSD premium \u2192"}
            </text>

            {/* ARROW: Collateral lock */}
            <line
              x1="640"
              y1="240"
              x2="640"
              y2="275"
              stroke="#f0a040"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <rect
              x="570"
              y="275"
              width="140"
              height="28"
              rx="4"
              fill="rgba(240,160,64,0.08)"
              stroke="rgba(240,160,64,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="640"
              y="293"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              Collateral locked
            </text>

            {/* P2P CAVEAT */}
            <rect
              x="40"
              y="320"
              width="720"
              height="44"
              rx="4"
              fill="rgba(240,160,64,0.06)"
              stroke="rgba(240,160,64,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="56"
              y="340"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              {"\u26A0 P2P"}
            </text>
            <text
              x="108"
              y="340"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Premium flows only when a buyer purchases the token — not at mint.
            </text>
            <text
              x="56"
              y="356"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Collateral is locked at mint whether or not a buyer ever appears.
            </text>

            <defs>
              <marker
                id="arrowGreen"
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
            </defs>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 2: CALL OPTION PAYOFF DIAGRAM */}
      <section>
        <div className="section-label">Payoff at Expiration</div>
        <h2>Call Option — Profit When Price Rises</h2>
        <p className="section-text">
          A call gives the buyer the right to buy at the strike price. If the
          underlying rises above the strike, the buyer profits. The writer{"'"}s
          gain is capped at the premium collected.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridPayoff"
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
            <rect width="800" height="400" fill="url(#gridPayoff)" />

            {/* Axes */}
            <line
              x1="80"
              y1="40"
              x2="80"
              y2="340"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            <line
              x1="80"
              y1="200"
              x2="760"
              y2="200"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
            />

            {/* Y axis labels */}
            <text
              x="70"
              y="24"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              {"P&L (SigUSD)"}
            </text>
            <text
              x="70"
              y="205"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0
            </text>
            <text
              x="70"
              y="85"
              textAnchor="end"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              +profit
            </text>
            <text
              x="70"
              y="325"
              textAnchor="end"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              -loss
            </text>

            {/* X axis labels */}
            <text
              x="400"
              y="370"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              {"ERG Price at Expiry \u2192"}
            </text>
            <text
              x="200"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.20
            </text>
            <text
              x="360"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.30
            </text>
            <text
              x="480"
              y="358"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.35
            </text>
            <text
              x="560"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.40
            </text>
            <text
              x="680"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.50
            </text>

            {/* Strike price dashed line */}
            <line
              x1="480"
              y1="40"
              x2="480"
              y2="340"
              stroke="#388bfd"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x="486"
              y="52"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              strike $0.35
            </text>

            {/* Breakeven line */}
            <line
              x1="520"
              y1="40"
              x2="520"
              y2="340"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
            <text
              x="526"
              y="52"
              fill="rgba(255,255,255,0.4)"
              fontFamily="Courier New"
              fontSize="9"
            >
              breakeven
            </text>

            {/* BUYER P&L (green hockey stick) */}
            {/* Loss zone fill */}
            <path
              d="M80,230 L520,230 L520,200 L80,200 Z"
              fill="rgba(248,81,73,0.06)"
            />
            {/* Profit zone fill */}
            <path
              d="M520,200 L720,80 L720,200 Z"
              fill="rgba(63,185,80,0.10)"
            />
            {/* Buyer line: flat at -premium, then rises after strike */}
            <polyline
              points="80,230 480,230 720,80"
              stroke="#3fb950"
              strokeWidth="2"
              fill="none"
            />
            {/* Premium label */}
            <text
              x="280"
              y="224"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              {"\u2190 buyer max loss: -15 SigUSD (premium)"}
            </text>

            {/* WRITER P&L (amber/red inverse) */}
            {/* Writer capped profit fill */}
            <path
              d="M80,170 L480,170 L480,200 L80,200 Z"
              fill="rgba(63,185,80,0.06)"
            />
            {/* Writer loss fill */}
            <path
              d="M520,200 L720,320 L720,200 Z"
              fill="rgba(248,81,73,0.06)"
            />
            {/* Writer line */}
            <polyline
              points="80,170 480,170 720,320"
              stroke="#f0a040"
              strokeWidth="2"
              strokeDasharray="6 3"
              fill="none"
            />
            {/* Writer premium label */}
            <text
              x="280"
              y="166"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              {"\u2190 writer max profit: +15 SigUSD"}
            </text>

            {/* Legend */}
            <line
              x1="560"
              y1="370"
              x2="580"
              y2="370"
              stroke="#3fb950"
              strokeWidth="2"
            />
            <text
              x="586"
              y="374"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer
            </text>
            <line
              x1="640"
              y1="370"
              x2="660"
              y2="370"
              stroke="#f0a040"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <text
              x="666"
              y="374"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Writer
            </text>
          </svg>
        </Graphic>

        <p className="section-text">
          The buyer{"'"}s maximum loss is always the premium — 15 SigUSD, no
          more. The writer profits only when the price stays below the strike.
          Past the breakeven point (strike + premium), the buyer is in profit.
        </p>
      </section>

      {/* SECTION 3: PUT OPTION PAYOFF DIAGRAM */}
      <section>
        <div className="section-label">The Mirror Image</div>
        <h2>Put Option — Profit When Price Falls</h2>
        <p className="section-text">
          A put gives the buyer the right to sell at the strike price. If the
          underlying drops below the strike, the buyer profits. It{"'"}s the
          opposite of a call — you profit when the price goes down.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridPut"
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
            <rect width="800" height="400" fill="url(#gridPut)" />

            {/* Axes */}
            <line
              x1="80"
              y1="40"
              x2="80"
              y2="340"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            <line
              x1="80"
              y1="200"
              x2="760"
              y2="200"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
            />

            {/* Y axis labels */}
            <text
              x="70"
              y="24"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              {"P&L (SigUSD)"}
            </text>
            <text
              x="70"
              y="205"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0
            </text>

            {/* X axis labels */}
            <text
              x="400"
              y="370"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              {"ERG Price at Expiry \u2192"}
            </text>
            <text
              x="160"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.05
            </text>
            <text
              x="280"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.15
            </text>
            <text
              x="400"
              y="358"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.25
            </text>
            <text
              x="520"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.30
            </text>
            <text
              x="680"
              y="358"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.40
            </text>

            {/* Strike price dashed line */}
            <line
              x1="400"
              y1="40"
              x2="400"
              y2="340"
              stroke="#388bfd"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x="406"
              y="52"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              strike $0.25
            </text>

            {/* Breakeven line */}
            <line
              x1="360"
              y1="40"
              x2="360"
              y2="340"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
            <text
              x="354"
              y="52"
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontFamily="Courier New"
              fontSize="9"
            >
              breakeven
            </text>

            {/* BUYER P&L (green -- profit on left, loss on right) */}
            {/* Profit zone fill (left of breakeven) */}
            <path
              d="M100,200 L360,200 L100,70 Z"
              fill="rgba(63,185,80,0.10)"
            />
            {/* Loss zone fill (right of strike) */}
            <path
              d="M400,230 L700,230 L700,200 L400,200 Z"
              fill="rgba(248,81,73,0.06)"
            />
            {/* Buyer line */}
            <polyline
              points="100,70 400,230 700,230"
              stroke="#3fb950"
              strokeWidth="2"
              fill="none"
            />
            {/* Premium label */}
            <text
              x="560"
              y="224"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              {"buyer max loss: -20 SigUSD \u2192"}
            </text>

            {/* WRITER P&L (amber inverse) */}
            {/* Writer profit zone */}
            <path
              d="M400,170 L700,170 L700,200 L400,200 Z"
              fill="rgba(63,185,80,0.06)"
            />
            {/* Writer loss zone */}
            <path
              d="M100,200 L360,200 L100,330 Z"
              fill="rgba(248,81,73,0.06)"
            />
            {/* Writer line */}
            <polyline
              points="100,330 400,170 700,170"
              stroke="#f0a040"
              strokeWidth="2"
              strokeDasharray="6 3"
              fill="none"
            />
            <text
              x="560"
              y="166"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              {"\u2190 writer max profit: +20 SigUSD"}
            </text>

            {/* Max buyer profit annotation */}
            <text
              x="160"
              y="96"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              buyer max profit:
            </text>
            <text
              x="160"
              y="110"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              strike - premium
            </text>

            {/* Legend */}
            <line
              x1="560"
              y1="370"
              x2="580"
              y2="370"
              stroke="#3fb950"
              strokeWidth="2"
            />
            <text
              x="586"
              y="374"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyer
            </text>
            <line
              x1="640"
              y1="370"
              x2="660"
              y2="370"
              stroke="#f0a040"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <text
              x="666"
              y="374"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Writer
            </text>
          </svg>
        </Graphic>

        <p className="section-text">
          For puts, the buyer{"'"}s maximum profit is the strike price minus the
          premium (the underlying can{"'"}t go below zero). The writer{"'"}s
          maximum loss is the full strike value minus the premium collected.
        </p>
      </section>

      {/* SECTION 4: COMPARISON TABLE */}
      <section>
        <div className="section-label">Side by Side</div>
        <h2>Calls vs. Puts at a Glance</h2>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th></th>
                <th style={{ color: "#3fb950" }}>Call</th>
                <th style={{ color: "#f0a040" }}>Put</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Buyer profits when...</td>
                <td>Price rises above strike</td>
                <td>Price falls below strike</td>
              </tr>
              <tr>
                <td className="row-label">Writer profits when...</td>
                <td>Price stays below strike</td>
                <td>Price stays above strike</td>
              </tr>
              <tr>
                <td className="row-label">Buyer{"'"}s max loss</td>
                <td>Premium paid</td>
                <td>Premium paid</td>
              </tr>
              <tr>
                <td className="row-label">Writer{"'"}s max loss</td>
                <td>Collateral locked (capped upside sold)</td>
                <td>Full strike value</td>
              </tr>
              <tr>
                <td className="row-label">Buyer{"'"}s max profit</td>
                <td>Unlimited (price can rise forever)</td>
                <td>Strike - premium (price floor = $0)</td>
              </tr>
              <tr>
                <td className="row-label">Collateral (Etcha)</td>
                <td>
                  Physical: rsToken
                  <br />
                  Cash: stablecoins
                </td>
                <td>Stablecoins (SigUSD / USE)</td>
              </tr>
              <tr>
                <td className="row-label">Sentiment (your view)</td>
                <td style={{ color: "#3fb950" }}>{"Bullish \u2191 (price goes up)"}</td>
                <td style={{ color: "#f85149" }}>{"Bearish \u2193 (price goes down)"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: WORKED EXAMPLE */}
      <section>
        <div className="section-label">Worked Example</div>
        <h2>A Call Trade on Etcha</h2>

        <div className="worked-example">
          <div className="ex-title">Scenario: ERG $0.35 Call</div>

          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              ERG is trading at <strong>$0.29</strong>. You believe it{"'"}s
              heading higher. You buy a <strong>$0.35 call</strong> on Etcha for{" "}
              <strong>15 SigUSD</strong> premium.
            </div>
          </div>

          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              At expiry, ERG hits <strong>$0.50</strong>. Your option is in the
              money.
              <div className="math">
                {"Profit = ($0.50 \u2212 $0.35) \u00D7 number of contracts \u2212 15 SigUSD premium"}
              </div>
              <div className="math" style={{ marginTop: 2 }}>
                {"Per-unit gain: $0.15 \u2014 minus 15 SigUSD premium = net profit"}
              </div>
            </div>
          </div>

          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              Alternatively: ERG stays at <strong>$0.29</strong>. Your call
              expires worthless.
              <div className="math loss">
                Loss = 15 SigUSD (the premium). Nothing more. Ever.
              </div>
            </div>
          </div>
        </div>

        <Callout variant="amber" label="P2P reality">
          <strong>The writer{"'"}s side:</strong> They locked collateral before
          you bought the option. If no buyer had appeared, their collateral would
          have sat locked with zero premium earned until expiry. On Etcha, there
          {"'"}s no guaranteed counterparty — the writer posted the option, you
          chose to buy it.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Buyers pay a defined premium for a right. Writers collect that premium
          and take on an obligation. The buyer{"'"}s maximum loss is always the
          premium — nothing more. The writer{"'"}s maximum loss is limited to
          their locked collateral. Every option trade is a two-sided agreement
          between peers.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        next={{ href: "/learn/premiums", title: "Premiums \u2014 What Options Cost" }}
      />
    </>
  );
}
