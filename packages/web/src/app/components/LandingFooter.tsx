import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div>
            <Link href="/" className="nav-logo" style={{ marginBottom: "8px" }}>
              <Image src="/etcha-logo.svg" alt="Etcha — Options etched on-chain" width={180} height={52} />
            </Link>
            <p className="footer-copy">Decentralized options on Ergo</p>
          </div>
          <ul className="footer-links">
            <li><a href="/learn/calls-and-puts">Learn</a></li>
            <li><a href="/how-it-works/writing-an-option">How It Works</a></li>
            <li><a href="https://github.com/cannonQ/ergo-p2p-options-frontend" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://t.me/degensworld_official" target="_blank" rel="noopener noreferrer">Telegram</a></li>
          </ul>
          <p className="footer-copy">etcha.io — $ETCH</p>
        </div>
      </div>
    </footer>
  );
}
