import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
