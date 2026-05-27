import Link from "next/link";
import {
  ArrowUpRight,
  Folder,
  FileText,
  Link2,
  Search,
  Pin,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle accent glow behind hero */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(200, 75, 49, 0.07) 0%, rgba(200, 75, 49, 0) 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Eyebrow */}
        <div className="reveal flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-elevated px-3 py-1 text-xs font-mono-ui text-mute tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Now in early access
          </span>
        </div>

        {/* Headline */}
        <h1 className="reveal reveal-delay-1 mt-6 text-center font-display text-[44px] leading-[1.05] md:text-[72px] md:leading-[1.02] text-ink tracking-[-0.02em]">
          Make the work look<br />
          <span className="font-display-italic">as good as it is.</span>
        </h1>

        {/* Subhead */}
        <p className="reveal reveal-delay-2 mt-6 mx-auto max-w-2xl text-center text-base md:text-lg text-mute leading-relaxed">
          Ayuvam gives every client their own clean space for proposals, decks,
          files, and links. Organized by you. Beautiful for them.
        </p>

        {/* CTAs */}
        <div className="reveal reveal-delay-3 mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="btn-accent inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
          >
            Start free — no credit card
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how"
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
          >
            See how it works
          </Link>
        </div>

        {/* Tiny social proof line */}
        <p className="mt-5 text-center text-xs font-mono-ui text-mute-soft tracking-wide">
          Built by founders, for studios — no contracts, no learning curve
        </p>

        {/* Product mockup */}
        <div className="mt-16 md:mt-20 relative">
          <MockWindow />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Product mockup — a static HTML representation of the app.
   No images, fully responsive, brand-aligned.
   ──────────────────────────────────────────────────────────────── */

function MockWindow() {
  return (
    <div
      className="relative mx-auto max-w-5xl"
      style={{ perspective: "2000px" }}
    >
      {/* Soft shadow plate below */}
      <div
        aria-hidden
        className="absolute inset-x-8 -bottom-6 h-24 rounded-full blur-3xl opacity-50"
        style={{ background: "rgba(200, 75, 49, 0.25)" }}
      />

      <div
        className="relative rounded-2xl border border-line-strong bg-paper-elevated shadow-[0_30px_80px_-30px_rgba(15,15,15,0.18)] overflow-hidden"
        style={{
          transform: "rotateX(0.5deg)",
        }}
      >
        {/* Browser top bar */}
        <div className="h-9 flex items-center gap-2 px-4 border-b border-line bg-paper">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="font-mono-ui text-[11px] text-mute-soft tracking-wide">
              ayuvam.app/workspace/carbelim
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* App chrome */}
        <div className="grid grid-cols-[180px_1fr] min-h-[420px]">
          {/* Sidebar */}
          <div className="border-r border-line bg-paper-elevated p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-display-italic text-base text-ink">
                Carbelim
              </span>
            </div>

            <div className="space-y-0.5 text-[13px]">
              <div className="px-2 py-1.5 rounded-md text-mute text-xs uppercase tracking-wider font-medium">
                Workspace
              </div>

              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent-soft text-ink font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>All items</span>
                <span className="ml-auto font-mono-ui text-[11px] text-mute">
                  47
                </span>
              </div>

              <SidebarFolder name="Proposals" count={12} />
              <SidebarFolder name="Design files" count={18} active />
              <SidebarFolder name="Decks & slides" count={9} />
              <SidebarFolder name="Contracts" count={4} />
              <SidebarFolder name="Final deliverables" count={4} />
            </div>

            <div className="mt-6 px-1">
              <button className="w-full text-left text-[11px] font-mono-ui text-mute hover:text-ink transition-colors">
                + Invite a client
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-paper p-4">
            {/* Content header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Design files
                </h3>
                <p className="text-xs text-mute mt-0.5">18 items</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-md border border-line bg-paper-elevated px-2.5 py-1.5">
                  <Search className="h-3 w-3 text-mute-soft" />
                  <span className="text-[11px] text-mute-soft font-mono-ui">
                    search
                  </span>
                </div>
                <button className="text-[11px] font-medium text-white bg-accent rounded-md px-2.5 py-1.5">
                  + Add
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5">
              <MockItem
                type="link"
                title="Hero illustration — final v3"
                meta="canva.com · 2 days ago"
                tags={["v3", "approved"]}
                pinned
              />
              <MockItem
                type="file"
                title="Brand guidelines.pdf"
                meta="2.4 MB · last week"
                tags={["brand"]}
              />
              <MockItem
                type="link"
                title="Component library on Figma"
                meta="figma.com · last week"
                tags={["figma", "system"]}
              />
              <MockItem
                type="link"
                title="Email signature template"
                meta="canva.com · 3 days ago"
                tags={["email"]}
              />
              <MockItem
                type="file"
                title="Logo pack — final.zip"
                meta="8.1 MB · today"
                tags={["logo", "final"]}
                accentRow
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarFolder({
  name,
  count,
  active,
}: {
  name: string;
  count: number;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
        active ? "bg-line text-ink font-medium" : "text-mute hover:bg-line/60"
      }`}
    >
      <Folder className="h-3 w-3 text-mute-soft" />
      <span className="truncate text-[13px]">{name}</span>
      <span className="ml-auto font-mono-ui text-[10px] text-mute-soft">
        {count}
      </span>
    </div>
  );
}

function MockItem({
  type,
  title,
  meta,
  tags,
  pinned,
  accentRow,
}: {
  type: "link" | "file";
  title: string;
  meta: string;
  tags: string[];
  pinned?: boolean;
  accentRow?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        accentRow
          ? "border-accent-soft bg-accent-soft/40"
          : "border-line bg-paper-elevated"
      }`}
    >
      <div
        className={`shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${
          type === "link"
            ? "bg-accent-soft text-accent"
            : "bg-line text-mute"
        }`}
      >
        {type === "link" ? (
          <Link2 className="h-3 w-3" />
        ) : (
          <FileText className="h-3 w-3" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-ink truncate">
            {title}
          </span>
          {pinned && (
            <Pin
              className="h-3 w-3 text-accent shrink-0"
              fill="currentColor"
            />
          )}
        </div>
        <p className="text-[11px] text-mute font-mono-ui truncate">{meta}</p>
      </div>

      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {tags.map((t) => (
          <span
            key={t}
            className="font-mono-ui text-[10px] text-mute px-1.5 py-0.5 rounded bg-line/70"
          >
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
}
