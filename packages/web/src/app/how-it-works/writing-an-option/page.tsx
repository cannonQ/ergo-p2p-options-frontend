import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Graphic from "../../learn/components/Graphic";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "Writing an Option | Etcha — How It Works",
  description:
    "You sign once. The bot handles mint and deliver automatically. Learn what happens on-chain when you write an option on Etcha.",
};

export default function WritingAnOptionPage() {
  return (
    <>
      <StepHeader current={1} />
      <h1>Writing an Option</h1>
      <p className="subtitle">
        You sign once. The bot does the rest. Three transactions happen in
        sequence — but you only touch the first one. Your collateral is locked
        in the smart contract within about a minute.
      </p>

      {/* SECTION 1: WHAT YOU SEE */}
      <section>
        <div className="section-label">The User Experience</div>
        <h2>What You See</h2>
        <p className="section-text">
          You fill in the option parameters — asset, strike price, expiry date,
          and how much collateral to lock. You sign one transaction in Nautilus.
          The progress tracker shows three stages: Create Definition, Mint
          Tokens, Deliver to Wallet. About a minute later, your tradeable option
          tokens are sitting in your wallet, ready to list for sale.
        </p>

        {/* TODO: Replace with <Image src="/how-it-works/write-flow.png" /> */}
        <div className="callout callout-neutral screenshot-placeholder">
          <em>Screenshot: Write option form + progress tracker</em>
        </div>
      </section>

      {/* SECTION 2: UNDER THE HOOD */}
      <section>
        <div className="section-label">Under the Hood</div>
        <h2>Three Transactions, One Signature</h2>

        <p className="section-text">
          <strong style={{ color: "#f0a040" }}>
            TX 1 — CREATE (you sign this)
          </strong>
          <br />
          Your collateral leaves your wallet and goes into a
          {" \u201C"}definition box{"\u201D"} at the contract address. This box
          holds your collateral plus a small ERG deposit (~0.013 ERG) that
          covers miner fees for the next two automated steps.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 220"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridW1"
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
                id="arrowW1gray"
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
            <rect width="800" height="220" fill="url(#gridW1)" />

            {/* Writer's Wallet */}
            <rect
              x="60"
              y="50"
              width="220"
              height="120"
              rx="6"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="170"
              y="78"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              YOUR WALLET
            </text>
            <line
              x1="80"
              y1="90"
              x2="260"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="170"
              y="112"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              Collateral (rsToken/ERG)
            </text>
            <text
              x="170"
              y="132"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              + 0.013 ERG (covers 3 TX fees)
            </text>
            <text
              x="170"
              y="152"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              + 0.01 ERG platform fee
            </text>

            {/* Arrow */}
            <line
              x1="280"
              y1="110"
              x2="440"
              y2="110"
              stroke="#8b949e"
              strokeWidth="1.5"
              markerEnd="url(#arrowW1gray)"
            />
            <text
              x="360"
              y="100"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              YOU SIGN
            </text>

            {/* Definition Box */}
            <rect
              x="450"
              y="50"
              width="280"
              height="120"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="590"
              y="78"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              DEFINITION BOX
            </text>
            <line
              x1="470"
              y1="90"
              x2="710"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="590"
              y="112"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              R4: option name
            </text>
            <text
              x="590"
              y="130"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              R8: 11 numerical params
            </text>
            <text
              x="590"
              y="148"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              R9: issuer key + fee addr
            </text>

            {/* Contract label */}
            <rect
              x="544"
              y="164"
              width="92"
              height="18"
              rx="3"
              fill="rgba(56,139,253,0.1)"
              stroke="rgba(56,139,253,0.3)"
              strokeWidth="0.5"
            />
            <text
              x="590"
              y="177"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              OptionReserveV4
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The definition box sits at the OptionReserveV4 contract address. R4
          holds the option name, R8 holds 11 numerical parameters (type, style,
          strike, expiry, etc.), R9 holds your public key and the fee address.
          No tokens are minted yet — this is just a deposit.
        </Callout>

        <p className="section-text" style={{ marginTop: "2rem" }}>
          <strong style={{ color: "#a371f7" }}>
            TX 2 — MINT (bot does this automatically)
          </strong>
          <br />
          The bot detects your definition box and creates the option tokens. In
          Ergo, a new token{"'"}s ID always equals the ID of the first input box
          — so the option token ID is guaranteed to be unique and unforgeable.
          The bot takes the 0.01 ERG mint fee from your deposit and sends it to
          the platform fee address.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 240"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridW2"
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
                id="arrowW2gray"
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
            <rect width="800" height="240" fill="url(#gridW2)" />

            {/* Definition Box */}
            <rect
              x="40"
              y="60"
              width="200"
              height="80"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x="140"
              y="88"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              DEFINITION BOX
            </text>
            <text
              x="140"
              y="110"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral + ERG deposit
            </text>
            <text
              x="140"
              y="128"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              no tokens yet
            </text>

            {/* Arrow to Reserve */}
            <line
              x1="240"
              y1="85"
              x2="420"
              y2="65"
              stroke="#8b949e"
              strokeWidth="1.5"
              markerEnd="url(#arrowW2gray)"
            />
            <text
              x="330"
              y="64"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="9"
            >
              BOT MINTS
            </text>

            {/* Arrow to Fee */}
            <line
              x1="240"
              y1="115"
              x2="420"
              y2="175"
              stroke="#8b949e"
              strokeWidth="1.5"
              markerEnd="url(#arrowW2gray)"
            />

            {/* Reserve Box */}
            <rect
              x="430"
              y="30"
              width="320"
              height="90"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="590"
              y="56"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              RESERVE BOX
            </text>
            <text
              x="590"
              y="78"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              N+1 option tokens minted
            </text>
            <text
              x="590"
              y="96"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              + all collateral preserved
            </text>

            {/* Fee Box */}
            <rect
              x="430"
              y="150"
              width="200"
              height="60"
              rx="6"
              fill="#161b22"
              stroke="rgba(163,113,247,0.4)"
              strokeWidth="1"
            />
            <text
              x="530"
              y="175"
              textAnchor="middle"
              fill="#a371f7"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              FEE BOX
            </text>
            <text
              x="530"
              y="196"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              0.01 ERG to Etcha
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The mint TX has <code>INPUTS.size == 1</code> (just the definition
          box) and <code>OUTPUTS.size == 3</code> (reserve, fee, miner). The
          contract validates the token count formula, checks the Token Registry
          to confirm the collateral matches the oracle feed, and verifies the
          fee output goes to the address stored in R9[1].
        </Callout>

        <p className="section-text" style={{ marginTop: "2rem" }}>
          <strong style={{ color: "#a371f7" }}>
            TX 3 — DELIVER (bot does this automatically)
          </strong>
          <br />
          The bot splits the reserve: it keeps the singleton in the contract and
          sends the tradeable tokens to your wallet. Now you hold N option
          tokens, ready to sell.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 220"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="gridW3"
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
                id="arrowW3gray"
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
                id="arrowW3green"
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
            <rect width="800" height="220" fill="url(#gridW3)" />

            {/* Reserve Box (input) */}
            <rect
              x="40"
              y="50"
              width="220"
              height="100"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="150"
              y="78"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              RESERVE (N+1 TOKENS)
            </text>
            <line
              x1="60"
              y1="90"
              x2="240"
              y2="90"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x="150"
              y="112"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral locked
            </text>
            <text
              x="150"
              y="130"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              N tradeable + 1 singleton
            </text>

            {/* Arrow to successor reserve */}
            <line
              x1="260"
              y1="80"
              x2="430"
              y2="55"
              stroke="#8b949e"
              strokeWidth="1.5"
              markerEnd="url(#arrowW3gray)"
            />

            {/* Arrow to wallet */}
            <line
              x1="260"
              y1="120"
              x2="430"
              y2="155"
              stroke="#3fb950"
              strokeWidth="1.5"
              markerEnd="url(#arrowW3green)"
            />
            <text
              x="345"
              y="150"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              N tokens
            </text>

            {/* Successor Reserve */}
            <rect
              x="440"
              y="24"
              width="300"
              height="70"
              rx="6"
              fill="#161b22"
              stroke="rgba(56,139,253,0.4)"
              strokeWidth="1"
            />
            <text
              x="590"
              y="50"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              RESERVE (1 SINGLETON)
            </text>
            <text
              x="590"
              y="72"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              collateral stays locked
            </text>

            {/* Writer Wallet */}
            <rect
              x="440"
              y="120"
              width="300"
              height="70"
              rx="6"
              fill="#161b22"
              stroke="rgba(240,160,64,0.4)"
              strokeWidth="1"
            />
            <text
              x="590"
              y="148"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="2"
            >
              YOUR WALLET
            </text>
            <text
              x="590"
              y="170"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              N tradeable option tokens
            </text>
          </svg>
        </Graphic>

        <Callout variant="neutral" label="On-chain detail">
          The contract checks <code>isMinted && !isOptionDelivered</code>,
          verifies the singleton stays in OUTPUT[0] with{" "}
          <code>tokens(0)._2 == 1</code>, and sends N tokens to the issuer
          address from R9[0]. All registers are preserved in the successor box.
        </Callout>
      </section>

      {/* SECTION 3: HOW MANY TOKENS */}
      <section>
        <div className="section-label">Token Count</div>
        <h2>How Many Tokens?</h2>
        <p className="section-text">
          The number of tradeable tokens depends on how much collateral you
          lock. The contract divides your total collateral by the per-contract
          amount, then adds one extra token — the singleton — that stays locked
          in the reserve forever as a receipt proving the contract exists.
        </p>

        <div className="worked-example">
          <div className="ex-title">
            Example: Gold Call (DexyGold collateral)
          </div>
          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              You lock <strong>93 DexyGold</strong> for a 0.001 oz/contract
              option. Each contract needs 31 DexyGold (0.001 oz{" \u00D7 "}
              31,103 mg/oz).
              <div className="math">
                93 / 31 = 3 tradeable tokens + 1 singleton = 4 total
              </div>
            </div>
          </div>
          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              You lock <strong>6 rsADA</strong> for a 2 ADA/contract option.
              Each contract needs 2,000,000 raw rsADA.
              <div className="math">
                6,000,000 / 2,000,000 = 3 tradeable + 1 singleton = 4 total
              </div>
            </div>
          </div>
        </div>

        <Callout variant="neutral" label="The +1 singleton">
          The singleton is a special token that stays locked in the reserve
          forever. It proves this contract exists and prevents the reserve from
          being drained. You never see it — it lives in the contract until the
          option is closed or all tokens are exercised.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          You sign once. The bot handles mint and deliver automatically. Your
          collateral is locked in the contract — only the smart contract decides
          where it goes.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        next={{ href: "/how-it-works/trading", title: "Trading Options" }}
      />
    </>
  );
}
