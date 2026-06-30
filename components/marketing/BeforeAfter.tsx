import MessScene from "@/components/marketing/MessScene";

/* ────────────────────────────────────────────────────────────────
   The problem — shown, not listed. An interactive scene: client work
   rains in from everywhere (chaos), then one click drops it all into
   Ayuvam and you can search it live. The scene is the argument; it
   hands off to "How it works" below.
   ──────────────────────────────────────────────────────────────── */

export default function BeforeAfter() {
  return (
    <section className="bg-paper-dim border-y border-line overflow-hidden py-16 md:py-24">
      <header data-reveal className="max-w-2xl mx-auto px-6 text-center">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          The problem
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Now — where does the{" "}
          <span className="font-display-italic">final file live?</span>
        </h2>
        <p className="mt-4 text-ink-soft text-base md:text-lg mx-auto max-w-xl">
          Your work is great. Where it ends up is the problem — scattered
          across five tools and three &ldquo;final&rdquo; folders.
        </p>
      </header>

      {/* Full-bleed stage — the pile spans the whole width */}
      <div data-reveal className="mt-10 md:mt-12">
        <MessScene />
      </div>
    </section>
  );
}
