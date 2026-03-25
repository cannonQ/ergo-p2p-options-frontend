import Link from "next/link";

const lessons = [
  { slug: "calls-and-puts", title: "Calls & Puts" },
  { slug: "premiums", title: "Premiums" },
  { slug: "writing-options", title: "Writing Options" },
  { slug: "settlement", title: "Settlement" },
  { slug: "hedging", title: "Hedging" },
  { slug: "why-on-chain", title: "Why On-Chain" },
];

export default function LessonHeader({ current }: { current: number }) {
  const prev = current > 1 ? lessons[current - 2] : null;
  const next = current < lessons.length ? lessons[current] : null;

  return (
    <div className="lesson-header">
      {prev ? (
        <Link href={`/learn/${prev.slug}`} className="lesson-arrow lesson-prev">
          &larr; {prev.title}
        </Link>
      ) : (
        <Link href="/#learn" className="lesson-arrow lesson-prev">
          &larr; Home
        </Link>
      )}
      <span className="lesson-counter">
        {current} / {lessons.length}
      </span>
      {next ? (
        <Link href={`/learn/${next.slug}`} className="lesson-arrow lesson-next">
          {next.title} &rarr;
        </Link>
      ) : (
        <Link href="/learn/calls-and-puts" className="lesson-arrow lesson-next">
          Start over &rarr;
        </Link>
      )}
    </div>
  );
}
