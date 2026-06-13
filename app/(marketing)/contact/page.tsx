import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calendar } from "lucide-react";
import InkUnderline from "@/components/marketing/InkUnderline";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the Ayuvam team — sales and demos for studios and agencies, or help with anything else.",
};

const CHANNELS = [
  {
    eyebrow: "Sales & demos",
    title: "Bringing a team or agency?",
    body: "Get a walkthrough, talk volume pricing, or get a hand moving your existing client work over. We'll reply the same day.",
    email: "sales@ayuvam.com",
    cta: "Email sales",
  },
  {
    eyebrow: "Help & everything else",
    title: "Questions, feedback, a rough edge?",
    body: "Stuck on something, hit a bug, or have an idea that'd make Ayuvam better? A real person reads every message.",
    email: "contact@ayuvam.com",
    cta: "Email us",
  },
];

export default function ContactPage() {
  return (
    <section className="hero-wash">
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-20 md:pt-28 md:pb-28">
        {/* Header */}
        <header data-reveal className="max-w-2xl">
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-accent">
            Contact
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl text-ink leading-[1.02] tracking-[-0.02em]">
            Let&rsquo;s{" "}
            <InkUnderline className="font-display-italic text-accent">
              talk.
            </InkUnderline>
          </h1>
          <p className="mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            However you reach out, it&rsquo;s a small team on the other end —
            no ticket queue, no bot. Pick whichever fits.
          </p>
        </header>

        {/* Form + channels */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
          {/* Form */}
          <div data-reveal>
            <ContactForm />
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-ui text-xs text-mute">
              <Calendar className="h-3.5 w-3.5 text-mute-soft" />
              <span>Replies Mon–Fri, usually within a few hours.</span>
            </div>
          </div>

          {/* Prefer email? Channels as a quieter sidebar. */}
          <div data-reveal-stagger data-step="90" className="flex flex-col gap-4">
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute-soft">
              Prefer email?
            </p>
            {CHANNELS.map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                data-spotlight
                className="group lit-top relative flex flex-col rounded-2xl border border-line bg-paper-elevated p-5 shadow-soft card-lift"
              >
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-accent">
                  {c.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-lg text-ink leading-snug tracking-[-0.01em]">
                  {c.title}
                </h2>
                <p className="mt-2 text-[13px] text-ink-soft leading-relaxed">
                  {c.body}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 font-mono-ui text-xs text-mute group-hover:text-accent transition-colors">
                  {c.email}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex items-center gap-1 text-sm text-mute hover:text-ink transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </section>
  );
}
