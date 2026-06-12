import { MessageSquare, FolderTree, Mail, Sparkles } from "lucide-react";

export default function BeforeAfter() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          The problem
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Your client work, <span className="font-display-italic">right now.</span>
        </h2>
        <p className="mt-4 text-ink-soft text-base md:text-lg max-w-xl">
          Most studios deliver excellent work through messy channels. Three
          ways it falls apart:
        </p>
      </header>

      <div className="mt-12 grid md:grid-cols-3 gap-4">
        <PainCard
          icon={<MessageSquare className="h-4 w-4" />}
          title="Slack scrolling"
          body="A link from Tuesday last month, three threads ago. You'll find it eventually."
        />
        <PainCard
          icon={<FolderTree className="h-4 w-4" />}
          title="Drive folder chaos"
          body='Five folders called "Final", a sixth called "Final final", and your client opening "Final v2 — old".'
        />
        <PainCard
          icon={<Mail className="h-4 w-4" />}
          title="Email thread hunt"
          body='Subject line: "Re: Re: Fwd: design assets". The attachment was in the first message.'
        />
      </div>

      {/* Divider into the "after" */}
      <div className="my-12 flex items-center gap-6">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono-ui text-[11px] uppercase tracking-[0.25em] text-mute-soft">
          on ayuvam
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <header className="max-w-3xl">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          The fix
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          One place. <span className="font-display-italic">Per client.</span>
        </h2>
        <p className="mt-4 text-ink-soft text-base md:text-lg max-w-xl">
          Every client gets a workspace. You organize. They open one link.
          Nobody hunts for anything.
        </p>
      </header>

      <div className="mt-12 grid md:grid-cols-3 gap-4">
        <FixCard
          number="01"
          title="Drop everything in"
          body="Files up to 20MB. Any link — Figma, Canva, Drive, Notion. Tag it, note it, done."
        />
        <FixCard
          number="02"
          title="Search instantly"
          body="Titles, tags, notes, dates. Type a word — even misspelled — and what you delivered six months ago is there."
        />
        <FixCard
          number="03"
          title="Share with one link"
          body="Your client clicks. They see only their workspace. No account, no password, no nonsense."
          accent
        />
      </div>
    </section>
  );
}

function PainCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-line bg-paper-elevated p-6 card-lift">
      <div className="flex items-center gap-2 text-mute">
        <span className="h-7 w-7 rounded-md bg-line/70 flex items-center justify-center">
          {icon}
        </span>
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">
          Before
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}

function FixCard({
  number,
  title,
  body,
  accent,
}: {
  number: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-2xl p-6 transition-all ${
        accent
          ? "bg-ink text-paper border border-ink"
          : "bg-paper-elevated border border-line card-lift"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-mono-ui text-[11px] ${
            accent ? "text-paper/70" : "text-accent"
          }`}
        >
          {number}
        </span>
        {accent && (
          <Sparkles className="h-3 w-3 text-paper/70" />
        )}
      </div>
      <h3
        className={`mt-3 font-display text-xl ${
          accent ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          accent ? "text-paper/75" : "text-ink-soft"
        }`}
      >
        {body}
      </p>
    </div>
  );
}
