import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      {/* Editorial sign-off */}
      <div className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
          <p className="font-display text-3xl md:text-5xl text-ink leading-[1.08] tracking-[-0.02em] max-w-2xl">
            Make the work look{" "}
            <span className="font-display-italic text-accent">as good as it is.</span>
          </p>
          <p className="mt-4 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute-soft">
            The handoff should match the work
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Brand */}
        <div className="space-y-1">
          <div className="font-display-italic text-2xl text-ink leading-none">
            Ayuvam
          </div>
          <p className="text-xs font-mono-ui text-mute-soft tracking-wide">
            ah-yoo-vam · made for studios
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mute">
          <Link href="/pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <Link href="/#features" className="hover:text-ink transition-colors">
            Features
          </Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink transition-colors">
            Terms
          </Link>
          <Link href="/refund" className="hover:text-ink transition-colors">
            Refunds
          </Link>
          <a
            href="https://twitter.com"
            className="hover:text-ink transition-colors"
            rel="noopener noreferrer"
            target="_blank"
          >
            Twitter
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between text-xs text-mute-soft">
          <span>© {new Date().getFullYear()} Ayuvam</span>
          <span className="font-mono-ui">v0.1 — early access</span>
        </div>
      </div>
    </footer>
  );
}
