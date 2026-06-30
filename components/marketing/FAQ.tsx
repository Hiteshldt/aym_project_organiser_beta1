"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowUpRight } from "lucide-react";

const FAQS = [
  {
    q: "How is this different from Google Drive?",
    a: "Drive is a filing cabinet. Ayuvam is a presentation. Drive shows folders and file types — Ayuvam shows your work, organized per client, with notes, tags, and a clean reader view. Your clients see “Pitch deck v3”, not “clientname_proposal_final_v3_USE-THIS-ONE.pdf”.",
  },
  {
    q: "Do my clients need to sign up?",
    a: "No. You invite them by email — they click a magic link and land in their workspace. No password, no account, no friction. You can revoke access any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no annual lock-in. Downgrade or cancel from your billing page. If you cancel an annual plan, you keep access until the period ends.",
  },
  {
    q: "Is my data secure?",
    a: "Workspaces are fully isolated — clients only see their own, and a share link can be revoked any time. Files are stored on Vercel Blob over HTTPS via long, unguessable URLs. The database is hosted on Neon (Postgres) with TLS in transit and encryption at rest. We never share or sell your data.",
  },
  {
    q: "What's the file size limit?",
    a: "20MB per file on every plan. For larger files (videos, raw assets), drop in a link to Drive, Dropbox, or Frame.io — the link gets the same Ayuvam treatment as a file.",
  },
  {
    q: "Why not just Notion?",
    a: "Notion is incredible — for internal knowledge. As a client-facing portal it's heavy: clients learn the navigation, see your other databases, deal with permissions. Ayuvam is one purpose, one screen, done.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-paper-dim border-y border-line">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid md:grid-cols-[0.85fr_1.15fr] gap-10 md:gap-16">
        {/* Left — sticky intro + contact */}
        <div data-reveal className="md:sticky md:top-24 h-max">
          <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
            Common questions
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
            Things people <span className="font-display-italic">ask first.</span>
          </h2>
          <p className="mt-4 text-ink-soft leading-relaxed max-w-sm">
            Straight answers, no fine print. If something here isn&rsquo;t covered,
            a real person will reply.
          </p>

          <Link
            href="/contact"
            className="group mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper-elevated px-4 py-2.5 text-sm font-medium text-ink hover:border-ink transition-colors"
          >
            Ask us anything
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Right — accordion */}
        <div data-reveal className="border-t border-line">
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({
  q,
  a,
  defaultOpen,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 text-left py-5 group"
        aria-expanded={open}
      >
        <span
          className={`font-display text-lg md:text-xl leading-[1.3] tracking-[-0.01em] transition-colors ${
            open ? "text-ink" : "text-ink group-hover:text-accent"
          }`}
        >
          {q}
        </span>
        <span
          className={`shrink-0 h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
            open
              ? "bg-ink text-paper border-ink rotate-0"
              : "border-line text-mute group-hover:border-ink group-hover:text-ink"
          }`}
        >
          {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-ink-soft leading-relaxed max-w-prose">{a}</p>
        </div>
      </div>
    </div>
  );
}
