import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Graphic from "../../learn/components/Graphic";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "Trading Options | Etcha — How It Works",
  description:
    "List option tokens for sale at a fixed price. Buyers browse the option chain and purchase directly from on-chain sell orders. Partial fills are automatic.",
};

export default function TradingPage() {
  return (
    <>
      <StepHeader current={2} />
      <h1>Trading Options</h1>
      <p className="subtitle">
        Sell orders live on-chain at the FixedPriceSell contract. Buyers browse,
        pick a strike, and purchase directly. The seller{"'"}s key can always
        cancel. Partial fills create successor boxes automatically.
      </p>

      {/* SECTION 1: LISTING FOR SALE */}
      <section>
        <div className="section-label">Seller Flow</div>
        <h2>Listing for Sale</h2>
        <p className="section-text">
          You choose how many tokens to list, pick a stablecoin (USE or
          SigUSD), and set your premium price per token. The Black-Scholes model
          suggests a fair price based on current volatility — you can accept it
          or override it.
        </p>

        <div className="worked-example">
          <div className="ex-title">What You See</div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              Click {"\u201C"}List for Sale{"\u201D"} on your portfolio
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              Set premium (e.g. 0.18 USE per token)
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              Choose payment currency (USE or SigUSD)
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">4</div>
            <div className="ex-content">Sign in Nautilus</div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">5</div>
            <div className="ex-content">
              Tokens appear under {"\u201C"}My Sell Orders{"\u201D"}
            </div>
          </div>
        </div>

        {/* TODO: Replace with <Image src="/how-it-works/list-for-sale.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: List for Sale modal</em>
        </div>

        <Graphic>
          <svg
            viewBox="0 0 800 220"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridT1"
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
                id="arrowT1gray"
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
            </defs>
            <rect width="800" height="220" fill="url(#gridT1)" />

            {/* Writer's Wallet */}
            <rect
              x="40"
              y="50"
              width="240"
              height="120"
              rx="6"
              fill="#12151c"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="160"
              y="78"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELLER WALLET
            </text>
            <line
              x1="60"
              y1="90"
              x2="260"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="160"
              y="112"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              3 option tokens
            </text>
            <text
              x="160"
              y="132"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              from writing step
            </text>
            <text
              x="160"
              y="150"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              ready to list
            </text>

            {/* Arrow */}
            <line
              x1="280"
              y1="110"
              x2="440"
              y2="110"
              stroke="#8b949e"
              strokeWidth="1.5"
              markerEnd="url(#arrowT1gray)"
            />
            <text
              x="360"
              y="100"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="9"
            >
              SIGN &amp; LIST
            </text>

            {/* Sell Order Box */}
            <rect
              x="450"
              y="34"
              width="300"
              height="152"
              rx="6"
              fill="#12151c"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="60"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELL ORDER BOX
            </text>
            <line
              x1="470"
              y1="72"
              x2="730"
              y2="72"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="600"
              y="94"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              3 option tokens for sale
            </text>
            <text
              x="600"
              y="114"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              R4: seller SigmaProp
            </text>
            <text
              x="600"
              y="132"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              R5: [premium, feeRate, txFee]
            </text>
            <text
              x="600"
              y="150"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              R6: dApp fee ErgoTree
            </text>

            {/* Contract label */}
            <rect
              x="554"
              y="160"
              width="92"
              height="18"
              rx="3"
              fill="rgba(63,185,80,0.1)"
              stroke="rgba(63,185,80,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="600"
              y="173"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="9"
            >
              FixedPriceSell
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          R4 = seller{"'"}s SigmaProp, R5 = [premiumPerToken, dAppFeePer1000,
          txFee], R6 = dApp fee ErgoTree. The contract has two guards: the buy
          path (validates payment) and the seller{"'"}s SigmaProp (can always
          cancel with no restrictions).
        </Callout>
      </section>

      {/* SECTION 2: BUYING */}
      <section>
        <div className="section-label">Buyer Flow</div>
        <h2>Buying an Option</h2>
        <p className="section-text">
          A buyer browses the option chain, sees available contracts with
          premiums, and clicks {"\u201C"}Confirm Purchase.{"\u201D"} The buyer
          {"'"}s stablecoin goes to the seller. The option tokens go to the
          buyer. If there{"'"}s a dApp fee configured, a small cut goes to the
          fee address.
        </p>

        <div className="worked-example">
          <div className="ex-title">What You See (as buyer)</div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              Navigate to the asset{"'"}s trade page (e.g. ADA/USD)
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              Click a strike row to open the trade panel
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              See: available contracts, premium, {"\u201C"}If Exercised
              {"\u201D"} breakdown
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">4</div>
            <div className="ex-content">
              Set quantity, click {"\u201C"}Confirm Purchase{"\u201D"}
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">5</div>
            <div className="ex-content">Sign in Nautilus</div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">6</div>
            <div className="ex-content">
              Option tokens appear in your portfolio
            </div>
          </div>
        </div>

        {/* TODO: Replace with <Image src="/how-it-works/buy-option.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: Option chain + trade panel</em>
        </div>

        <Graphic>
          <svg
            viewBox="0 0 800 320"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridT2"
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
                id="arrowT2green"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrowT2copper"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#e09a5f"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="arrowT2purple"
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
            </defs>
            <rect width="800" height="320" fill="url(#gridT2)" />

            {/* Sell Order (input) */}
            <rect
              x="40"
              y="40"
              width="220"
              height="80"
              rx="6"
              fill="#12151c"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="66"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELL ORDER
            </text>
            <text
              x="150"
              y="86"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              3 tokens @ 0.18 USE each
            </text>
            <text
              x="150"
              y="104"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              FixedPriceSell contract
            </text>

            {/* Arrow: tokens to buyer */}
            <line
              x1="260"
              y1="60"
              x2="440"
              y2="60"
              stroke="#34d399"
              strokeWidth="1.5"
              markerEnd="url(#arrowT2green)"
            />
            <text
              x="350"
              y="52"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="9"
            >
              option tokens
            </text>

            {/* Buyer */}
            <rect
              x="450"
              y="30"
              width="300"
              height="80"
              rx="6"
              fill="#12151c"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="58"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              BUYER
            </text>
            <text
              x="600"
              y="80"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              receives 3 option tokens
            </text>
            <text
              x="600"
              y="98"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              ready to exercise or hold
            </text>

            {/* Arrow: stablecoin to seller */}
            <line
              x1="260"
              y1="100"
              x2="440"
              y2="170"
              stroke="#e09a5f"
              strokeWidth="1.5"
              markerEnd="url(#arrowT2copper)"
            />
            <text
              x="320"
              y="148"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="9"
            >
              stablecoin
            </text>

            {/* Seller receives payment */}
            <rect
              x="450"
              y="144"
              width="300"
              height="64"
              rx="6"
              fill="#12151c"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="170"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SELLER
            </text>
            <text
              x="600"
              y="192"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              receives 0.54 USE (3 {"\u00D7"} 0.18)
            </text>

            {/* Arrow: fee */}
            <line
              x1="260"
              y1="110"
              x2="440"
              y2="260"
              stroke="#a371f7"
              strokeWidth="1"
              strokeDasharray="4 2"
              markerEnd="url(#arrowT2purple)"
            />
            <text
              x="310"
              y="210"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="9"
            >
              optional fee
            </text>

            {/* Fee box */}
            <rect
              x="450"
              y="236"
              width="300"
              height="52"
              rx="6"
              fill="#12151c"
              stroke="rgba(163,113,247,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="260"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              DAPP FEE
            </text>
            <text
              x="600"
              y="278"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              if configured (dAppFeePer1000)
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The contract computes{" "}
          <code>tokensSold = inputTokens {"\u2212"} outputTokens</code>, then
          requires the seller to receive{" "}
          <code>
            tokensSold {"\u00D7"} premiumPerToken {"\u2212"} uiFee
          </code>{" "}
          in the correct stablecoin. Partial fills are supported — the successor
          sell box preserves R4{"\u2013"}R6 parameters.
        </Callout>
      </section>

      {/* SECTION 3: PARTIAL FILLS */}
      <section>
        <div className="section-label">Partial Fills</div>
        <h2>Buy Less Than Listed</h2>
        <p className="section-text">
          If a buyer takes fewer tokens than listed, the contract automatically
          creates a successor sell box with the remaining tokens. The successor
          preserves the original pricing parameters (R4{"\u2013"}R6), so the
          listing stays active at the same price. No action required from the
          seller — the contract handles it.
        </p>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Sell orders live on-chain at the FixedPriceSell contract. The seller
          {"'"}s key can always cancel. Partial fills create successor boxes
          automatically.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        prev={{
          href: "/how-it-works/writing-an-option",
          title: "Writing an Option",
        }}
        next={{ href: "/how-it-works/settlement", title: "Settlement" }}
      />
    </>
  );
}
