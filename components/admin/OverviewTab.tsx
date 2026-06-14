"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowUpRight, AlertTriangle } from "lucide-react";
import type { AdminTab } from "./AdminShell";

type Stats = {
  users: { total: number; last24h: number; last7d: number; last30d: number };
  content: { workspaces: number; items: number; shares: number };
  revenue: {
    mrr: number;
    arr: number;
    payingCount: number;
    conversion: number;
    byTier: { solo: number; studio: number; agency: number };
  };
  churn: { userId: string }[];
  signups: { date: string; count: number }[];
};

export default function OverviewTab({ onJump }: { onJump: (t: AdminTab) => void }) {
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

  const { users, content, revenue, churn, signups } = stats;

  return (
    <div className="space-y-8">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Est. MRR" value={`$${revenue.mrr.toLocaleString()}`} hint={`$${revenue.arr.toLocaleString()} ARR`} />
        <Metric label="Paying" value={revenue.payingCount} hint={`${(revenue.conversion * 100).toFixed(1)}% conversion`} />
        <Metric label="Total users" value={users.total} hint={`+${users.last7d} this week`} />
        <Metric label="New (24h)" value={users.last24h} hint={`+${users.last30d} in 30d`} />
      </div>

      {/* Signups sparkline */}
      <Card>
        <CardTitle>Signups · last 14 days</CardTitle>
        <Sparkline data={signups} />
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Plan mix */}
        <Card>
          <CardTitle>Plan mix</CardTitle>
          <div className="mt-4 space-y-3">
            <PlanBar label="Solo" count={revenue.byTier.solo} total={revenue.payingCount} color="bg-accent" />
            <PlanBar label="Studio" count={revenue.byTier.studio} total={revenue.payingCount} color="bg-amber-500" />
            <PlanBar label="Agency" count={revenue.byTier.agency} total={revenue.payingCount} color="bg-emerald-500" />
            {revenue.payingCount === 0 && (
              <p className="text-xs text-mute-soft">No paying subscriptions yet.</p>
            )}
          </div>
        </Card>

        {/* Content + churn */}
        <Card>
          <CardTitle>Across the product</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Workspaces" value={content.workspaces} />
            <MiniStat label="Items" value={content.items} />
            <MiniStat label="Shares" value={content.shares} />
          </div>
          <button
            onClick={() => onJump("subscriptions")}
            className={`mt-5 w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              churn.length > 0
                ? "border-amber-300/60 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
                : "border-line text-mute hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2">
              {churn.length > 0 && <AlertTriangle className="h-3.5 w-3.5" />}
              {churn.length > 0
                ? `${churn.length} subscription${churn.length !== 1 ? "s" : ""} need attention`
                : "No churn risk right now"}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </Card>
      </div>
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────────── */

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-elevated p-5">
      <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink leading-none tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-mute-soft">{hint}</p>}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-paper-elevated p-5">{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-mute">{children}</p>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl text-ink tabular-nums">{value}</p>
      <p className="text-[11px] text-mute-soft mt-0.5">{label}</p>
    </div>
  );
}

function PlanBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink font-medium">{label}</span>
        <span className="text-mute font-mono-ui tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="mt-4 flex items-end gap-1 h-20">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-sm bg-accent-soft group-hover:bg-accent transition-colors min-h-[2px]"
            style={{ height: `${(d.count / max) * 100}%` }}
            title={`${d.date}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
}
