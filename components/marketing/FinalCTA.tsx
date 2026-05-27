import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-ink text-paper px-8 py-16 md:px-16 md:py-24">
        {/* Background accent */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-50"
          style={{ background: "rgba(200, 75, 49, 0.45)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full blur-3xl opacity-30"
          style={{ background: "rgba(200, 75, 49, 0.35)" }}
        />

        <div className="relative max-w-2xl">
          <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-paper/50">
            Stop sending Drive links
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-6xl leading-[1.02] tracking-[-0.02em] text-paper">
            Start organizing<br />
            <span className="font-display-italic">your client work.</span>
          </h2>
          <p className="mt-5 text-paper/70 text-lg max-w-lg leading-relaxed">
            Free forever for your first client. No credit card. Set up in under
            five minutes.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-paper px-6 py-3.5 text-sm font-medium hover:bg-accent-hover transition-all hover:-translate-y-px"
            >
              Create free account
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <span className="font-mono-ui text-xs text-paper/40 tracking-wide">
              ~60 seconds to first workspace
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
