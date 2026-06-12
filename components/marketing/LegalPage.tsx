import Link from "next/link";

/**
 * Reusable layout for /terms, /privacy, /refund and similar prose pages.
 * Keeps typography, rhythm, and brand voice consistent.
 */
export default function LegalPage({
  eyebrow,
  title,
  italicTitle,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  italicTitle: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <header className="border-b border-line pb-10 mb-12">
        <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl text-ink leading-[1.02] tracking-[-0.02em]">
          {title} <span className="font-display-italic">{italicTitle}</span>
        </h1>
        <p className="mt-4 text-ink-soft text-sm font-mono-ui">
          Last updated: {updated}
        </p>
      </header>

      <div className="prose-ayuvam">{children}</div>

      <footer className="mt-16 pt-8 border-t border-line">
        <p className="text-sm text-mute">
          Questions about this document? Email{" "}
          <a
            href="mailto:hello@ayuvam.com"
            className="text-accent hover:text-accent-hover underline underline-offset-4"
          >
            hello@ayuvam.com
          </a>
          .
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-sm text-mute hover:text-ink transition-colors"
        >
          ← Back to home
        </Link>
      </footer>
    </article>
  );
}

/**
 * Shared prose primitives — used across all legal pages so the body
 * styling is consistent. Use these instead of raw h2/p tags.
 */

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-4 font-display text-2xl md:text-3xl text-ink leading-[1.15] tracking-[-0.015em]">
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-4 text-[15px] leading-[1.7] text-ink/90">{children}</p>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-4 space-y-2 pl-5 text-[15px] leading-[1.7] text-ink/90 list-disc marker:text-mute-soft">
      {children}
    </ul>
  );
}

export function LegalLi({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}
