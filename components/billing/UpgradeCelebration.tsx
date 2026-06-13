"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CONFETTI = Array.from({ length: 18 }, (_, i) => i);
const COLORS = ["var(--accent)", "var(--accent-2)", "var(--success)"];

/**
 * One-time, on-brand celebration shown when checkout returns with ?upgraded=1.
 * Draws a checkmark + a soft brand-colored confetti, cleans the URL param, and
 * refreshes server data so the plan badge flips. Reduced-motion safe (CSS).
 */
export default function UpgradeCelebration() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") !== "1") return;

    setShow(true);

    // Strip the param so a refresh/back doesn't re-trigger it.
    params.delete("upgraded");
    const clean =
      window.location.pathname +
      (params.toString() ? `?${params}` : "") +
      window.location.hash;
    window.history.replaceState(null, "", clean);

    // Pull the freshly-written subscription (webhook may land a beat later).
    const refresh = setTimeout(() => router.refresh(), 1500);
    const hide = setTimeout(() => setShow(false), 4200);
    return () => {
      clearTimeout(refresh);
      clearTimeout(hide);
    };
  }, [router]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-paper/40 backdrop-blur-[2px] upgrade-cele-fade"
      onClick={() => setShow(false)}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((i) => (
          <span
            key={i}
            className="upgrade-confetti"
            style={{
              left: `${(i / CONFETTI.length) * 100}%`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 6) * 0.12}s`,
              transform: `rotate(${i * 37}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative rounded-2xl border border-line bg-paper-elevated px-10 py-9 text-center shadow-float upgrade-cele-pop">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
          <svg viewBox="0 0 52 52" className="h-9 w-9">
            <circle
              className="upgrade-check-circle"
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
            />
            <path
              className="upgrade-check-tick"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 27 L23 35 L38 18"
            />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-3xl text-ink tracking-[-0.01em]">
          You&rsquo;re upgraded.
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Thanks for backing Ayuvam — your new plan is live.
        </p>
        <button
          onClick={() => setShow(false)}
          className="btn-accent mt-6 inline-flex rounded-full px-6 py-2.5 text-sm font-medium"
        >
          Let&rsquo;s go
        </button>
      </div>
    </div>
  );
}
