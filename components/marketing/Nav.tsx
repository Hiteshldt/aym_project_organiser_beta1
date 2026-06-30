import Link from "next/link";
import { auth } from "@/lib/auth";
import { ArrowUpRight } from "lucide-react";
import MobileMenu from "@/components/marketing/MobileMenu";

export default async function Nav() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <header className="sticky top-0 z-50 nav-blur">
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display-italic text-2xl text-ink leading-none"
          aria-label="Ayuvam home"
        >
          Ayuvam
        </Link>

        {/* Center links — hide on mobile */}
        <div className="hidden md:flex items-center gap-8 text-sm text-mute">
          <Link
            href="#features"
            className="hover:text-ink transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="hover:text-ink transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#how"
            className="hover:text-ink transition-colors"
          >
            How it works
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href="/workspace"
              className="btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            >
              Open app
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm text-mute hover:text-ink transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
              >
                Start free
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
          <MobileMenu isLoggedIn={isLoggedIn} />
        </div>
      </nav>

      {/* Hairline border that fades with the blur */}
      <div className="h-px bg-line w-full" />
    </header>
  );
}
