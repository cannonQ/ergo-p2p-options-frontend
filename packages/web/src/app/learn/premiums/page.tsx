import { Metadata } from "next";
import Takeaway from "../components/Takeaway";
import PageNav from "../components/PageNav";
import Callout from "../components/Callout";
import Graphic from "../components/Graphic";
import LessonHeader from "../components/LessonHeader";

export const metadata: Metadata = {
  title: "Premiums — What Options Cost | Etcha Learn",
  description:
    "A premium is the price you pay or collect for an option. Learn how intrinsic value, time value, and volatility drive option pricing on Etcha.",
};

export default function PremiumsPage() {
  return (
    <>
      <LessonHeader current={2} />
      <h1>Premiums — What Options Cost</h1>
      <p className="subtitle">
        A premium is the price you pay (or collect) for an option. It&apos;s
        driven by three forces: intrinsic value, time value, and volatility.
        Understanding these tells you whether a price is fair.
      </p>

      {/* SECTION 1: PREMIUM DECOMPOSITION HERO */}
      <section>
        <div className="section-label">Anatomy of a Premium</div>
        <h2>Two Components, One Price</h2>
        <p className="section-text">
          Think of a premium as two parts: the <strong>real value</strong> (what
          the option is worth if you used it right now) and the{" "}
          <strong>hope value</strong> (what it might be worth later). In trading
          terms, these are called intrinsic value and time value. Out-of-the-money
          options are pure hope value — the real value is zero.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 280"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid2a"
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
            <rect width="800" height="280" fill="url(#grid2a)" />

            {/* ITM OPTION */}
            <text
              x="400"
              y="30"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              ITM Call — Strike $0.25, Spot $0.30
            </text>

            {/* Bar background */}
            <rect
              x="80"
              y="50"
              width="640"
              height="48"
              rx="4"
              fill="rgba(255,255,255,0.03)"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            {/* Intrinsic segment (green) */}
            <rect
              x="80"
              y="50"
              width="256"
              height="48"
              rx="4"
              fill="rgba(63,185,80,0.15)"
              stroke="#3fb950"
              strokeWidth="1"
            />
            <text
              x="208"
              y="79"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              Intrinsic: $0.05
            </text>
            {/* Time value segment (amber) */}
            <rect
              x="336"
              y="50"
              width="384"
              height="48"
              rx="4"
              fill="rgba(240,160,64,0.12)"
              stroke="#f0a040"
              strokeWidth="1"
            />
            <text
              x="528"
              y="79"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="11"
            >
              Time Value: $0.10
            </text>
            {/* Total label */}
            <text
              x="730"
              y="79"
              textAnchor="start"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              = $0.15
            </text>

            {/* OTM OPTION */}
            <text
              x="400"
              y="140"
              textAnchor="middle"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              OTM Call — Strike $0.35, Spot $0.29
            </text>

            {/* Bar background */}
            <rect
              x="80"
              y="160"
              width="640"
              height="48"
              rx="4"
              fill="rgba(255,255,255,0.03)"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            {/* No intrinsic — all time value */}
            <rect x="80" y="160" width="0" height="48" rx="4" />
            <rect
              x="80"
              y="160"
              width="640"
              height="48"
              rx="4"
              fill="rgba(240,160,64,0.12)"
              stroke="#f0a040"
              strokeWidth="1"
            />
            <text
              x="400"
              y="189"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="11"
            >
              100% Time Value: $0.15 — Intrinsic = $0.00
            </text>
            <text
              x="730"
              y="189"
              textAnchor="start"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="11"
            >
              = $0.15
            </text>

            {/* Annotation */}
            <text
              x="400"
              y="240"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              OTM options have zero intrinsic value.
            </text>
            <text
              x="400"
              y="258"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              You&apos;re paying entirely for the possibility that price moves
              in your favor before expiry.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 2: INTRINSIC VALUE EXPLAINER */}
      <section>
        <div className="section-label">Intrinsic Value</div>
        <h2>In, At, or Out of the Money</h2>
        <p className="section-text">
          Intrinsic value is what the option would be worth if exercised right
          now. It&apos;s the gap between the current price and the strike — but
          it can never go negative.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 310"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid2b"
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
            <rect width="800" height="310" fill="url(#grid2b)" />

            {/* Labels column */}
            <text
              x="70"
              y="30"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
              letterSpacing="1"
            >
              CALL OPTION
            </text>

            {/* ITM ROW */}
            <rect
              x="80"
              y="50"
              width="680"
              height="68"
              rx="4"
              fill="rgba(63,185,80,0.05)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="100"
              y="72"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              ITM — In the Money
            </text>
            {/* Thermometer bar */}
            <rect
              x="100"
              y="86"
              width="400"
              height="18"
              rx="3"
              fill="rgba(255,255,255,0.04)"
            />
            {/* Price fill to strike */}
            <rect
              x="100"
              y="86"
              width="260"
              height="18"
              rx="3"
              fill="rgba(56,139,253,0.15)"
            />
            <text
              x="230"
              y="100"
              textAnchor="middle"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              Strike $0.25
            </text>
            {/* Price fill to spot */}
            <rect
              x="360"
              y="86"
              width="40"
              height="18"
              rx="3"
              fill="rgba(63,185,80,0.3)"
            />
            <text
              x="380"
              y="100"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              {"\u2191"}
            </text>
            {/* Spot marker */}
            <line
              x1="400"
              y1="82"
              x2="400"
              y2="108"
              stroke="#e6edf3"
              strokeWidth="1"
            />
            <text
              x="406"
              y="100"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Spot $0.30
            </text>
            {/* Intrinsic label */}
            <text
              x="600"
              y="76"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="12"
            >
              Intrinsic = $0.05
            </text>
            <text
              x="600"
              y="96"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.30 − $0.25 = $0.05
            </text>

            {/* ATM ROW */}
            <rect
              x="80"
              y="130"
              width="680"
              height="68"
              rx="4"
              fill="rgba(56,139,253,0.04)"
              stroke="rgba(56,139,253,0.15)"
              strokeWidth="0.5"
            />
            <text
              x="100"
              y="152"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              ATM — At the Money
            </text>
            <rect
              x="100"
              y="166"
              width="400"
              height="18"
              rx="3"
              fill="rgba(255,255,255,0.04)"
            />
            <rect
              x="100"
              y="166"
              width="300"
              height="18"
              rx="3"
              fill="rgba(56,139,253,0.15)"
            />
            <line
              x1="400"
              y1="162"
              x2="400"
              y2="188"
              stroke="#e6edf3"
              strokeWidth="1"
            />
            <text
              x="406"
              y="180"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Strike = Spot = $0.30
            </text>
            <text
              x="600"
              y="156"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="12"
            >
              Intrinsic = $0.00
            </text>
            <text
              x="600"
              y="176"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0.30 − $0.30 = $0.00
            </text>

            {/* OTM ROW */}
            <rect
              x="80"
              y="210"
              width="680"
              height="68"
              rx="4"
              fill="rgba(248,81,73,0.04)"
              stroke="rgba(248,81,73,0.12)"
              strokeWidth="0.5"
            />
            <text
              x="100"
              y="232"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="11"
              fontWeight="700"
            >
              OTM — Out of the Money
            </text>
            <rect
              x="100"
              y="246"
              width="400"
              height="18"
              rx="3"
              fill="rgba(255,255,255,0.04)"
            />
            <rect
              x="100"
              y="246"
              width="300"
              height="18"
              rx="3"
              fill="rgba(56,139,253,0.15)"
            />
            <line
              x1="400"
              y1="242"
              x2="400"
              y2="268"
              stroke="#e6edf3"
              strokeWidth="1"
            />
            <text
              x="406"
              y="260"
              fill="#e6edf3"
              fontFamily="Courier New"
              fontSize="9"
            >
              Spot $0.30
            </text>
            {/* Strike further right */}
            <line
              x1="440"
              y1="242"
              x2="440"
              y2="268"
              stroke="#388bfd"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <text
              x="446"
              y="260"
              fill="#388bfd"
              fontFamily="Courier New"
              fontSize="9"
            >
              Strike $0.35
            </text>
            <text
              x="600"
              y="236"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="12"
            >
              Intrinsic = $0.00
            </text>
            <text
              x="600"
              y="256"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              Can&apos;t go negative
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 3: TIME DECAY CURVE */}
      <section>
        <div className="section-label">Time Decay</div>
        <h2>The Clock Is Always Ticking</h2>
        <p className="section-text">
          Time value decays to zero at expiry. The decay speeds up in the
          final 30 days — slowly at first, then drops off a cliff. This is why writers
          prefer short-dated options and buyers want more time.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 380"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid2c"
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
            <rect width="800" height="380" fill="url(#grid2c)" />

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
              y1="300"
              x2="740"
              y2="300"
              stroke="#7d8590"
              strokeWidth="0.5"
            />

            {/* Y axis */}
            <text
              x="90"
              y="30"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Time Value
            </text>
            <text
              x="90"
              y="80"
              textAnchor="end"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              High
            </text>
            <text
              x="90"
              y="295"
              textAnchor="end"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              $0
            </text>

            {/* X axis labels */}
            <text
              x="140"
              y="320"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              90d
            </text>
            <text
              x="260"
              y="320"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              60d
            </text>
            <text
              x="400"
              y="320"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="10"
            >
              30d
            </text>
            <text
              x="520"
              y="320"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              14d
            </text>
            <text
              x="620"
              y="320"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              7d
            </text>
            <text
              x="700"
              y="320"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              1d
            </text>
            <text
              x="730"
              y="320"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              0
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
              {"\u2190"} Days to Expiration
            </text>

            {/* 30-day zone highlight */}
            <rect
              x="400"
              y="40"
              width="340"
              height="260"
              fill="rgba(248,81,73,0.04)"
            />
            <text
              x="570"
              y="60"
              textAnchor="middle"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="9"
              letterSpacing="1"
            >
              ACCELERATION ZONE
            </text>

            {/* Decay fill area */}
            <path
              d="M140,80 C200,85 300,100 400,160 C460,200 540,260 640,285 C680,293 720,298 730,300 L100,300 L100,80 Z"
              fill="rgba(240,160,64,0.08)"
            />

            {/* Decay curve */}
            <path
              d="M140,80 C200,85 300,100 400,160 C460,200 540,260 640,285 C680,293 720,298 730,300"
              stroke="#f0a040"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Annotations */}
            <text
              x="220"
              y="110"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="10"
            >
              {"\u2190"} Slow decay here
            </text>
            <text
              x="230"
              y="126"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Buyers want this zone
            </text>

            <text
              x="560"
              y="240"
              fill="#f85149"
              fontFamily="Courier New"
              fontSize="10"
            >
              Fast decay here {"\u2192"}
            </text>
            <text
              x="560"
              y="256"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="10"
            >
              Writers want this zone
            </text>

            {/* Theta annotation */}
            <text
              x="400"
              y="370"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              Time decay (traders call it &quot;theta&quot;) is always
              working against the buyer.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 4: VOLATILITY IMPACT */}
      <section>
        <div className="section-label">Volatility</div>
        <h2>Higher Uncertainty = Higher Premium</h2>
        <p className="section-text">
          Volatile assets command larger premiums because there&apos;s a wider
          range of possible outcomes. The same option on a calm asset costs less
          than on a wild one.
        </p>

        <Graphic>
          <svg
            viewBox="0 0 800 340"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <defs>
              <pattern
                id="grid2d"
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
            <rect width="800" height="340" fill="url(#grid2d)" />

            {/* LOW VOLATILITY: Gold */}
            <text
              x="200"
              y="30"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              Gold — Low Volatility
            </text>

            {/* Bell curve: tight */}
            <path
              d="M60,260 C80,258 100,250 130,220 C160,170 175,100 200,80 C225,100 240,170 270,220 C300,250 320,258 340,260"
              stroke="#f0a040"
              strokeWidth="2"
              fill="rgba(240,160,64,0.08)"
            />
            <line
              x1="60"
              y1="260"
              x2="340"
              y2="260"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            {/* Strike line */}
            <line
              x1="200"
              y1="40"
              x2="200"
              y2="260"
              stroke="#388bfd"
              strokeWidth="0.5"
              strokeDasharray="3 2"
            />
            {/* Range arrows */}
            <line
              x1="130"
              y1="240"
              x2="270"
              y2="240"
              stroke="rgba(240,160,64,0.5)"
              strokeWidth="1"
            />
            <text
              x="200"
              y="235"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="9"
            >
              Narrow range
            </text>
            {/* Premium box */}
            <rect
              x="120"
              y="278"
              width="160"
              height="30"
              rx="4"
              fill="rgba(240,160,64,0.08)"
              stroke="rgba(240,160,64,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="200"
              y="298"
              textAnchor="middle"
              fill="#f0a040"
              fontFamily="Courier New"
              fontSize="11"
            >
              Premium: 8 SigUSD
            </text>

            {/* HIGH VOLATILITY: ERG */}
            <text
              x="600"
              y="30"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="12"
              fontWeight="700"
            >
              ERG — High Volatility
            </text>

            {/* Bell curve: wide and flat */}
            <path
              d="M420,260 C440,258 470,248 510,220 C540,195 565,140 600,120 C635,140 660,195 690,220 C730,248 760,258 780,260"
              stroke="#3fb950"
              strokeWidth="2"
              fill="rgba(63,185,80,0.08)"
            />
            <line
              x1="420"
              y1="260"
              x2="780"
              y2="260"
              stroke="#7d8590"
              strokeWidth="0.5"
            />
            {/* Strike line */}
            <line
              x1="600"
              y1="40"
              x2="600"
              y2="260"
              stroke="#388bfd"
              strokeWidth="0.5"
              strokeDasharray="3 2"
            />
            {/* Range arrows */}
            <line
              x1="480"
              y1="240"
              x2="720"
              y2="240"
              stroke="rgba(63,185,80,0.5)"
              strokeWidth="1"
            />
            <text
              x="600"
              y="235"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="9"
            >
              Wide range
            </text>
            {/* Premium box */}
            <rect
              x="520"
              y="278"
              width="160"
              height="30"
              rx="4"
              fill="rgba(63,185,80,0.08)"
              stroke="rgba(63,185,80,0.2)"
              strokeWidth="0.5"
            />
            <text
              x="600"
              y="298"
              textAnchor="middle"
              fill="#3fb950"
              fontFamily="Courier New"
              fontSize="11"
            >
              Premium: 22 SigUSD
            </text>

            {/* Explanation */}
            <text
              x="400"
              y="330"
              textAnchor="middle"
              fill="#7d8590"
              fontFamily="Courier New"
              fontSize="11"
            >
              Same strike distance from spot. Higher volatility = wider
              distribution = more expensive option.
            </text>
          </svg>
        </Graphic>
      </section>

      {/* SECTION 5: WORKED EXAMPLE */}
      <section>
        <div className="section-label">Worked Example</div>
        <h2>Pricing a Call on Etcha</h2>

        <div className="worked-example">
          <div className="ex-title">
            30-Day ERG $0.35 Call — Spot: $0.29
          </div>

          <div className="ex-scenario">
            <div className="ex-number">1</div>
            <div className="ex-content">
              <strong>Intrinsic value: $0.00</strong> — The call is OTM. Strike
              ($0.35) is above spot ($0.29). You can&apos;t exercise it for
              profit right now.
            </div>
          </div>

          <div className="ex-scenario">
            <div className="ex-number">2</div>
            <div className="ex-content">
              <strong>Time value: 15 SigUSD</strong> — 30 days until expiry.
              ERG is volatile. The market prices in the possibility of ERG
              reaching $0.35+.
            </div>
          </div>

          <div className="ex-scenario">
            <div className="ex-number">3</div>
            <div className="ex-content">
              <strong>Total premium: 15 SigUSD</strong> — This is what the
              writer lists the option for on Etcha{"'"}s marketplace. The pricing
              tool on Etcha suggests this price; the writer chose to match it.
              <div className="math">
                Premium = $0.00 intrinsic + 15 SigUSD time value
              </div>
            </div>
          </div>

          <div className="ex-scenario">
            <div className="ex-number">4</div>
            <div className="ex-content">
              At expiry, ERG = $0.50 {"\u2192"}
              <div className="math">
                Profit = ($0.50 − $0.35) × number of contracts − 15 SigUSD
              </div>
              At expiry, ERG = $0.29 {"\u2192"}
              <div className="math loss">
                Loss = 15 SigUSD (premium). The time value decayed to zero.
              </div>
            </div>
          </div>
        </div>

        <Callout variant="amber" label="Etcha-specific">
          <strong>The pricing tool is a suggestion, not a guaranteed fill.</strong> The
          option contract has no concept of premiums. The premium is set by the writer
          when they list the option for sale. The writer prices it; the market decides
          if it&apos;s fair. Implied volatility and pricing indicators on the Etcha UI
          are tools to help — the contract enforces only strike, oracle price,
          collateral, and expiry.
        </Callout>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Premium = intrinsic value + time value. Writers collect it. Buyers pay
          it. Time is always working against the buyer and for the writer.
          Volatility drives premium higher — more uncertainty means more
          expensive insurance.
        </p>
      </Takeaway>

      <PageNav
        prev={{ href: "/learn/calls-and-puts", title: "Calls & Puts" }}
        next={{
          href: "/learn/writing-options",
          title: "Writing Options — Earning Premium",
        }}
      />
    </>
  );
}
