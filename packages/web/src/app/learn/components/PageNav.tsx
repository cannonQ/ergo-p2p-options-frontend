import Link from "next/link";

export default function PageNav({
  prev,
  next,
}: {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
}) {
  return (
    <div className="page-nav">
      {prev ? (
        <Link href={prev.href}>&larr; {prev.title}</Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="next">
          Next: {next.title} &rarr;
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
