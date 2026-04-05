import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Graphic from "../../learn/components/Graphic";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "Cancel & Manage Orders | Etcha — How It Works",
  description:
    "Cancel sell orders anytime, understand the full fee breakdown, and see the complete token flow lifecycle from writing to settlement.",
};

export default function CancelAndManagePage() {
  return (
    <>
      <StepHeader current={4} />
      <h1>Cancel &amp; Manage Orders</h1>
      <p className="subtitle">
        You can cancel a sell order anytime — the seller{"'"}s key has full
        control. Here{"'"}s how cancellation works, what every action costs, and
        the complete token flow from mint to settlement.
      </p>

      {/* SECTION 1: CANCELLING A SELL ORDER */}
      <section>
        <div className="section-label">Cancelling</div>
        <h2>Cancelling a Sell Order</h2>
        <p className="section-text">
          If you listed option tokens for sale but want them back, you can cancel
          anytime. No restrictions, no waiting period. Your tokens return to your
          wallet immediately.
        </p>

        <ol>
          <li>Click &quot;Cancel&quot; next to your sell order</li>
          <li>Sign in Nautilus</li>
          <li>Tokens return to your wallet</li>
        </ol>

        <Graphic>
          <svg
            viewBox="0 0 800 200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridC1"
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
              <marker
                id="arrCancel"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#f0a040"
                  strokeWidth="1"
                />
              </marker>
            </defs>
            <rect width="800" height="200" fill="url(#gridC1)" />

            {/* Sell Order Box */}
            <rect
              x="120"
              y="50"
              width="220"
              height="100"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="230"
              y="80"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELL ORDER
            </text>
            <line
              x1="140"
              y1="90"
              x2="320"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="230"
              y="112"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              3 option tokens
            </text>
            <text
              x="230"
              y="130"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              R4 = seller SigmaProp
            </text>

            {/* Arrow */}
            <line
              x1="340"
              y1="100"
              x2="460"
              y2="100"
              stroke="#f0a040"
              strokeWidth="1.5"
              markerEnd="url(#arrCancel)"
            />
            <text
              x="400"
              y="90"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              cancel (sign)
            </text>

            {/* Seller Wallet */}
            <rect
              x="470"
              y="50"
              width="220"
              height="100"
              rx="6"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="580"
              y="80"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELLER WALLET
            </text>
            <line
              x1="490"
              y1="90"
              x2="670"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="580"
              y="112"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              3 tokens returned
            </text>
            <text
              x="580"
              y="130"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              ready to relist or hold
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The FixedPriceSell contract has an OR guard:{" "}
          <code>validSale || sellerPK</code>. The seller{"'"}s SigmaProp from R4
          can always spend the box with no other conditions.
        </Callout>
      </section>

      {/* SECTION 2: FEE BREAKDOWN */}
      <section>
        <div className="section-label">Costs</div>
        <h2>Fee Breakdown</h2>
        <p className="section-text">
          Every action has a cost. Here{"'"}s the full breakdown — the only
          platform fee is at mint time.
        </p>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>When</th>
                <th>What You Pay</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Writing</td>
                <td>~0.013 ERG</td>
                <td>Miner fees for 3 TXs + 0.01 ERG platform fee</td>
              </tr>
              <tr>
                <td className="row-label">Listing</td>
                <td>0.0022 ERG</td>
                <td>Miner fee</td>
              </tr>
              <tr>
                <td className="row-label">Buying</td>
                <td>0.0022 ERG + premium</td>
                <td>Miner fee + stablecoin premium to seller</td>
              </tr>
              <tr>
                <td className="row-label">Exercising</td>
                <td>0.0022 ERG + strike payment</td>
                <td>Miner fee + stablecoin to writer</td>
              </tr>
              <tr>
                <td className="row-label">Closing expired</td>
                <td>0.0022 ERG</td>
                <td>Miner fee (from reserve ERG)</td>
              </tr>
              <tr>
                <td className="row-label">Cancelling</td>
                <td>0.0022 ERG</td>
                <td>Miner fee</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout variant="green">
          The only platform fee is 0.01 ERG (~$0.003) at mint time. Everything
          else is just Ergo network miner fees.
        </Callout>
      </section>

      {/* SECTION 3: TOKEN FLOW OVERVIEW */}
      <section>
        <div className="section-label">Lifecycle</div>
        <h2>Token Flow Overview</h2>
        <p className="section-text">
          The complete lifecycle from writing to settlement. Every arrow is an
          on-chain transaction. Every box is a UTXO.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 620"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridC2"
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
              <marker
                id="arrFlow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#8b949e"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrGrn"
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
                id="arrAmb"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#f0a040"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrPrp"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#a371f7"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrRed"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#f85149"
                  strokeWidth="1"
                />
              </marker>
            </defs>
            <rect width="800" height="620" fill="url(#gridC2)" />

            {/* === ROW 1: WRITE → MINT → DELIVER === */}
            <text
              x="400"
              y="20"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              CREATION PHASE
            </text>

            {/* Writer Wallet */}
            <rect
              x="20"
              y="35"
              width="120"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="80"
              y="58"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              WALLET
            </text>
            <text
              x="80"
              y="75"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              collateral
            </text>
            <text
              x="80"
              y="90"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              + 0.013 ERG
            </text>

            {/* Arrow: Write */}
            <line
              x1="140"
              y1="67"
              x2="175"
              y2="67"
              stroke="#8b949e"
              strokeWidth="1"
              markerEnd="url(#arrFlow)"
            />
            <text
              x="158"
              y="60"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              WRITE
            </text>

            {/* Definition Box */}
            <rect
              x="180"
              y="35"
              width="120"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="240"
              y="58"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              DEFINITION
            </text>
            <text
              x="240"
              y="75"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              + collateral
            </text>
            <text
              x="240"
              y="90"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              no tokens yet
            </text>

            {/* Arrow: Mint */}
            <line
              x1="300"
              y1="67"
              x2="340"
              y2="67"
              stroke="#8b949e"
              strokeWidth="1"
              markerEnd="url(#arrFlow)"
            />
            <text
              x="320"
              y="60"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="8"
            >
              MINT
            </text>

            {/* Reserve (post-mint) */}
            <rect
              x="345"
              y="35"
              width="130"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="410"
              y="55"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              RESERVE
            </text>
            <text
              x="410"
              y="72"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              N+1 tokens
            </text>
            <text
              x="410"
              y="88"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              + collateral
            </text>

            {/* Arrow: Deliver */}
            <line
              x1="475"
              y1="67"
              x2="520"
              y2="67"
              stroke="#8b949e"
              strokeWidth="1"
              markerEnd="url(#arrFlow)"
            />
            <text
              x="498"
              y="60"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="8"
            >
              DELIVER
            </text>

            {/* Reserve (singleton) */}
            <rect
              x="525"
              y="35"
              width="120"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="585"
              y="55"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              RESERVE
            </text>
            <text
              x="585"
              y="72"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              1 singleton
            </text>
            <text
              x="585"
              y="88"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              + collateral
            </text>

            {/* Writer gets tokens */}
            <rect
              x="660"
              y="35"
              width="120"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="720"
              y="55"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              WRITER
            </text>
            <text
              x="720"
              y="72"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              N tokens
            </text>
            <text
              x="720"
              y="88"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              ready to sell
            </text>

            {/* Fee box from Mint */}
            <line
              x1="410"
              y1="100"
              x2="410"
              y2="130"
              stroke="#a371f7"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
            <rect
              x="360"
              y="130"
              width="100"
              height="28"
              rx="4"
              fill="rgba(163,113,247,0.08)"
              stroke="rgba(163,113,247,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="410"
              y="148"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="9"
            >
              Fee 0.01 ERG
            </text>

            {/* === DIVIDER === */}
            <line
              x1="20"
              y1="175"
              x2="780"
              y2="175"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />

            {/* === ROW 2: LIST → BUY === */}
            <text
              x="400"
              y="200"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              TRADING PHASE
            </text>

            {/* Writer lists */}
            <rect
              x="80"
              y="215"
              width="140"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="238"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              WRITER
            </text>
            <text
              x="150"
              y="255"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              N option tokens
            </text>
            <text
              x="150"
              y="270"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              sets premium
            </text>

            {/* Arrow: List */}
            <line
              x1="220"
              y1="247"
              x2="285"
              y2="247"
              stroke="#8b949e"
              strokeWidth="1"
              markerEnd="url(#arrFlow)"
            />
            <text
              x="252"
              y="240"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="8"
            >
              LIST
            </text>

            {/* Sell Order */}
            <rect
              x="290"
              y="215"
              width="140"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="360"
              y="238"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              SELL ORDER
            </text>
            <text
              x="360"
              y="255"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              N tokens @ price
            </text>
            <text
              x="360"
              y="270"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              in USE or SigUSD
            </text>

            {/* Arrow: Buy */}
            <line
              x1="430"
              y1="247"
              x2="495"
              y2="247"
              stroke="#3fb950"
              strokeWidth="1"
              markerEnd="url(#arrGrn)"
            />
            <text
              x="462"
              y="240"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="8"
            >
              BUY
            </text>

            {/* Buy result */}
            <rect
              x="500"
              y="215"
              width="220"
              height="65"
              rx="5"
              fill="#161b22"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="610"
              y="238"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              BUYER gets tokens
            </text>
            <text
              x="610"
              y="255"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              SELLER gets stablecoin
            </text>
            <text
              x="610"
              y="270"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              partial fills supported
            </text>

            {/* === DIVIDER === */}
            <line
              x1="20"
              y1="300"
              x2="780"
              y2="300"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />

            {/* === ROW 3: EXERCISE / CLOSE / CANCEL === */}
            <text
              x="400"
              y="325"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SETTLEMENT PHASE
            </text>

            {/* EXERCISE path */}
            <rect
              x="20"
              y="345"
              width="230"
              height="110"
              rx="5"
              fill="#161b22"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="135"
              y="368"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              EXERCISE
            </text>
            <line
              x1="40"
              y1="378"
              x2="230"
              y2="378"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="135"
              y="398"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              collateral {"\u2192"} buyer
            </text>
            <text
              x="135"
              y="416"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              strike $ {"\u2192"} writer
            </text>
            <text
              x="135"
              y="434"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
            >
              option tokens {"\u2192"} BURNED
            </text>

            {/* CLOSE path */}
            <rect
              x="285"
              y="345"
              width="230"
              height="110"
              rx="5"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="400"
              y="368"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              CLOSE (expired)
            </text>
            <line
              x1="305"
              y1="378"
              x2="495"
              y2="378"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="400"
              y="398"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              collateral {"\u2192"} writer
            </text>
            <text
              x="400"
              y="416"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
            >
              singleton {"\u2192"} BURNED
            </text>
            <text
              x="400"
              y="434"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              anyone can submit
            </text>

            {/* CANCEL path */}
            <rect
              x="550"
              y="345"
              width="230"
              height="110"
              rx="5"
              fill="#161b22"
              stroke="rgba(163,113,247,0.4)"
              strokeWidth="1"
            />
            <text
              x="665"
              y="368"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              CANCEL
            </text>
            <line
              x1="570"
              y1="378"
              x2="760"
              y2="378"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="665"
              y="398"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              tokens {"\u2192"} seller
            </text>
            <text
              x="665"
              y="416"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              seller signs
            </text>
            <text
              x="665"
              y="434"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              no restrictions
            </text>

            {/* Reserve box feeding into Exercise and Close */}
            <rect
              x="240"
              y="490"
              width="160"
              height="50"
              rx="5"
              fill="rgba(56,139,253,0.06)"
              stroke="rgba(56,139,253,0.25)"
              strokeWidth="0.5"
            />
            <text
              x="320"
              y="512"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              RESERVE (singleton
            </text>
            <text
              x="320"
              y="528"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              + collateral)
            </text>
            <line
              x1="270"
              y1="490"
              x2="135"
              y2="455"
              stroke="#8b949e"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
            <line
              x1="370"
              y1="490"
              x2="400"
              y2="455"
              stroke="#8b949e"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />

            {/* Sell Order feeding into Cancel */}
            <rect
              x="530"
              y="490"
              width="160"
              height="50"
              rx="5"
              fill="rgba(56,139,253,0.06)"
              stroke="rgba(56,139,253,0.25)"
              strokeWidth="0.5"
            />
            <text
              x="610"
              y="512"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              SELL ORDER
            </text>
            <text
              x="610"
              y="528"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              (option tokens)
            </text>
            <line
              x1="610"
              y1="490"
              x2="665"
              y2="455"
              stroke="#8b949e"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />

            {/* Key */}
            <rect
              x="100"
              y="570"
              width="600"
              height="36"
              rx="4"
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
            <circle cx="140" cy="588" r="4" fill="#3fb950" />
            <text
              x="150"
              y="592"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Buyer
            </text>
            <circle cx="220" cy="588" r="4" fill="#f0a040" />
            <text
              x="230"
              y="592"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Writer/Seller
            </text>
            <circle cx="340" cy="588" r="4" fill="#388bfd" />
            <text
              x="350"
              y="592"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Contract
            </text>
            <circle cx="440" cy="588" r="4" fill="#a371f7" />
            <text
              x="450"
              y="592"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Bot/Fee
            </text>
            <circle cx="520" cy="588" r="4" fill="#f85149" />
            <text
              x="530"
              y="592"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="9"
            >
              Burned
            </text>
          </svg>
        </Graphic>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          You can cancel anytime — the seller{"'"}s key has full control. The
          only platform fee is 0.01 ERG at mint. Everything else is miner fees.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        prev={{ href: "/how-it-works/settlement", title: "Settlement" }}
        next={{ href: "/how-it-works/the-bot", title: "The Bot" }}
      />
    </>
  );
}
