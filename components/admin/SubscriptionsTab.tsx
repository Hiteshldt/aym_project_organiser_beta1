"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowUpRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Churn = {
  userId: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paddleCustomerId: string | null;
};

type Stats = {
  revenue: {
    mrr: number;
    arr: number;
    payingCount: number;
    byTier: { solo: number; studio: number; agency: number };
  };
  churn: Churn[];
};

// Paddle dashboard base differs by environment.
const PADDLE_BASE =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? "https://vendors.paddle.com"
    : "https://sandbox-vendors.paddle.com";

export default function SubscriptionsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-mute-soft" />
      </div>
    );
  }

  const { revenue, churn } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Est. MRR" value={`$${revenue.mrr.toLocaleString()}`} />
        <Metric label="Solo" value={revenue.byTier.solo} />
        <Metric label="Studio" value={revenue.byTier.studio} />
        <Metric label="Agency" value={revenue.byTier.agency} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display text-xl text-ink">Needs attention</h2>
          <span className="text-xs text-mute-soft">
            {churn.length} subscription{churn.length !== 1 ? "s" : ""}
          </span>
        </div>

        {churn.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper-elevated px-5 py-10 text-center">
            <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
            <p className="text-sm text-mute mt-2">
              No cancellations scheduled and no failing payments. Nice.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-paper-elevated overflow-hidden divide-y divide-line">
            {churn.map((c) => (
              <div key={c.userId} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                  <p className="text-xs text-mute-soft font-mono-ui truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="accent">{c.tier}</Badge>
                  {c.cancelAtPeriodEnd ? (
                    <Badge variant="amber">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      cancels {c.currentPeriodEnd ? formatDate(c.currentPeriodEnd) : "soon"}
                    </Badge>
                  ) : (
                    <Badge variant="rose">{c.status.replace("_", " ")}</Badge>
                  )}
                  {c.paddleCustomerId && (
                    <a
                      href={`${PADDLE_BASE}/customers/${c.paddleCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      Paddle
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-elevated p-5">
      <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink leading-none tabular-nums">{value}</p>
    </div>
  );
}
