"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Sparkles } from "lucide-react";
import PlanCards from "./PlanCards";
import { PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans";

export type BillingProps = {
  userId: string;
  email: string;
  currentTier: PlanTier;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPanel(props: BillingProps) {
  const { currentTier, email, userId, hasCustomer, currentPeriodEnd } = props;
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = currentTier !== "free";

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
            <span className="text-ink font-medium">
              {PLAN_DISPLAY[currentTier].name}
            </span>{" "}
            plan.
            {isPaid && currentPeriodEnd && (
              <>
                {" "}
                {props.cancelAtPeriodEnd ? "Cancels" : "Renews"}{" "}
                {fmtDate(currentPeriodEnd)}.
              </>
            )}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3 w-3" />
          {PLAN_DISPLAY[currentTier].name}
        </span>
      </div>

      {isPaid && hasCustomer && (
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

      <div className="mt-6 border-t border-line pt-6">
        <PlanCards currentTier={currentTier} email={email} userId={userId} />
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
