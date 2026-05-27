"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "How is this different from Google Drive?",
    a: "Drive is a filing cabinet. Ayuvam is a presentation. Drive shows folders and file types — Ayuvam shows your work, organized per client, with notes, tags, and a clean reader view. Your clients see titles like \"Pitch deck v3\" instead of \"clientname_proposal_final_v3_USE-THIS-ONE.pdf\".",
  },
  {
    q: "Do my clients need to sign up?",
    a: "No. You invite them by email — they click a magic link and land in their workspace. No password, no account creation, no friction. You can revoke access any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no annual lock-in. Downgrade or cancel from your billing page. If you cancel an annual plan, you keep access until the period ends.",
  },
  {
    q: "Is my data secure?",
    a: "Workspaces are fully isolated — clients only see their own. Files are stored on Vercel Blob with signed URLs. Database is hosted on Neon (Postgres) with TLS in transit and at-rest encryption. We never share or sell data.",
  },
  {
    q: "What's the file size limit?",
    a: "20MB per file on every plan. For larger files (videos, raw assets), drop in a link to Drive, Dropbox, or Frame.io — the link gets all the same Ayuvam treatment as a file.",
  },
  {
    q: "Why not just Notion?",
    a: "Notion is incredible — for internal knowledge. As a client-facing portal it's heavy: clients need to learn the navigation, see your other databases, deal with permissions. Ayuvam is one purpose, done in one screen.",
  },
];

export default function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <header className="text-center">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-mute">
          Common questions
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Things people <span className="font-display-italic">ask first.</span>
        </h2>
      </header>

      <div className="mt-12 divide-y divide-line border-y border-line">
        {FAQS.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} defaultOpen={i === 0} />
        ))}
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
    <div className="py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 text-left group"
        aria-expanded={open}
      >
        <span className="font-display text-lg md:text-xl text-ink leading-[1.3] tracking-[-0.01em]">
          {q}
        </span>
        <span
          className={`shrink-0 h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
            open
              ? "bg-ink text-paper border-ink"
              : "border-line text-mute group-hover:border-ink group-hover:text-ink"
          }`}
        >
          {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-mute leading-relaxed max-w-prose">{a}</p>
        </div>
      </div>
    </div>
  );
}
