"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check, Loader2, ExternalLink, Sparkles } from "lucide-react";

export type BillingProps = {
  userId: string;
  email: string;
  currentTier: "free" | "solo" | "studio" | "agency";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
  env: "production" | "sandbox";
  clientToken: string | null;
  prices: {
    solo: { monthly: string; annual: string };
    studio: { monthly: string; annual: string };
    agency: { monthly: string; annual: string };
  };
};

const TIER_RANK = { free: 0, solo: 1, studio: 2, agency: 3 } as const;

const PLAN_COPY = {
  solo: {
    name: "Solo",
    monthly: 9,
    annual: 90,
    features: ["5 client workspaces", "3 team members", "2GB storage"],
  },
  studio: {
    name: "Studio",
    monthly: 19,
    annual: 190,
    features: [
      "Unlimited workspaces",
      "10 team members",
      "10GB storage",
      "Priority support",
    ],
  },
} as const;

export default function BillingPanel(props: BillingProps) {
  const { userId, email, currentTier, clientToken, env, prices } = props;
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [annual, setAnnual] = useState(true);
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = !!clientToken;

  useEffect(() => {
    if (!clientToken) return;
    let cancelled = false;
    initializePaddle({
      environment: env,
      token: clientToken,
      pwCustomer: email ? { email } : undefined,
    })
      .then((p) => {
        if (!cancelled && p) setPaddle(p);
      })
      .catch((e) => console.error("[paddle] init failed:", e));
    return () => {
      cancelled = true;
    };
  }, [clientToken, env, email]);

  function openCheckout(tier: "solo" | "studio") {
    if (!paddle) return;
    const priceId = annual ? prices[tier].annual : prices[tier].monthly;
    if (!priceId) {
      setError("That plan isn't available yet — please email sales@ayuvam.com.");
      return;
    }
    setError(null);
    setBusyTier(tier);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { userId },
      settings: {
        displayMode: "overlay",
        theme: document.documentElement.classList.contains("dark")
          ? "dark"
          : "light",
        successUrl: `${window.location.origin}/settings?upgraded=1`,
      },
    });
    // Re-enable shortly; the overlay takes over the UI from here.
    setTimeout(() => setBusyTier(null), 1500);
  }

  async function openPortal() {
    setPortalBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Couldn't open billing portal.");
    } catch {
      setError("Couldn't open billing portal.");
    } finally {
      setPortalBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-paper-elevated p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink">Plan &amp; billing</h2>
          <p className="text-sm text-mute mt-1">
            You&rsquo;re on the{" "}
            <span className="text-ink font-medium capitalize">
              {currentTier}
            </span>{" "}
            plan.
            {props.cancelAtPeriodEnd && props.currentPeriodEnd && (
              <>
                {" "}
                Cancels on{" "}
                {new Date(props.currentPeriodEnd).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                .
              </>
            )}
            {!props.cancelAtPeriodEnd &&
              currentTier !== "free" &&
              props.currentPeriodEnd && (
                <>
                  {" "}
                  Renews{" "}
                  {new Date(props.currentPeriodEnd).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                  .
                </>
              )}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent capitalize">
          <Sparkles className="h-3 w-3" />
          {currentTier}
        </span>
      </div>

      {!configured && (
        <p className="mt-5 rounded-lg border border-line bg-paper px-4 py-3 text-[13px] text-mute">
          Billing isn&rsquo;t connected yet. Once Paddle keys are set, upgrade
          options appear here.
        </p>
      )}

      {configured && (
        <>
          {/* Manage existing subscription */}
          {currentTier !== "free" && props.hasCustomer && (
            <div className="mt-5">
              <button
                onClick={openPortal}
                disabled={portalBusy}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-5 py-2.5 text-sm font-medium text-ink hover:border-accent transition-colors disabled:opacity-50"
              >
                {portalBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Manage billing &amp; invoices
              </button>
            </div>
          )}

          {/* Upgrade options — only tiers above the current one */}
          {TIER_RANK[currentTier] < TIER_RANK.studio && (
            <div className="mt-6 border-t border-line pt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-mute">
                  {currentTier === "free" ? "Upgrade" : "Change plan"}
                </p>
                <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1 text-xs">
                  <button
                    onClick={() => setAnnual(false)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      !annual ? "bg-ink text-paper" : "text-mute hover:text-ink"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setAnnual(true)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      annual ? "bg-ink text-paper" : "text-mute hover:text-ink"
                    }`}
                  >
                    Annual <span className="text-accent">−17%</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["solo", "studio"] as const)
                  .filter((t) => TIER_RANK[currentTier] < TIER_RANK[t])
                  .map((tier) => {
                    const copy = PLAN_COPY[tier];
                    const price = annual ? copy.annual / 12 : copy.monthly;
                    return (
                      <div
                        key={tier}
                        className="rounded-xl border border-line bg-paper p-5 flex flex-col"
                      >
                        <h3 className="font-display text-lg text-ink">
                          {copy.name}
                        </h3>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="font-display text-3xl text-ink tracking-[-0.02em]">
                            ${price % 1 === 0 ? price : price.toFixed(2)}
                          </span>
                          <span className="text-xs text-mute">/mo</span>
                        </div>
                        <ul className="mt-3 space-y-1.5 flex-1">
                          {copy.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-[13px] text-ink-soft"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => openCheckout(tier)}
                          disabled={!paddle || busyTier === tier}
                          className="btn-accent mt-4 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                        >
                          {busyTier === tier ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            `Upgrade to ${copy.name}`
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <p className="mt-4 text-xs text-mute-soft">
                Need more — unlimited team, white label, custom subdomain?{" "}
                <a href="/contact" className="text-accent hover:underline">
                  Talk to us about Agency
                </a>
                .
              </p>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
