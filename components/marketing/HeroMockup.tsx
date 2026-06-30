"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Eye, Pin } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   The hero product mockup — a faithful rendering of the real app,
   brought to life with two gentle, looping micro-animations:
     1. the quick-add ghost row "types" deliverable titles, and
     2. the top row's status chip progresses In progress → Delivered.
   Both honour prefers-reduced-motion (they freeze on a tidy final
   state). No images — brand tokens only.
   ──────────────────────────────────────────────────────────────── */

const STATUS = {
  todo: { label: "To do", cls: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300" },
  progress: { label: "In progress", cls: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" },
  approved: { label: "Approved", cls: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300" },
  delivered: { label: "Delivered", cls: "bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300" },
} as const;

const ROWS = [
  { n: 1, name: "Launch site copy", desc: "Final pass for review", link: "figma.com", date: "12 Jun", pinned: false },
  { n: 2, name: "Brand guidelines v2", desc: "Type + color rules", link: "drive.google.com", date: "10 Jun", status: STATUS.delivered, pinned: true },
  { n: 3, name: "Hero illustration", desc: "Approved by the team", link: "canva.com", date: "8 Jun", status: STATUS.approved, pinned: false },
  { n: 4, name: "Q3 campaign deck", desc: "18 slides, exports inside", link: "pitch.com", date: "5 Jun", status: STATUS.todo, pinned: false },
];

const FOLDERS = [
  { name: "Proposals", dot: "bg-indigo-400" },
  { name: "Deliverables", dot: "bg-emerald-400", active: true },
  { name: "Designs", dot: "bg-violet-400" },
  { name: "Contracts", dot: "bg-amber-400" },
];

// Titles the ghost row "types" out, one after another.
const GHOST_TITLES = ["Q4 social kit", "Pricing one-pager", "Logo exploration"];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export default function HeroMockup() {
  return (
    <>
      <RegisterFrame />
      <ClientFrame />
    </>
  );
}

function RegisterFrame() {
  // Row 1's status cycles progress → delivered to show work moving along.
  const [topStatus, setTopStatus] = useState<typeof STATUS.progress | typeof STATUS.delivered>(
    STATUS.progress
  );
  const [flash, setFlash] = useState(false);

  // The quick-add ghost row types a title, holds, deletes, advances.
  const [typed, setTyped] = useState("");
  const [titleIdx, setTitleIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setTopStatus(STATUS.delivered);
      setTyped(GHOST_TITLES[0]);
      return;
    }
    const id = setInterval(() => {
      setTopStatus((s) => (s === STATUS.progress ? STATUS.delivered : STATUS.progress));
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    const title = GHOST_TITLES[titleIdx];
    let i = 0;
    let mode: "typing" | "holding" | "deleting" = "typing";

    function tick() {
      if (cancelled) return;
      if (mode === "typing") {
        i += 1;
        setTyped(title.slice(0, i));
        if (i >= title.length) {
          mode = "holding";
          timer = setTimeout(tick, 1500);
          return;
        }
        timer = setTimeout(tick, 70 + Math.random() * 60);
      } else if (mode === "holding") {
        mode = "deleting";
        timer = setTimeout(tick, 40);
      } else {
        i -= 1;
        setTyped(title.slice(0, Math.max(0, i)));
        if (i <= 0) {
          setTitleIdx((n) => (n + 1) % GHOST_TITLES.length);
          return;
        }
        timer = setTimeout(tick, 32);
      }
    }
    let timer = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [titleIdx]);

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
                  {ROWS.map((r) => {
                    const status = r.n === 1 ? topStatus : r.status!;
                    return (
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
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors duration-500 ${status.cls} ${
                              r.n === 1 && flash ? "ring-2 ring-accent/40" : ""
                            }`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Quick-add ghost row — types titles on a loop */}
                  <tr className="border-t border-line bg-paper/60">
                    <td className="px-2.5 py-2 text-mute-soft border-r border-line">
                      <Plus className="h-3 w-3" />
                    </td>
                    <td colSpan={5} className="px-2.5 py-2 text-[11px]">
                      {typed ? (
                        <span className="text-ink">
                          {typed}
                          <span className="hero-caret" aria-hidden />
                        </span>
                      ) : (
                        <span className="text-mute-soft">
                          Add a row — type a title…
                        </span>
                      )}
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
              <span className="shrink-0 rounded-full bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300 px-1.5 py-0.5 text-[9px] font-medium">Delivered</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2">
              <span className="text-[11px] font-medium text-ink truncate">Hero illustration</span>
              <span className="shrink-0 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 px-1.5 py-0.5 text-[9px] font-medium">Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
