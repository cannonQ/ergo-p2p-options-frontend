import Link from "next/link";

const steps = [
  { slug: "writing-an-option", title: "Writing an Option" },
  { slug: "trading", title: "Trading Options" },
  { slug: "settlement", title: "Settlement" },
  { slug: "cancel-and-manage", title: "Cancel & Manage" },
  { slug: "the-bot", title: "The Bot" },
  { slug: "security", title: "Security & Trust" },
];

export default function StepHeader({ current }: { current: number }) {
  const prev = current > 1 ? steps[current - 2] : null;
  const next = current < steps.length ? steps[current] : null;

  return (
    <div className="lesson-header">
      {prev ? (
        <Link href={`/how-it-works/${prev.slug}`} className="lesson-arrow lesson-prev">
          &larr; {prev.title}
        </Link>
      ) : (
        <Link href="/#how-it-works" className="lesson-arrow lesson-prev">
          &larr; Home
        </Link>
      )}
      <span className="lesson-counter">
        {current} / {steps.length}
      </span>
      {next ? (
        <Link href={`/how-it-works/${next.slug}`} className="lesson-arrow lesson-next">
          {next.title} &rarr;
        </Link>
      ) : (
        <Link href="/how-it-works/writing-an-option" className="lesson-arrow lesson-next">
          Start over &rarr;
        </Link>
      )}
    </div>
  );
}
