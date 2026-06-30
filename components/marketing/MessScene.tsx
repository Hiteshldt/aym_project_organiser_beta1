"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Matter from "matter-js";
import {
  FileText,
  Mail,
  MessageSquare,
  Folder,
  Image as ImageIcon,
  Frame,
  Search,
  Sparkles,
  Pin,
  Plus,
  ArrowRight,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   The interactive "problem → fix" scene, powered by Matter.js.

   A full-width heap of real-looking file/message items rains down and
   physically piles up across the whole floor. Once it's covered, the
   "Drop it into Ayuvam" button appears; one click clears the pile and
   a real, searchable workspace takes its place.

   Items are plain DOM (varied sizes, icons, meta) whose transforms are
   synced to Matter bodies each frame. Honours prefers-reduced-motion by
   opening straight into the tidy workspace.
   ──────────────────────────────────────────────────────────────── */

type Size = "sm" | "md" | "lg";
type Tint = "red" | "violet" | "amber" | "indigo" | "emerald" | "slate";
type Piece = {
  label: string;
  icon: typeof FileText;
  meta?: string;
  size: Size;
  tint?: Tint;
  sticky?: boolean;
};

const POOL: Piece[] = [
  { label: "Final_v3.pdf", icon: FileText, meta: "PDF · 2.4 MB", size: "md", tint: "red" },
  { label: "Brand deck.key", icon: Frame, meta: "Keynote · 48 slides", size: "lg", tint: "indigo" },
  { label: "Re: Re: Fwd: assets", icon: Mail, meta: "Inbox · 3 weeks ago", size: "md", tint: "amber" },
  { label: "here's the link!", icon: MessageSquare, meta: "#design · @maya", size: "md", tint: "violet" },
  { label: "/ Final final", icon: Folder, size: "sm", tint: "indigo" },
  { label: "logo_FINAL.ai", icon: FileText, meta: "Illustrator", size: "sm", tint: "amber" },
  { label: "IMG_2931.png", icon: ImageIcon, meta: "PNG · 1920×1080", size: "md", tint: "violet" },
  { label: "contract.pdf", icon: FileText, size: "sm", tint: "red" },
  { label: "notes.txt", icon: FileText, size: "sm", tint: "slate" },
  { label: "v2-final-real.pdf", icon: FileText, meta: "…or is it?", size: "md", tint: "red" },
  { label: "proposal.pages", icon: FileText, size: "sm", tint: "emerald" },
  { label: "where's the deck?!", icon: Sparkles, size: "sm", sticky: true },
  { label: "moodboard.fig", icon: Frame, meta: "Figma", size: "md", tint: "violet" },
  { label: "assets.zip", icon: FileText, meta: "ZIP · 340 MB", size: "md", tint: "slate" },
  { label: "the link 👋", icon: MessageSquare, size: "sm", tint: "emerald" },
  { label: "hero_v4_FINAL.psd", icon: ImageIcon, meta: "Photoshop · 212 MB", size: "lg", tint: "violet" },
  { label: "Q3 budget.xlsx", icon: FileText, meta: "Sheets", size: "sm", tint: "emerald" },
  { label: "voice-memo.m4a", icon: FileText, meta: "Audio · 4:12", size: "sm", tint: "slate" },
];

// Plenty of items to bury a full-width floor; trimmed on small screens.
const MAX = 46;

const TINT: Record<Tint, string> = {
  red: "bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
};

const ST = {
  todo: { label: "To do", cls: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300" },
  progress: { label: "In progress", cls: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" },
  approved: { label: "Approved", cls: "bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300" },
  delivered: { label: "Delivered", cls: "bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300" },
};

const ITEMS: {
  name: string;
  folder: string;
  date: string;
  status: { label: string; cls: string };
  tint: Tint;
  pinned?: boolean;
}[] = [
  { name: "Brand guidelines v2", folder: "Designs", date: "Jun 10", status: ST.delivered, tint: "indigo", pinned: true },
  { name: "Launch site copy", folder: "Deliverables", date: "Jun 12", status: ST.progress, tint: "red" },
  { name: "Hero illustration", folder: "Designs", date: "Jun 8", status: ST.approved, tint: "violet" },
  { name: "Q3 campaign deck", folder: "Proposals", date: "Jun 5", status: ST.todo, tint: "amber" },
  { name: "Pricing one-pager", folder: "Proposals", date: "Jun 3", status: ST.delivered, tint: "emerald" },
  { name: "Logo exploration", folder: "Designs", date: "May 28", status: ST.approved, tint: "violet" },
];

export default function MessScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stopRef = useRef<() => void>(() => {});

  const [ready, setReady] = useState(false);
  const [organized, setOrganized] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setOrganized(true);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const total = Math.min(MAX, W < 640 ? 24 : 44);

    const { Engine, Runner, Bodies, Composite, Body } = Matter;
    const engine = Engine.create();
    engine.gravity.y = 1.3;
    const runner = Runner.create();

    const wall = { isStatic: true, render: { visible: false } };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + 40, W + 600, 80, wall),
      Bodies.rectangle(-40, H / 2, 80, H * 3, wall),
      Bodies.rectangle(W + 40, H / 2, 80, H * 3, wall),
    ]);
    Runner.run(runner, engine);

    const active: { node: HTMLDivElement; body: Matter.Body; w: number; h: number }[] = [];
    let raf = 0;
    const tick = () => {
      for (const a of active) {
        a.node.style.transform = `translate(${a.body.position.x - a.w / 2}px, ${a.body.position.y - a.h / 2}px) rotate(${a.body.angle}rad)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let inView = false;
    const io = new IntersectionObserver(
      (es) => (inView = es[0].isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(stage);

    let spawned = 0;
    const timer = setInterval(() => {
      if (!inView) return;
      if (spawned >= total) {
        clearInterval(timer);
        setTimeout(() => setReady(true), 800);
        return;
      }
      const node = chipRefs.current[spawned];
      if (!node) {
        spawned += 1;
        return;
      }
      const w = node.offsetWidth || 140;
      const h = node.offsetHeight || 34;
      node.style.opacity = "1";
      const x = w / 2 + 8 + Math.random() * Math.max(1, W - w - 16);
      const body = Bodies.rectangle(x, -h - Math.random() * 120, w, h, {
        restitution: 0.15,
        friction: 0.95,
        frictionAir: 0.01,
        chamfer: { radius: 8 },
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
      Composite.add(engine.world, body);
      active.push({ node, body, w, h });
      spawned += 1;
    }, 85);

    const stop = () => {
      clearInterval(timer);
      cancelAnimationFrame(raf);
      io.disconnect();
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
    stopRef.current = stop;
    return stop;
  }, []);

  function organize() {
    stopRef.current();
    setOrganized(true);
    setTimeout(() => searchRef.current?.focus(), 600);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ITEMS.filter((i) => (i.name + " " + i.folder).toLowerCase().includes(q))
    : ITEMS;

  return (
    <div className="relative w-full">
      {/* Full-width stage — no box; items pile across the whole width */}
      <div ref={stageRef} className="relative w-full h-[460px] sm:h-[560px] overflow-hidden">
        {/* ── Falling items (physics-driven) ── */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-500 ${
            organized ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {Array.from({ length: MAX }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              className="absolute top-0 left-0 will-change-transform"
              style={{ opacity: 0 }}
            >
              <MessItem piece={POOL[i % POOL.length]} />
            </div>
          ))}
        </div>

        {/* ── Ready prompt — blurs the pile behind it, button fades in ── */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-[backdrop-filter,background-color] duration-700 ${
            ready && !organized
              ? "backdrop-blur-[3px] bg-paper-dim/30"
              : "pointer-events-none"
          }`}
        >
          <div
            className={`flex flex-col items-center gap-3 transition-opacity duration-500 ${
              ready && !organized ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute">
              Your work — everywhere and nowhere
            </span>
            <button
              onClick={organize}
              className="btn-accent group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium shadow-float"
            >
              <Sparkles className="h-4 w-4" />
              Drop it into Ayuvam
            </button>
          </div>
        </div>

        {/* ── Tidy workspace (centered, wider card) ── */}
        <div
          className={`absolute inset-0 px-4 sm:px-6 flex items-center justify-center transition-all duration-500 ${
            organized ? "opacity-100 delay-200" : "opacity-0 pointer-events-none translate-y-2"
          }`}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-line-strong bg-paper shadow-float overflow-hidden">
            {/* Header: workspace + search */}
            <div className="px-4 py-3 border-b border-line bg-paper-elevated">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="font-display-italic text-base text-ink">Google</span>
                <span className="text-mute-soft text-xs">/</span>
                <span className="text-xs text-mute font-medium">All work</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-mono-ui text-accent">
                  View only
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2.5 focus-within:border-accent/50 transition-colors">
                <Search className="h-4 w-4 text-mute-soft shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files, links, notes…"
                  className="w-full bg-transparent outline-none text-sm text-ink placeholder:text-mute-soft"
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="text-[11px] font-mono-ui text-mute-soft hover:text-ink"
                  >
                    clear
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex font-mono-ui text-[10px] text-mute-soft border border-line rounded px-1.5 py-0.5">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[340px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                    <Plus className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-ink">
                    No &ldquo;<span className="font-medium">{query}</span>&rdquo; here — yet.
                  </p>
                  <p className="text-xs text-mute-soft mt-1 mb-4">
                    Create your free workspace and it&rsquo;ll live here — findable in one search.
                  </p>
                  <Link
                    href="/login"
                    className="btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                  >
                    Add &ldquo;{query.length > 18 ? query.slice(0, 18) + "…" : query}&rdquo; to Ayuvam
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                filtered.map((it) => (
                  <div
                    key={it.name}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0 transition-colors hover:bg-paper-dim/40 ${
                      it.pinned ? "bg-accent-soft/20" : ""
                    }`}
                  >
                    <span className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${TINT[it.tint]}`}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5">
                        <Highlight text={it.name} q={q} />
                        {it.pinned && <Pin className="h-2.5 w-2.5 text-accent shrink-0" fill="currentColor" />}
                      </p>
                      <p className="text-[11px] text-mute-soft mt-0.5 flex items-center gap-1.5">
                        <span>{it.folder}</span>
                        <span aria-hidden>·</span>
                        <span className="font-mono-ui">{it.date}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.status.cls}`}>
                      {it.status.label}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-line bg-paper-elevated flex items-center justify-between">
              <p className="text-[11px] font-mono-ui text-mute-soft">
                {filtered.length} of {ITEMS.length} items
              </p>
              <p className="text-[11px] font-mono-ui text-mute-soft">one link for the client</p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="mx-auto max-w-2xl px-6 mt-4 text-center text-sm text-mute">
        {organized ? (
          <>Type above — it filters instantly. <span className="text-ink font-medium">That&rsquo;s the whole idea.</span></>
        ) : ready ? (
          <>That&rsquo;s a Tuesday. <span className="text-ink font-medium">Click to fix it →</span></>
        ) : (
          <>Everything, everywhere, all at once.</>
        )}
      </p>
    </div>
  );
}

