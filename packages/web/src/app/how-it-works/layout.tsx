import Link from "next/link";
import Image from "next/image";
import "../landing.css";
import "../learn/learn.css";
import "./how-it-works.css";

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing learn-page hiw-page">
      <nav>
        <div className="container">
          <Link href="/" className="nav-logo">
            <Image
              src="/etcha-icon.svg"
              alt="Etcha"
              width={36}
              height={36}
              className="logo-mark"
            />
            <span className="logo-text">Etcha</span>
          </Link>
          <ul className="nav-links">
            <li><Link href="/#products">Products</Link></li>
            <li><Link href="/#markets">Markets</Link></li>
            <li><Link href="/#how">How It Works</Link></li>
            <li><Link href="/#how-it-works">Deep Dive</Link></li>
            <li><Link href="/#learn">Learn</Link></li>
            <li><Link href="/#compare">Compare</Link></li>
          </ul>
          <Link href="/app" className="btn-launch">
            Launch App &rarr;
          </Link>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="learn-footer">
        Etcha &mdash; Decentralized options on Ergo. The smart contract is the
        only thing you need to trust.
      </footer>
    </div>
  );
}
