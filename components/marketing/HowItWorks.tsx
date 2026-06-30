export default function HowItWorks() {
  return (
    <section
      id="how"
      className="border-b border-line scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header data-reveal className="max-w-2xl">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          Setup
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Five minutes. <span className="font-display-italic">That's it.</span>
        </h2>
        <p className="mt-4 text-ink-soft">
          No onboarding calls. No data import. Open it, set it up, send the
          link.
        </p>
      </header>

      <div data-reveal-stagger data-step="120" className="mt-12 grid md:grid-cols-3 gap-6 md:gap-10">
        <Step
          number="01"
          title="Create a workspace per client."
          body="Google. Apple. Spotify. One workspace each. Folders inside for proposals, files, links, whatever lives there."
        />
        <Step
          number="02"
          title="Drop in your work."
          body="A Canva link. A Figma file. A PDF proposal. A Drive folder. Anything with a URL or under 20MB."
        />
        <Step
          number="03"
          title="Send one link."
          body="Your client clicks. They see their workspace, beautifully organized. They never see anyone else's work."
          accent
        />
      </div>
      </div>
    </section>
  );
}

function Step({
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
    <div className="relative">
      <div className="flex items-baseline gap-3">
        <span
          className={`font-display text-4xl md:text-5xl leading-none ${
            accent ? "text-accent" : "text-line-strong"
          }`}
        >
          {number}
        </span>
        <span className="h-px flex-1 bg-line translate-y-[-6px]" />
      </div>
      <h3 className="mt-5 font-display text-2xl md:text-[28px] text-ink leading-[1.15] tracking-[-0.01em]">
        {title}
      </h3>
      <p className="mt-3 text-ink-soft text-base leading-relaxed">{body}</p>
    </div>
  );
}
