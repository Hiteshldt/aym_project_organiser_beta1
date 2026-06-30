import MessScene from "@/components/marketing/MessScene";

/* ────────────────────────────────────────────────────────────────
   The problem — shown, not listed. An interactive scene: client work
   rains in from everywhere (chaos), then one click drops it all into
   Ayuvam and you can search it live.

   The scene (falling pile + "drop it in" button) is owned entirely by
   <MessScene/> and left untouched — it's flawless. Everything here is
   the *frame* around it: a live badge, a sheened headline, and an
   editorial figure-rail treatment so the whole thing reads as its own
   self-contained sub-section instead of bleeding into the page.
   ──────────────────────────────────────────────────────────────── */

export default function BeforeAfter() {
  return (
    <section className="relative bg-paper-dim border-y border-line overflow-hidden py-16 md:py-24">
      {/* Soft radial wash lifts the scene off the flat dim panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] [background:radial-gradient(60%_70%_at_50%_0%,rgba(200,75,49,0.05),transparent_70%)]"
      />

      <header data-reveal className="relative max-w-2xl mx-auto px-6 text-center">
        {/* Live badge — a quietly pulsing dot signals this is a real, running demo */}
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-elevated px-3 py-1 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-mute shadow-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          The problem · live
        </span>

        <h2 className="mt-5 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Right now — where does the{" "}
          <span className="font-display-italic text-ember">final file</span>{" "}
          actually live?
        </h2>
        <p className="mt-4 text-ink-soft text-base md:text-lg mx-auto max-w-xl">
          Your work is great. It&rsquo;s <em className="font-display-italic text-ink">where it ends up</em>{" "}
          that hurts — scattered across five tools and three folders all
          named &ldquo;final&rdquo;.
        </p>
      </header>

      {/* Framed figure — rails + corner ticks bound the scene so it reads
          as a distinct sub-section. The stage itself stays full-width. */}
      <div data-reveal className="relative mx-auto mt-10 md:mt-14 max-w-6xl px-4 sm:px-6">
        {/* Top rail: a captioned hairline, like a technical figure label */}
        <div className="flex items-center gap-3 px-1 mb-3">
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute-soft">
            fig.01
          </span>
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute-soft">
            your desk, today
          </span>
        </div>

        {/* The stage, in an outlined frame (no fill — keeps the scene's
            exact backdrop). Corner ticks add the figure feel on ≥sm. */}
        <div className="relative rounded-3xl border border-line/80 overflow-hidden">
          <Corner className="left-0 top-0 border-l border-t rounded-tl-lg" />
          <Corner className="right-0 top-0 border-r border-t rounded-tr-lg" />
          <Corner className="left-0 bottom-0 border-l border-b rounded-bl-lg" />
          <Corner className="right-0 bottom-0 border-r border-b rounded-br-lg" />
          <MessScene />
        </div>

        {/* Bottom rail: the running tally, mono, right-aligned */}
        <div className="flex items-center gap-3 px-1 mt-3">
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute-soft">
            five tools
          </span>
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute-soft">
            zero found
          </span>
        </div>
      </div>
    </section>
  );
}

/* A small L-shaped corner tick — decorative figure framing, ≥sm only. */
function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 hidden sm:block h-4 w-4 border-line-strong ${className ?? ""}`}
    />
  );
}
