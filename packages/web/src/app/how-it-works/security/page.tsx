import { Metadata } from "next";
import StepHeader from "../components/StepHeader";
import Callout from "../../learn/components/Callout";
import Takeaway from "../../learn/components/Takeaway";
import PageNav from "../../learn/components/PageNav";

export const metadata: Metadata = {
  title: "Security & Trust Model | Etcha — How It Works",
  description:
    "The smart contract is the only thing you need to trust. Every action is validated by ErgoScript on-chain. The bot, frontend, and node are replaceable.",
};

export default function SecurityPage() {
  return (
    <>
      <StepHeader current={6} />
      <h1>Security &amp; Trust Model</h1>
      <p className="subtitle">
        Trust the contract, not the infrastructure. Every action is validated by
        ErgoScript on-chain. The bot, frontend, and node are replaceable — the
        contract is permanent.
      </p>

      {/* SECTION 1: SECURITY MODEL */}
      <section>
        <div className="section-label">Security</div>
        <h2>Security Model</h2>
        <p className="section-text">
          Every concern about trust has a concrete, verifiable answer rooted in
          the smart contract.
        </p>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Concern</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Can the bot steal collateral?</td>
                <td>
                  No — contract enforces destination address from R9
                </td>
              </tr>
              <tr>
                <td className="row-label">Can the bot mint extra tokens?</td>
                <td>
                  No — contract validates token count formula
                </td>
              </tr>
              <tr>
                <td className="row-label">Can the bot redirect fees?</td>
                <td>
                  No — contract checks fee output matches R9[1]
                </td>
              </tr>
              <tr>
                <td className="row-label">Can someone exercise twice?</td>
                <td>
                  No — burn verification requires tokens destroyed
                </td>
              </tr>
              <tr>
                <td className="row-label">What if the bot disappears?</td>
                <td>
                  Nothing lost — anyone can submit the same TXs
                </td>
              </tr>
              <tr>
                <td className="row-label">
                  What if someone runs a bad bot?
                </td>
                <td>
                  Can{"'"}t do anything the contract doesn{"'"}t allow
                </td>
              </tr>
              <tr>
                <td className="row-label">
                  Is any off-chain server trusted?
                </td>
                <td>
                  No — all state is on-chain, read from Ergo node
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: THE CONTRACT IS THE AUTHORITY */}
      <section>
        <div className="section-label">Trust</div>
        <h2>The Contract Is the Authority</h2>
        <p className="section-text">
          The smart contract is the only thing you need to trust. It holds the
          collateral. It validates every transaction. It enforces every rule. The
          bot constructs transactions, but the Ergo node rejects anything the
          contract doesn{"'"}t approve. The frontend displays data, but it
          reads everything from the chain. The node is your source of truth, but
          any Ergo node will give the same answers.
        </p>

        <Callout variant="green">
          The smart contract is the only thing you need to trust. Everything
          else — the bot, the frontend, the node — is just tooling to interact
          with it.
        </Callout>
      </section>

      {/* SECTION 3: GLOSSARY */}
      <section>
        <div className="section-label">Reference</div>
        <h2>Glossary</h2>

        <div className="graphic" style={{ padding: 0, overflow: "hidden" }}>
          <table className="comp-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Term</th>
                <th style={{ textAlign: "left" }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Writer</td>
                <td>
                  The person who creates an option by locking collateral
                </td>
              </tr>
              <tr>
                <td className="row-label">Buyer</td>
                <td>
                  The person who purchases an option token and can exercise it
                </td>
              </tr>
              <tr>
                <td className="row-label">Collateral</td>
                <td>
                  The underlying asset locked in the contract (rsADA, DexyGold,
                  ERG, stablecoin)
                </td>
              </tr>
              <tr>
                <td className="row-label">Strike price</td>
                <td>
                  The agreed price at which the buyer can exercise
                </td>
              </tr>
              <tr>
                <td className="row-label">Premium</td>
                <td>The price the buyer pays for the option token</td>
              </tr>
              <tr>
                <td className="row-label">Singleton</td>
                <td>
                  A special single token that stays in the reserve — proves the
                  contract exists
                </td>
              </tr>
              <tr>
                <td className="row-label">Exercise</td>
                <td>Using your option to trade at the strike price</td>
              </tr>
              <tr>
                <td className="row-label">Exercise window</td>
                <td>
                  720 blocks (~24 hours) after maturity when exercise is allowed
                </td>
              </tr>
              <tr>
                <td className="row-label">American style</td>
                <td>Can exercise anytime before expiry</td>
              </tr>
              <tr>
                <td className="row-label">European style</td>
                <td>Can only exercise after maturity date</td>
              </tr>
              <tr>
                <td className="row-label">Physical delivery</td>
                <td>
                  Actual tokens change hands (rsADA, DexyGold, ERG)
                </td>
              </tr>
              <tr>
                <td className="row-label">Cash-settled</td>
                <td>
                  Profit paid in stablecoin, no underlying tokens move
                </td>
              </tr>
              <tr>
                <td className="row-label">USE</td>
                <td>
                  Dexy USD stablecoin (3 decimal places, $1.000)
                </td>
              </tr>
              <tr>
                <td className="row-label">SigUSD</td>
                <td>
                  SigmaUSD stablecoin (2 decimal places, $1.00)
                </td>
              </tr>
              <tr>
                <td className="row-label">Reserve box</td>
                <td>
                  The on-chain box that holds collateral + singleton
                </td>
              </tr>
              <tr>
                <td className="row-label">Definition box</td>
                <td>The initial box before tokens are minted</td>
              </tr>
              <tr>
                <td className="row-label">Burn</td>
                <td>
                  Permanently destroying tokens by not including them in any
                  output
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* KEY TAKEAWAY */}
      <Takeaway>
        <p>
          Trust the contract, not the infrastructure. Every action is validated
          by ErgoScript on-chain. The bot, frontend, and node are replaceable —
          the contract is permanent.
        </p>
      </Takeaway>

      {/* PAGE NAVIGATION */}
      <PageNav
        prev={{ href: "/how-it-works/the-bot", title: "The Bot" }}
      />
    </>
  );
}
