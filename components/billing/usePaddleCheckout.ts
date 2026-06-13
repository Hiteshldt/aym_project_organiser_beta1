"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so the
// checkout config is read directly here — no prop-drilling from the server.
const ENV =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";
const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";

type OpenArgs = {
  priceId: string;
  email: string;
  userId: string;
};

/**
 * Initializes Paddle.js once and returns an opener for the overlay checkout.
 * `configured` is false when no client token is set, so callers can fall back
 * to a "billing not connected" state instead of a dead button.
 */
export function usePaddleCheckout() {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!TOKEN || initialized.current) return;
    initialized.current = true;
    let cancelled = false;
    initializePaddle({ environment: ENV, token: TOKEN })
      .then((p) => {
        if (!cancelled && p) setPaddle(p);
      })
      .catch((e) => console.error("[paddle] init failed:", e));
    return () => {
      cancelled = true;
    };
  }, []);

  function openCheckout({ priceId, email, userId }: OpenArgs) {
    if (!paddle) return;
    const dark = document.documentElement.classList.contains("dark");
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { userId },
      settings: {
        displayMode: "overlay",
        theme: dark ? "dark" : "light",
        // Return to wherever they upgraded from so the celebration can fire.
        successUrl: `${window.location.origin}${window.location.pathname}?upgraded=1`,
      },
    });
  }

  return { configured: !!TOKEN, ready: !!paddle, openCheckout };
}
