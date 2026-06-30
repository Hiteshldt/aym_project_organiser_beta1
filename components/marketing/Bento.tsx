import { Building2, Link2, Search, Eye, Check, Pin, ArrowDown } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   "Three things, done properly." — reworked from a flat bento grid
   into three alternating feature rows, each with a crafted mini-mockup
   of the real product. Roomier, more premium, and visually distinct
   from the card-grid sections around it.
   ──────────────────────────────────────────────────────────────── */

export default function Bento() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-6 border-t border-line py-16 md:py-24 scroll-mt-20"
    >
      <header data-reveal className="max-w-2xl">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          What&rsquo;s inside
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Three things, <span className="font-display-italic">done properly.</span>
        </h2>
        <p className="mt-4 text-ink-soft text-base md:text-lg max-w-xl">
          No CRM. No invoices. No messaging. Just the part that was always
          missing — done with actual care.
        </p>
      </header>

      <div className="mt-16 md:mt-24 space-y-20 md:space-y-28">
        <FeatureRow
          n={1}
          icon={<Building2 className="h-4 w-4" />}
          title="One clean space per client."
          body="Each client gets their own workspace — folders, files, links, history. They never see the other nineteen. You never re-explain where anything lives."
          visual={<WorkspacesVisual />}
        />
        <FeatureRow
          n={2}
          icon={<Link2 className="h-4 w-4" />}
          title="One link. No logins for them."
          body="Share a magic link and your client is in — read-only, no signup, no password. Revoke it any time. They just see their work, beautifully laid out."
          visual={<ShareVisual />}
          flip
        />
        <FeatureRow
          n={3}
          icon={<Search className="h-4 w-4" />}
          title="Find anything in a keystroke."
          body="Titles, tags, notes, URLs, dates — all searchable, even with a typo. The deck you delivered six months ago is one word away, not forty Slack scrolls."
          visual={<SearchVisual />}
        />
      </div>
    </section>
  );
}

function FeatureRow({
  n,
  icon,
  title,
  body,
  visual,
  flip,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
      <div data-reveal className={flip ? "md:order-2" : ""}>
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
            {icon}
          </span>
          <span className="font-mono-ui text-sm text-mute-soft">
            0{n} <span className="text-line-strong">/ 03</span>
          </span>
        </div>
        <h3 className="mt-5 font-display text-2xl md:text-[34px] text-ink leading-[1.1] tracking-[-0.01em]">
          {title}
        </h3>
        <p className="mt-4 text-ink-soft text-base leading-relaxed max-w-md">
          {body}
        </p>
      </div>
      <div data-reveal className={flip ? "md:order-1" : ""}>
        {visual}
      </div>
    </div>
  );
}

/* ── Visual 1: a stack of client workspaces ── */
function WorkspacesVisual() {
  const spaces = [
    { name: "Google", items: 28, active: true },
    { name: "Apple", items: 12 },
    { name: "Spotify", items: 7 },
  ];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-3">
        {spaces.map((s, i) => (
          <div
            key={s.name}
            className={`rounded-xl border p-3 transition-transform ${
              s.active
                ? "bg-accent-soft border-accent/30 -translate-y-1 shadow-soft"
                : "bg-paper border-line"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${s.active ? "bg-accent" : "bg-mute-soft"}`} />
              <span className="text-[12px] font-medium text-ink truncate">{s.name}</span>
            </div>
            <p className="text-[10px] font-mono-ui text-mute mt-1.5">{s.items} items</p>
            <div className="mt-3 space-y-1.5" aria-hidden>
              {[82, 64, 73].map((w, k) => (
                <div
                  key={k}
                  className={`h-1.5 rounded-full ${s.active ? "bg-accent/30" : "bg-line"}`}
                  style={{ width: `${w}%`, opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ── Visual 2: a share link → the read-only client view ── */
function ShareVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5">
        <Link2 className="h-3.5 w-3.5 text-mute-soft shrink-0" />
        <span className="text-[12px] font-mono-ui text-mute truncate">
          ayuvam.com/s/google-q3
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-mono-ui text-accent shrink-0">
          <Check className="h-2.5 w-2.5" /> Copied
        </span>
      </div>

      <div className="my-3 flex justify-center text-mute-soft">
        <ArrowDown className="h-4 w-4" />
      </div>

      <div className="rounded-xl border border-line-strong bg-paper overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-paper-elevated">
          <span className="font-display-italic text-sm text-ink">Google</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-mono-ui text-accent">
            <Eye className="h-2.5 w-2.5" /> View only
          </span>
        </div>
        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-ink truncate">Brand guidelines v2</span>
            <span className="shrink-0 rounded-full bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300 px-1.5 py-0.5 text-[9px] font-medium">Delivered</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-ink truncate">Hero illustration</span>
            <span className="shrink-0 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 px-1.5 py-0.5 text-[9px] font-medium">Approved</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ── Visual 3: typo-tolerant search ── */
function SearchVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-paper px-3 py-2.5">
        <Search className="h-3.5 w-3.5 text-mute-soft shrink-0" />
        <span className="text-[13px] text-ink">brand guidlines</span>
        <span className="w-px h-3.5 bg-accent animate-pulse" aria-hidden />
        <span className="ml-auto font-mono-ui text-[10px] text-mute-soft border border-line rounded px-1.5 py-0.5">/</span>
      </div>

      <p className="mt-2.5 text-[10px] font-mono-ui text-mute-soft">
        1 result · matched despite the typo
      </p>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5">
        <span className="h-8 w-8 rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300 flex items-center justify-center shrink-0">
          <Pin className="h-3.5 w-3.5" fill="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ink truncate">
            <mark className="bg-accent/20 text-ink rounded px-0.5">Brand guidelines</mark> v2
          </p>
          <p className="text-[10px] font-mono-ui text-mute-soft mt-0.5">Designs · Jun 10</p>
        </div>
        <span className="shrink-0 rounded-full bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-300 px-2 py-0.5 text-[10px] font-medium">Delivered</span>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-spotlight
      className="group lit-top relative rounded-2xl border border-line bg-paper-elevated p-5 shadow-soft card-lift"
    >
      {children}
    </div>
  );
}
