"use client";

import { useEffect } from "react";

/**
 * Drives the marketing page's motion:
 *
 *  • `data-reveal`          — element rises in once when it scrolls into view.
 *  • `data-reveal-stagger`  — its direct children rise in one after another.
 *  • `data-spotlight`       — a warm glow follows the pointer across the card.
 *
 * Stagger delay per child can be tuned with `data-step` (ms, default 90).
 * Everything respects prefers-reduced-motion.
 */
export default function RevealProvider() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const singles = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal-stagger]")
    );

    // Pre-set per-child stagger delays so the cascade reads left-to-right.
    for (const group of groups) {
      const step = Number(group.dataset.step ?? 90);
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty("--rd", `${i * step}ms`);
      });
    }

    const reveal = (el: HTMLElement) => {
      if (el.hasAttribute("data-reveal-stagger")) {
        Array.from(el.children).forEach((c) =>
          (c as HTMLElement).classList.add("reveal-in")
        );
      } else {
        el.classList.add("reveal-in");
      }
    };

    let cleanupReveal = () => {};
    if (reduce) {
      [...singles, ...groups].forEach(reveal);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              reveal(entry.target as HTMLElement);
              io.unobserve(entry.target);
            }
          }
        },
        // threshold 0 = fire on first pixel; safe for tall grids.
        { rootMargin: "0px 0px -12% 0px", threshold: 0 }
      );

      [...singles, ...groups].forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9) reveal(el);
        else io.observe(el);
      });

      // Safety net — never leave content stuck hidden if something misfires.
      const failsafe = window.setTimeout(() => {
        [...singles, ...groups].forEach(reveal);
      }, 2500);

      cleanupReveal = () => {
        window.clearTimeout(failsafe);
        io.disconnect();
      };
    }

    // ── Cursor spotlight ────────────────────────────────────────────
    const spots = Array.from(
      document.querySelectorAll<HTMLElement>("[data-spotlight]")
    );
    const onMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    if (!reduce) {
      spots.forEach((el) => el.addEventListener("pointermove", onMove));
    }

    return () => {
      cleanupReveal();
      spots.forEach((el) => el.removeEventListener("pointermove", onMove));
    };
  }, []);

  return null;
}
