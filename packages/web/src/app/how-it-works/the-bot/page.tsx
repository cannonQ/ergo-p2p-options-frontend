import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Graphic from "../../learn/components/Graphic";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "The Bot | Etcha — How It Works",
  description:
    "The Etcha bot automates minting, delivery, and expiry closing. It's open source, permissionless, and can't steal anything — the contract is the authority.",
};

export default function TheBotPage() {
  return (
    <>
      <StepHeader current={5} />
      <h1>The Bot</h1>
      <p className="subtitle">
        The bot automates the mechanical steps — mint, deliver, close. It{"'"}s
        open source, permissionless, and constrained by the smart contract. If it
        disappears, nothing is lost.
      </p>

      {/* SECTION 1: INFRASTRUCTURE */}
      <section>
        <div className="section-label">Infrastructure</div>
        <h2>What Needs to Be Running</h2>
        <p className="section-text">
          Etcha requires three components. No external proof servers, no
          centralized APIs, no proprietary backends.
        </p>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Component</th>
                <th>What It Does</th>
                <th>Required?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Ergo Node</td>
                <td>Reads chain state, submits TXs</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td className="row-label">Frontend (Next.js)</td>
                <td>UI + API routes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td className="row-label">Bot (packages/bot)</td>
                <td>Auto mints, delivers, closes</td>
                <td>Yes for automation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="section-text" style={{ marginTop: "1.5rem" }}>
          Optional services that enhance but are not required for core
          functionality:
        </p>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Service</th>
                <th>Purpose</th>
                <th>When Needed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Supabase</td>
                <td>Sparkline price charts</td>
                <td>Only for charts</td>
              </tr>
              <tr>
                <td className="row-label">ergopay</td>
                <td>TX reduction for mobile</td>
                <td>Only for mobile QR signing</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="section-text" style={{ marginTop: "1.5rem" }}>
          Everything reads from the chain. Oracle prices, registry rates, reserve
          state — all on-chain. No off-chain price feeds.
        </p>
      </section>

      {/* SECTION 2: THE BOT */}
      <section>
        <div className="section-label">Automation</div>
        <h2>Open Source, Permissionless, Any Mnemonic</h2>
        <p className="section-text">
          The bot watches for new option definitions and handles mint + deliver.
          It also auto-closes expired reserves. The source code is fully open —
          anyone can run it. It doesn{"'"}t matter whose mnemonic it uses because
          the contract paths the bot uses are all permissionless.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridB1"
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
                id="arrBotG"
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
            <rect width="800" height="180" fill="url(#gridB1)" />

            {/* Bot */}
            <rect
              x="40"
              y="40"
              width="140"
              height="100"
              rx="6"
              fill="#12151c"
              stroke="rgba(163,113,247,0.4)"
              strokeWidth="1"
            />
            <text
              x="110"
              y="68"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              BOT
            </text>
            <line
              x1="56"
              y1="78"
              x2="164"
              y2="78"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="110"
              y="98"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              any mnemonic
            </text>
            <text
              x="110"
              y="114"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              open source
            </text>
            <text
              x="110"
              y="130"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              permissionless
            </text>

            {/* Arrows to actions */}
            <line
              x1="180"
              y1="70"
              x2="250"
              y2="50"
              stroke="#a371f7"
              strokeWidth="1"
              markerEnd="url(#arrBotG)"
            />
            <line
              x1="180"
              y1="90"
              x2="250"
              y2="90"
              stroke="#a371f7"
              strokeWidth="1"
              markerEnd="url(#arrBotG)"
            />
            <line
              x1="180"
              y1="110"
              x2="250"
              y2="130"
              stroke="#a371f7"
              strokeWidth="1"
              markerEnd="url(#arrBotG)"
            />

            {/* Mint */}
            <rect
              x="255"
              y="30"
              width="140"
              height="38"
              rx="4"
              fill="rgba(163,113,247,0.06)"
              stroke="rgba(163,113,247,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="325"
              y="54"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
            >
              Mint tokens
            </text>

            {/* Deliver */}
            <rect
              x="255"
              y="72"
              width="140"
              height="38"
              rx="4"
              fill="rgba(163,113,247,0.06)"
              stroke="rgba(163,113,247,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="325"
              y="96"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
            >
              Deliver to writer
            </text>

            {/* Close */}
            <rect
              x="255"
              y="114"
              width="140"
              height="38"
              rx="4"
              fill="rgba(163,113,247,0.06)"
              stroke="rgba(163,113,247,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="325"
              y="138"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
            >
              Close expired
            </text>

            {/* Contract validation */}
            <rect
              x="460"
              y="50"
              width="300"
              height="80"
              rx="6"
              fill="#12151c"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="610"
              y="75"
              textAnchor="middle"
              fill="#60a5fa"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              ERGOSCRIPT CONTRACT
            </text>
            <text
              x="610"
              y="95"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              validates every TX the bot submits
            </text>
            <text
              x="610"
              y="112"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="9"
            >
              rejects anything that violates the rules
            </text>

            {/* Arrow from actions to contract */}
            <line
              x1="395"
              y1="90"
              x2="455"
              y2="90"
              stroke="#8b949e"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <text
              x="425"
              y="84"
              textAnchor="middle"
              fill="#9da5b8"
              fontFamily="Courier New"
              fontSize="8"
            >
              submit
            </text>
          </svg>
        </Graphic>

        <p className="section-text">Starting the bot:</p>

        <pre>
          <code>
            {`source ~/.secrets && cd ~/ergo-options-ui/packages/bot && \\
  BOT_MNEMONIC="your-mnemonic-here" \\
  ERGO_NODE=http://localhost:9053 \\
  npx tsx src/index.ts`}
          </code>
        </pre>
      </section>

      {/* SECTION 3: WHY IT CAN'T STEAL */}
      <section>
        <div className="section-label">Safety</div>
        <h2>Why the Bot Can{"'"}t Steal Anything</h2>
        <p className="section-text">
          Every action the bot takes is constrained by the ErgoScript contract.
          The bot constructs and submits transactions, but the Ergo node only
          accepts them if the contract evaluates to <code>true</code>.
        </p>

        <div className="side-by-side">
          <div
            className="side-card"
            style={{ borderColor: "rgba(163,113,247,0.3)" }}
          >
            <div className="sc-title" style={{ color: "#a371f7" }}>
              Mint
            </div>
            Token count matches the formula exactly (can{"'"}t mint extra)
            <br />
            <br />
            Collateral preserved in the reserve (can{"'"}t redirect it)
            <br />
            <br />
            Fee output goes to address in R9[1] (can{"'"}t redirect the fee)
            <br />
            <br />
            All registers preserved (can{"'"}t tamper with parameters)
          </div>
          <div
            className="side-card"
            style={{ borderColor: "rgba(163,113,247,0.3)" }}
          >
            <div className="sc-title" style={{ color: "#a371f7" }}>
              Deliver
            </div>
            Tokens go to writer{"'"}s address from R9[0] (can{"'"}t send
            elsewhere)
            <br />
            <br />
            Singleton stays in the reserve (can{"'"}t extract it)
            <br />
            <br />
            Collateral stays in the reserve (can{"'"}t touch it)
          </div>
        </div>

        <div className="side-by-side" style={{ marginTop: "0.75rem" }}>
          <div
            className="side-card"
            style={{ borderColor: "rgba(163,113,247,0.3)" }}
          >
            <div className="sc-title" style={{ color: "#a371f7" }}>
              Close Expired
            </div>
            Block height past maturity + 720 (can{"'"}t close early)
            <br />
            <br />
            ALL collateral goes to writer{"'"}s address from R9[0] (can{"'"}t
            redirect)
            <br />
            <br />
            Exactly 2 outputs (can{"'"}t add extra recipients)
          </div>
        </div>

        <Callout variant="neutral">
          A malicious bot can construct any TX it wants — but the Ergo node
          rejects it if the contract evaluates to <code>false</code>.
        </Callout>
      </section>

      {/* SECTION 4: RESILIENCE */}
      <section>
        <div className="section-label">Resilience</div>
        <h2>What if the Bot Goes Down?</h2>
        <p className="section-text">
          Nothing is lost. The bot is a convenience layer, not a dependency.
        </p>

        <ul>
          <li>
            <strong>Definition waiting to be minted?</strong> Anyone can submit
            the mint TX. The contract doesn{"'"}t care who submits it.
          </li>
          <li>
            <strong>Reserve waiting for delivery?</strong> Anyone can submit the
            deliver TX. Tokens always go to the writer{"'"}s address in R9[0].
          </li>
          <li>
            <strong>Option expired?</strong> Anyone can close it. Collateral
            always returns to the writer.
          </li>
          <li>
            <strong>Want to exercise?</strong> The buyer does this directly from
            the frontend — the bot isn{"'"}t involved at all.
          </li>
        </ul>

        <p className="section-text">
          If the bot disappears entirely, a new operator can spin up a fresh
          instance with any mnemonic and it will pick up right where the old one
          left off. The chain state IS the state — the bot has no memory that
          matters.
        </p>

        <p className="section-text">
          Multiple bots can run simultaneously. If two bots try to mint the same
          definition, one succeeds and the other gets a harmless
          &quot;double-spending&quot; error. First-come, first-served. The more
          bots running, the faster options get processed.
        </p>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          The bot is a convenience layer, not a dependency. The contract is the
          authority. Anyone can run a bot, and if all bots disappear, nothing is
          lost.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        prev={{
          href: "/how-it-works/cancel-and-manage",
          title: "Cancel & Manage",
        }}
        next={{ href: "/how-it-works/security", title: "Security & Trust" }}
      />
    </>
  );
}
