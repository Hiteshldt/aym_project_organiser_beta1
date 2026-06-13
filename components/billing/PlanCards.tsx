"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  PLAN_DISPLAY,
  PLAN_ORDER,
  planRank,
  priceIdFor,
  type PlanTier,
  type BillingCycle,
} from "@/lib/billing/plans";
import { usePaddleCheckout } from "./usePaddleCheckout";

export default function PlanCards({
  currentTier,
  email,
  userId,
}: {
  currentTier: PlanTier;
  email: string;
  userId: string;
}) {
  const [annual, setAnnual] = useState(true);
  const [busy, setBusy] = useState<PlanTier | null>(null);
  const { configured, ready, openCheckout } = usePaddleCheckout();
  const cycle: BillingCycle = annual ? "annual" : "monthly";

  function onChoose(tier: PlanTier) {
    const priceId = priceIdFor(tier, cycle);
    if (!priceId) return;
    setBusy(tier);
    openCheckout({ priceId, email, userId });
    setTimeout(() => setBusy(null), 1800);
  }

  return (
    <div>
      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1 text-xs">
          <button
            onClick={() => setAnnual(false)}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              !annual ? "bg-ink text-paper" : "text-mute hover:text-ink"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              annual ? "bg-ink text-paper" : "text-mute hover:text-ink"
            }`}
          >
            Annual <span className="text-accent">save 17%</span>
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PLAN_ORDER.map((tier) => {
          const d = PLAN_DISPLAY[tier];
          const isCurrent = tier === currentTier;
          const isDowngrade = planRank(tier) < planRank(currentTier);
          const price = annual ? d.annual / 12 : d.monthly;
          const featured = tier === "studio";

          return (
            <div
              key={tier}
              className={`relative rounded-xl border p-5 flex flex-col transition-colors ${
                isCurrent
                  ? "border-accent bg-accent-soft/40"
                  : featured
                    ? "border-line-strong bg-paper-elevated"
                    : "border-line bg-paper-elevated"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-mono-ui uppercase tracking-wider text-paper">
                  Current
                </span>
              )}

              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl text-ink">{d.name}</h3>
                <div className="text-right">
                  <span className="font-display text-2xl text-ink tracking-[-0.02em]">
                    ${price % 1 === 0 ? price : price.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-mute">/mo</span>
                </div>
              </div>
              <p className="mt-1 text-[13px] text-mute">{d.tagline}</p>

              <ul className="mt-4 space-y-1.5 flex-1">
                {d.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13px] text-ink-soft"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div className="text-center text-xs font-mono-ui text-mute py-2.5">
                    Your plan
                  </div>
                ) : isDowngrade ? (
                  <div className="text-center text-xs font-mono-ui text-mute-soft py-2.5">
                    Included below
                  </div>
                ) : d.selfServe ? (
                  <button
                    onClick={() => onChoose(tier)}
                    disabled={!configured || !ready || busy === tier}
                    className="btn-accent w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {busy === tier ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      `Choose ${d.name}`
                    )}
                  </button>
                ) : (
                  <a
                    href="/contact"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-4 py-2.5 text-sm font-medium text-ink hover:border-accent transition-colors"
                  >
                    Talk to us
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!configured && (
        <p className="mt-4 text-center text-[13px] text-mute">
          Billing isn&rsquo;t connected yet — upgrades will light up once it is.
        </p>
      )}
    </div>
  );
}
