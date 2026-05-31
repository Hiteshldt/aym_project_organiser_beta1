import {
  Building2,
  Link2,
  Search,
  Users,
  Shield,
  Clock,
} from "lucide-react";

export default function Bento() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-6 py-24 md:py-32 scroll-mt-20"
    >
      <header className="text-center max-w-2xl mx-auto">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-mute">
          What's inside
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Three things, <span className="font-display-italic">done properly.</span>
        </h2>
        <p className="mt-4 text-mute">
          No CRM. No invoices. No messaging. Just the thing that was always
          missing.
        </p>
      </header>

      {/* Bento grid */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(180px,auto)]">
        {/* Big tile — one workspace per client */}
        <Tile className="md:col-span-4 md:row-span-2">
          <TileIcon><Building2 className="h-4 w-4" /></TileIcon>
          <TileTitle>One workspace per client.</TileTitle>
          <TileBody>
            Each client gets a clean space — folders, items, history. They
            never see the other 19. You never re-explain where anything lives.
          </TileBody>

          {/* Visual: stack of workspace cards */}
          <div className="mt-auto pt-6 grid grid-cols-3 gap-2">
            {["Google", "Apple", "Spotify"].map((name, i) => (
              <div
                key={name}
                className={`rounded-lg border p-3 ${
                  i === 1
                    ? "bg-accent-soft border-accent/30 -translate-y-1"
                    : "bg-paper-elevated border-line"
                } transition-transform`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      i === 1 ? "bg-accent" : "bg-mute-soft"
                    }`}
                  />
                  <span className="text-[12px] font-medium text-ink truncate">
                    {name}
                  </span>
                </div>
                <p className="text-[10px] font-mono-ui text-mute mt-2">
                  {[12, 28, 7][i]} items
                </p>
              </div>
            ))}
          </div>
        </Tile>

        {/* Small tile — client magic link */}
        <Tile className="md:col-span-2">
          <TileIcon><Shield className="h-4 w-4" /></TileIcon>
          <TileTitle>Magic link access.</TileTitle>
          <TileBody>
            Clients don't sign up. They click a link, they're in. Revoke
            anytime.
          </TileBody>
        </Tile>

        {/* Small tile — search */}
        <Tile className="md:col-span-2">
          <TileIcon><Search className="h-4 w-4" /></TileIcon>
          <TileTitle>Press ⌘K. Find anything.</TileTitle>
          <TileBody>
            Search titles, tags, notes, URLs. Across every workspace at once.
          </TileBody>
          <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
            <Search className="h-3 w-3 text-mute-soft" />
            <span className="text-[12px] text-mute font-mono-ui">
              brand guidelines
            </span>
            <span className="ml-auto font-mono-ui text-[10px] text-mute-soft border border-line px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>
        </Tile>

        {/* Big tile — duplicate detection */}
        <Tile className="md:col-span-4">
          <TileIcon><Link2 className="h-4 w-4" /></TileIcon>
          <TileTitle>Never share the same link twice.</TileTitle>
          <TileBody>
            Paste a URL that already exists in this workspace? Ayuvam tells you
            where it lives and offers to add a quick update note instead.
          </TileBody>

          <div className="mt-5 rounded-lg border border-warning/30 bg-amber-50/40 p-3">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
                <Link2 className="h-2.5 w-2.5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ink">
                  Already in <span className="text-warning">Proposals</span>
                </p>
                <p className="text-[11px] text-mute font-mono-ui mt-0.5">
                  Google — Pixel 9 launch deck v2 · added 12 days ago
                </p>
              </div>
            </div>
          </div>
        </Tile>

        {/* Small — roles */}
        <Tile className="md:col-span-3">
          <TileIcon><Users className="h-4 w-4" /></TileIcon>
          <TileTitle>Right access for the right person.</TileTitle>
          <TileBody>
            Managers organize. Readers view. Clients see only their own
            workspace. Nobody sees what they shouldn't.
          </TileBody>
        </Tile>

        {/* Small — versioning */}
        <Tile className="md:col-span-3">
          <TileIcon><Clock className="h-4 w-4" /></TileIcon>
          <TileTitle>Every update, on the record.</TileTitle>
          <TileBody>
            Replace a deck with v4? The history stays. Clients can see "updated
            with new pricing — 3 days ago" without you sending an email.
          </TileBody>
        </Tile>
      </div>
    </section>
  );
}

function Tile({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-line bg-paper-elevated p-6 flex flex-col transition-all hover:border-line-strong hover:shadow-[0_10px_40px_-20px_rgba(15,15,15,0.15)] ${className}`}
    >
      {children}
    </div>
  );
}

function TileIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-8 w-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
      {children}
    </div>
  );
}

function TileTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 font-display text-xl md:text-2xl text-ink leading-[1.15] tracking-[-0.01em]">
      {children}
    </h3>
  );
}

function TileBody({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-sm text-mute leading-relaxed">{children}</p>
  );
}
