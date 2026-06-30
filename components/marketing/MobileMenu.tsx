"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";

/* Mobile nav menu — the hamburger + drop panel shown below `md`.
   The desktop links live in Nav.tsx (hidden on mobile). */
export default function MobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-paper-dim transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* Tap-away backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-ink/10"
            aria-hidden
            onClick={close}
          />
          {/* Panel */}
          <div className="absolute left-0 right-0 top-full z-50 border-b border-line bg-paper-elevated shadow-soft">
            <nav className="mx-auto max-w-6xl px-6 py-4 flex flex-col">
              <Link href="/#features" onClick={close} className="py-3 text-base text-ink border-b border-line">
                Features
              </Link>
              <Link href="/pricing" onClick={close} className="py-3 text-base text-ink border-b border-line">
                Pricing
              </Link>
              <Link href="/#how" onClick={close} className="py-3 text-base text-ink border-b border-line">
                How it works
              </Link>
              {!isLoggedIn && (
                <Link href="/login" onClick={close} className="py-3 text-base text-ink">
                  Log in
                </Link>
              )}
              <Link
                href={isLoggedIn ? "/workspace" : "/login"}
                onClick={close}
                className="btn-accent mt-3 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium"
              >
                {isLoggedIn ? "Open app" : "Start free"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
