import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import InkUnderline from "@/components/marketing/InkUnderline";
import HeroMockup from "@/components/marketing/HeroMockup";

export default function Hero() {
  return (
    <section className="relative overflow-hidden hero-wash">
      {/* Faint paper dot-grid for depth — fades out before the content. */}
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24 md:pb-12">
        {/* Eyebrow */}
        <div data-reveal className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-elevated/80 px-3.5 py-1.5 text-xs font-mono-ui text-mute tracking-wide shadow-soft backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Now in early access
          </span>
        </div>

        {/* Headline */}
        <h1
          data-reveal
          style={{ ["--rd" as string]: "80ms" }}
          className="mt-7 text-center font-display text-[46px] leading-[1.03] md:text-[78px] md:leading-[0.98] text-ink tracking-[-0.025em]"
        >
          Make the work look<br />
          <InkUnderline className="font-display-italic text-accent">
            as good as it is.
          </InkUnderline>
        </h1>

        {/* Subhead */}
        <p
          data-reveal
          style={{ ["--rd" as string]: "160ms" }}
          className="mt-7 mx-auto max-w-xl text-center text-base md:text-xl text-ink-soft leading-relaxed"
        >
          One clean, shareable space per client — proposals, decks, files,
          links. You keep it organized. They just open one link.
        </p>

        {/* CTAs */}
        <div
          data-reveal
          style={{ ["--rd" as string]: "240ms" }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="btn-accent group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
          >
            Start free — no credit card
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/contact"
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
          >
            Contact sales
          </Link>
        </div>

        {/* Proof line + quiet explore link */}
        <div
          data-reveal
          style={{ ["--rd" as string]: "320ms" }}
          className="mt-5 flex flex-col items-center gap-2"
        >
          <p className="text-center text-xs font-mono-ui text-mute tracking-wide">
            Free for your first client · ~60 seconds to a shareable link
          </p>
          <Link
            href="#how"
            className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink transition-colors"
          >
            See how it works <span aria-hidden>↓</span>
          </Link>
        </div>

        {/* Product mockup — the register + what the client opens */}
        <div
          data-reveal
          style={{ ["--rd" as string]: "400ms" }}
          className="mt-14 md:mt-18 relative lg:pb-20"
        >
          <HeroMockup />
        </div>

        {/* Stat strip */}
        <div data-reveal className="mt-12 border-y border-line">
          <div className="py-4 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-1.5 font-mono-ui text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-mute">
            <span>One link per client</span>
            <span className="text-line-strong" aria-hidden>·</span>
            <span>No client logins</span>
            <span className="text-line-strong" aria-hidden>·</span>
            <span>Typo-proof search</span>
            <span className="text-line-strong" aria-hidden>·</span>
            <span>Revocable anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
