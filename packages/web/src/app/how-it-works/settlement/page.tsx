import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Graphic from "../../learn/components/Graphic";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "Settlement | Etcha — How It Works",
  description:
    "Exercise in-the-money options, close expired reserves, or refund before mint. Learn what happens on-chain at every settlement path.",
};

export default function SettlementPage() {
  return (
    <>
      <StepHeader current={3} />
      <h1>Settlement</h1>
      <p className="subtitle">
        This is where the economics play out. Exercise burns tokens and moves
        collateral. Close returns collateral after expiry. Refund lets writers
        reclaim before mint.
      </p>

      {/* SECTION 1: EXERCISING */}
      <section>
        <div className="section-label">Buyer Action</div>
        <h2>Exercising an Option</h2>
        <p className="section-text">
          If the market has moved in your favor, you can exercise your option to
          trade at the locked-in strike price. For a call: you pay the strike in
          stablecoin and receive the underlying collateral. For a put: you send
          the underlying and receive stablecoin.
        </p>

        <div className="worked-example">
          <div className="ex-title">What You See</div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              Your portfolio shows {"\u201C"}Exercisable{"\u201D"} on the option
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              Click {"\u201C"}Exercise{"\u201D"} — the dialog shows exactly what
              you{"'"}ll pay and receive
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              Sign in Nautilus (you{"'"}ll see a {"\u201C"}Burning{"\u201D"}{" "}
              warning — that{"'"}s normal, your option tokens are being
              destroyed)
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">4</div>
            <div className="ex-content">
              Success: collateral arrives in your wallet, strike payment sent to
              writer
            </div>
          </div>
        </div>

        {/* TODO: Replace with <Image src="/how-it-works/exercise.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: Exercise dialog</em>
        </div>

        <Graphic>
          <svg
            viewBox="0 0 800 360"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridS1"
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
                id="arrowS1green"
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
                id="arrowS1copper"
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
                id="arrowS1red"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1"
                />
              </marker>
            </defs>
            <rect width="800" height="360" fill="url(#gridS1)" />

            {/* Reserve Box (input) */}
            <rect
              x="40"
              y="40"
              width="220"
              height="100"
              rx="6"
              fill="#12151c"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="66"
              textAnchor="middle"
              fill="#60a5fa"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              RESERVE BOX
            </text>
            <line
              x1="60"
              y1="78"
              x2="240"
              y2="78"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="150"
              y="100"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              1 singleton + collateral
            </text>
            <text
              x="150"
              y="118"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              locked at contract address
            </text>

            {/* Arrow: collateral to buyer */}
            <line
              x1="260"
              y1="70"
              x2="440"
              y2="55"
              stroke="#34d399"
              strokeWidth="1.5"
              markerEnd="url(#arrowS1green)"
            />
            <text
              x="350"
              y="52"
              textAnchor="middle"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="9"
            >
              collateral
            </text>

            {/* Buyer receives */}
            <rect
              x="450"
              y="24"
              width="300"
              height="70"
              rx="6"
              fill="#12151c"
              stroke="rgba(63,185,80,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="50"
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
              y="72"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              receives rsADA / DexyGold / ERG
            </text>

            {/* Arrow: stablecoin to writer */}
            <line
              x1="260"
              y1="110"
              x2="440"
              y2="145"
              stroke="#e09a5f"
              strokeWidth="1.5"
              markerEnd="url(#arrowS1copper)"
            />
            <text
              x="340"
              y="140"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="9"
            >
              strike (stablecoin)
            </text>

            {/* Writer receives */}
            <rect
              x="450"
              y="118"
              width="300"
              height="70"
              rx="6"
              fill="#12151c"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="144"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              WRITER
            </text>
            <text
              x="600"
              y="170"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              receives strike in USE / SigUSD
            </text>

            {/* Arrow: tokens burned */}
            <line
              x1="150"
              y1="140"
              x2="150"
              y2="220"
              stroke="#f87171"
              strokeWidth="1.5"
              markerEnd="url(#arrowS1red)"
            />

            {/* BURNED */}
            <rect
              x="60"
              y="226"
              width="180"
              height="50"
              rx="6"
              fill="rgba(248,81,73,0.08)"
              stroke="rgba(248,81,73,0.4)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="250"
              textAnchor="middle"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              OPTION TOKENS
            </text>
            <text
              x="150"
              y="266"
              textAnchor="middle"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              BURNED
            </text>

            {/* Why burned explanation */}
            <rect
              x="40"
              y="296"
              width="720"
              height="44"
              rx="4"
              fill="rgba(248,81,73,0.06)"
              stroke="rgba(248,81,73,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="56"
              y="316"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              WHY BURN?
            </text>
            <text
              x="140"
              y="316"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              Prevents double exercise. Without burning, the same token could
            </text>
            <text
              x="56"
              y="332"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              drain the reserve multiple times. Contract requires exactly 1
              token (singleton) across all outputs.
            </text>
          </svg>
        </Graphic>

        <Callout variant="amber" label="Real examples">
          <strong>rsADA Call $0.15, 2 contracts:</strong> You pay 600 raw USE
          ($0.60) to the writer. You receive 4,000,000 raw rsADA (4 ADA) from
          the reserve. Your 2 option tokens are burned.
          <br />
          <br />
          <strong>Gold Call $3400, 1 contract:</strong> You pay 1,700 raw USE
          ($1.70) to the writer. You receive 15 DexyGold from the reserve. Your
          1 option token is burned.
        </Callout>

        <Callout variant="neutral" label="On-chain detail">
          The TX has the reserve box + buyer{"'"}s wallet boxes as inputs, and
          Token Registry as a data input. The contract validates:{" "}
          <code>isInExerciseWindow</code> (American: anytime before maturity+720,
          European: only after maturity), Registry confirms token rates,{" "}
          <code>allExercisedTokensBurned</code> (option tokens in all outputs ==
          1).
        </Callout>
      </section>

      {/* SECTION 2: CLOSING AFTER EXPIRY */}
      <section>
        <div className="section-label">Writer Action</div>
        <h2>Closing After Expiry</h2>
        <p className="section-text">
          If the option expires without being fully exercised, the writer gets
          their remaining collateral back. This can be done by anyone — no
          signature needed. The bot does it automatically.
        </p>

        <div className="worked-example">
          <div className="ex-title">What You See</div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              After the exercise window passes, your portfolio shows{" "}
              {"\u201C"}Closeable after expiry{"\u201D"}
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              Click {"\u201C"}Close{"\u201D"} (or the bot does it for you)
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              Your collateral returns to your wallet
            </div>
          </div>
        </div>

        {/* TODO: Replace with <Image src="/how-it-works/close-expired.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: Close expired reserve in portfolio</em>
        </div>

        <Graphic>
          <svg
            viewBox="0 0 800 250"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridS2"
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
                id="arrowS2copper"
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
                id="arrowS2red"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1"
                />
              </marker>
            </defs>
            <rect width="800" height="250" fill="url(#gridS2)" />

            {/* Reserve Box (expired) */}
            <rect
              x="40"
              y="50"
              width="240"
              height="100"
              rx="6"
              fill="#12151c"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="160"
              y="76"
              textAnchor="middle"
              fill="#60a5fa"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              RESERVE (EXPIRED)
            </text>
            <line
              x1="60"
              y1="88"
              x2="260"
              y2="88"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="160"
              y="108"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              1 singleton + all remaining
            </text>
            <text
              x="160"
              y="126"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral
            </text>
            <text
              x="160"
              y="144"
              textAnchor="middle"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="9"
            >
              HEIGHT &gt; maturity + 720
            </text>

            {/* Arrow: collateral to writer */}
            <line
              x1="280"
              y1="80"
              x2="440"
              y2="60"
              stroke="#e09a5f"
              strokeWidth="1.5"
              markerEnd="url(#arrowS2copper)"
            />
            <text
              x="360"
              y="58"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="9"
            >
              all collateral
            </text>

            {/* Writer receives */}
            <rect
              x="450"
              y="30"
              width="300"
              height="70"
              rx="6"
              fill="#12151c"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="56"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              WRITER
            </text>
            <text
              x="600"
              y="78"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              receives all remaining collateral
            </text>

            {/* Arrow: singleton burned */}
            <line
              x1="280"
              y1="120"
              x2="440"
              y2="160"
              stroke="#f87171"
              strokeWidth="1.5"
              markerEnd="url(#arrowS2red)"
            />
            <text
              x="340"
              y="150"
              textAnchor="middle"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="9"
            >
              singleton
            </text>

            {/* Burned */}
            <rect
              x="450"
              y="130"
              width="200"
              height="50"
              rx="6"
              fill="rgba(248,81,73,0.08)"
              stroke="rgba(248,81,73,0.4)"
              strokeWidth="1"
            />
            <text
              x="550"
              y="156"
              textAnchor="middle"
              fill="#f87171"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              SINGLETON BURNED
            </text>
            <text
              x="550"
              y="172"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              not included in any output
            </text>

            {/* No signature note */}
            <rect
              x="40"
              y="200"
              width="720"
              height="36"
              rx="4"
              fill="rgba(63,185,80,0.06)"
              stroke="rgba(63,185,80,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="56"
              y="222"
              fill="#34d399"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              PERMISSIONLESS
            </text>
            <text
              x="200"
              y="222"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              No signature needed. Collateral ALWAYS goes to the writer{"'"}s
              address from R9[0], regardless of who submits.
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The contract requires{" "}
          <code>HEIGHT &gt; maturityDate + EXERCISE_WINDOW</code>,{" "}
          <code>OUTPUTS.size == 2</code>,{" "}
          <code>OUTPUTS(0).propositionBytes == issuerPropBytes</code>, and{" "}
          <code>OUTPUTS(0).value &gt;= SELF.value - txFee</code>. The singleton
          is implicitly burned by not being included in any output.
        </Callout>
      </section>

      {/* SECTION 3: REFUNDING BEFORE MINT */}
      <section>
        <div className="section-label">Writer Safety Net</div>
        <h2>Refunding Before Mint</h2>
        <p className="section-text">
          If you change your mind before the bot mints, you can reclaim your
          definition box. This is the only settlement action that requires the
          writer{"'"}s private key signature — it proves you own the collateral.
        </p>

        <div className="worked-example">
          <div className="ex-title">What You See</div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              Your portfolio shows the definition under {"\u201C"}Pending Boxes
              {"\u201D"}
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              Click {"\u201C"}Reclaim{"\u201D"}
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">Sign in Nautilus</div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">4</div>
            <div className="ex-content">
              Collateral returns to your wallet
            </div>
          </div>
        </div>

        {/* TODO: Replace with <Image src="/how-it-works/refund.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: Reclaim pending definition box</em>
        </div>

        <Graphic>
          <svg
            viewBox="0 0 800 180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridS3"
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
                id="arrowS3copper"
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
            </defs>
            <rect width="800" height="180" fill="url(#gridS3)" />

            {/* Definition Box */}
            <rect
              x="40"
              y="40"
              width="260"
              height="100"
              rx="6"
              fill="#12151c"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="170"
              y="66"
              textAnchor="middle"
              fill="#60a5fa"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              DEFINITION BOX
            </text>
            <line
              x1="60"
              y1="78"
              x2="280"
              y2="78"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="170"
              y="100"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral + ERG deposit
            </text>
            <text
              x="170"
              y="118"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              NOT YET MINTED
            </text>

            {/* Arrow */}
            <line
              x1="300"
              y1="90"
              x2="460"
              y2="90"
              stroke="#e09a5f"
              strokeWidth="1.5"
              markerEnd="url(#arrowS3copper)"
            />
            <text
              x="380"
              y="80"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="9"
            >
              WRITER SIGNS
            </text>

            {/* Writer Wallet */}
            <rect
              x="470"
              y="40"
              width="280"
              height="100"
              rx="6"
              fill="#12151c"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="610"
              y="66"
              textAnchor="middle"
              fill="#e09a5f"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              WRITER WALLET
            </text>
            <line
              x1="490"
              y1="78"
              x2="730"
              y2="78"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="610"
              y="100"
              textAnchor="middle"
              fill="#e8eaf0"
              fontFamily="Courier New"
              fontSize="11"
            >
              everything returned
            </text>
            <text
              x="610"
              y="118"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral + ERG deposit
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The contract guard requires{" "}
          <code>proveDlog(issuerECPoint) AND !isMinted</code> — the writer must
          prove they own the key stored in R9[0], and the box must not have been
          minted yet. Once minted, this path is permanently closed.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Exercise burns tokens to prevent double-spending. Close returns
          collateral after expiry — anyone can submit it. Refund lets writers
          reclaim before mint.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        prev={{ href: "/how-it-works/trading", title: "Trading Options" }}
        next={{
          href: "/how-it-works/cancel-and-manage",
          title: "Cancel & Manage",
        }}
      />
    </>
  );
}