/* A single mess item — three sizes, so the pile has natural variety. */
function MessItem({ piece }: { piece: Piece }) {
  const Icon = piece.icon;

  if (piece.sticky) {
    return (
      <div className="w-[150px] rounded-lg border border-amber-200/70 bg-amber-50 dark:bg-amber-400/10 dark:border-amber-400/20 shadow-soft px-3 py-2">
        <p className="font-display-italic text-[15px] text-ink leading-tight">{piece.label}</p>
      </div>
    );
  }

  if (piece.size === "sm") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper-elevated shadow-soft px-2.5 py-1.5 whitespace-nowrap">
        <Icon className="h-3 w-3 text-mute-soft shrink-0" />
        <span className="text-[11px] font-mono-ui text-mute">{piece.label}</span>
      </div>
    );
  }

  const big = piece.size === "lg";
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-line bg-paper-elevated shadow-soft p-2.5"
      style={{ width: big ? 224 : 184 }}
    >
      <span
        className={`shrink-0 rounded-md flex items-center justify-center ${
          big ? "h-10 w-10" : "h-8 w-8"
        } ${TINT[piece.tint ?? "slate"]}`}
      >
        <Icon className={big ? "h-5 w-5" : "h-4 w-4"} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-ink truncate">{piece.label}</p>
        {piece.meta && (
          <p className="text-[10px] font-mono-ui text-mute-soft truncate mt-0.5">{piece.meta}</p>
        )}
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-ink rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
