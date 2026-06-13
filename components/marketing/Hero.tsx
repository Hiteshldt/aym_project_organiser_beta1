import Link from "next/link";
import { ArrowUpRight, Plus, Eye, Pin } from "lucide-react";
import InkUnderline from "@/components/marketing/InkUnderline";

export default function Hero() {
  return (
    <section className="relative overflow-hidden hero-wash">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24 md:pb-12">
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
          <RegisterFrame />
          <ClientFrame />
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

/* ────────────────────────────────────────────────────────────────
   The register — a faithful, static rendering of the real app.
   No images. Brand tokens only.
   ──────────────────────────────────────────────────────────────── */

const ROWS = [
  {
    n: 1,
    name: "Launch site copy",
    desc: "Final pass for review",
    link: "figma.com",
    date: "12 Jun",
    status: { label: "In progress", cls: "bg-amber-50 text-amber-800" },
    pinned: false,
  },
  {
    n: 2,
    name: "Brand guidelines v2",
    desc: "Type + color rules",
    link: "drive.google.com",
    date: "10 Jun",
    status: { label: "Delivered", cls: "bg-green-50 text-green-700" },
    pinned: true,
  },
  {
    n: 3,
    name: "Hero illustration",
    desc: "Approved by Maya",
    link: "canva.com",
    date: "8 Jun",
    status: { label: "Approved", cls: "bg-violet-50 text-violet-700" },
    pinned: false,
  },
  {
    n: 4,
    name: "Q3 campaign deck",
    desc: "18 slides, exports inside",
    link: "pitch.com",
    date: "5 Jun",
    status: { label: "To do", cls: "bg-slate-100 text-slate-600" },
    pinned: false,
  },
];

const FOLDERS = [
  { name: "Proposals", dot: "bg-indigo-400" },
  { name: "Deliverables", dot: "bg-emerald-400", active: true },
  { name: "Designs", dot: "bg-violet-400" },
  { name: "Contracts", dot: "bg-amber-400" },
];

function RegisterFrame() {
  return (
    <div className="frame-shine relative mx-auto max-w-5xl rounded-2xl">
      <div className="lit-top relative rounded-2xl border border-line-strong bg-paper-elevated shadow-float overflow-hidden">
        {/* Browser top bar */}
        <div className="h-9 flex items-center gap-2 px-3 sm:px-4 border-b border-line bg-paper">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </div>
          <div className="flex-1 flex justify-center min-w-0">
            <div className="font-mono-ui text-[10px] sm:text-[11px] text-mute-soft tracking-wide truncate">
              <span className="hidden sm:inline">ayuvam.com/workspace/google</span>
              <span className="sm:hidden">ayuvam.com</span>
            </div>
          </div>
          <div className="w-8 sm:w-12" />
        </div>

        {/* App chrome */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] min-h-[360px]">
          {/* Sidebar */}
          <div className="hidden sm:block border-r border-line bg-paper-elevated p-3">
            <div className="px-1 mb-3">
              <span className="font-display-italic text-base text-ink">Google</span>
            </div>
            <div className="space-y-0.5 text-[13px]">
              <div className="px-2 py-1.5 text-mute text-xs">All items</div>
              {FOLDERS.map((f) => (
                <div
                  key={f.name}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                    f.active ? "bg-accent-soft text-ink font-medium" : "text-mute"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-paper p-3 sm:p-4">
            {/* Content header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Deliverables</h3>
                <p className="text-[11px] text-mute-soft mt-0.5">
                  Register · a row per deliverable
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-accent text-white text-[11px] font-medium px-2.5 py-1.5">
                <Plus className="h-3 w-3" />
                Add row
              </span>
            </div>

            {/* The register table */}
            <div className="rounded-xl border border-line bg-paper-elevated overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-2.5 py-2 w-8 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute border-r border-line">#</th>
                    <th className="px-2.5 py-2 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute border-r border-line">Name</th>
                    <th className="hidden md:table-cell px-2.5 py-2 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute border-r border-line">Description</th>
                    <th className="hidden sm:table-cell px-2.5 py-2 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute border-r border-line">Link</th>
                    <th className="hidden sm:table-cell px-2.5 py-2 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute border-r border-line">Date</th>
                    <th className="px-2.5 py-2 font-mono-ui text-[9px] font-semibold uppercase tracking-wider text-mute">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr
                      key={r.n}
                      className={`border-b border-line last:border-b-0 ${
                        r.pinned ? "bg-accent-soft/30" : ""
                      }`}
                    >
                      <td className="px-2.5 py-2 font-mono-ui text-[10px] text-mute-soft border-r border-line">{r.n}</td>
                      <td className="px-2.5 py-2 border-r border-line">
                        <span className="text-xs font-medium text-ink">
                          {r.name}
                          {r.pinned && <Pin className="inline h-2.5 w-2.5 text-accent ml-1 -mt-0.5" fill="currentColor" />}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-2.5 py-2 text-[11px] text-mute border-r border-line">{r.desc}</td>
                      <td className="hidden sm:table-cell px-2.5 py-2 font-mono-ui text-[10px] text-mute border-r border-line">{r.link}</td>
                      <td className="hidden sm:table-cell px-2.5 py-2 font-mono-ui text-[10px] text-mute border-r border-line">{r.date}</td>
                      <td className="px-2.5 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${r.status.cls}`}>
                          {r.status.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Quick-add ghost row */}
                  <tr className="border-t border-line bg-paper/60">
                    <td className="px-2.5 py-2 text-mute-soft border-r border-line">
                      <Plus className="h-3 w-3" />
                    </td>
                    <td colSpan={5} className="px-2.5 py-2 text-[11px] text-mute-soft">
                      Add a row — type a title…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* What the client opens — small floating frame, desktop only. */
function ClientFrame() {
  return (
    <div className="hidden lg:block absolute -bottom-6 right-0 xl:-right-6 w-[300px]">
      <p className="font-mono-ui text-[9px] uppercase tracking-[0.25em] text-mute mb-2 pl-1">
        What your client opens
      </p>
      <div className="float-slow lit-top rounded-xl border border-line-strong bg-paper-elevated shadow-float overflow-hidden">
        {/* Mini header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line bg-paper">
          <span className="font-display-italic text-sm text-ink">Google</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-mono-ui text-accent">
            <Eye className="h-2.5 w-2.5" />
            View only
          </span>
        </div>
        <div className="px-3.5 py-3">
          <p className="text-[10px] text-mute italic leading-snug">
            &ldquo;Everything for the Q3 launch — newest at the top.&rdquo;
          </p>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
              <span className="text-[11px] font-medium text-ink truncate">Brand guidelines v2</span>
              <span className="shrink-0 rounded-full bg-green-50 text-green-700 px-1.5 py-0.5 text-[9px] font-medium">Delivered</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
              <span className="text-[11px] font-medium text-ink truncate">Hero illustration</span>
              <span className="shrink-0 rounded-full bg-violet-50 text-violet-700 px-1.5 py-0.5 text-[9px] font-medium">Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
