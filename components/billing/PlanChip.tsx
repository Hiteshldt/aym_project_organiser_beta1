"use client";

import { Sparkles } from "lucide-react";
import { PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans";

/**
 * Quiet, always-present plan indicator for the sidebar footer. On Free it shows
 * usage + a muted "Upgrade" link; on paid it just names the plan. No popups,
 * no nagging — ambient awareness only.
 */
export default function PlanChip({
  tier,
  workspacesOwned,
  maxWorkspaces,
  onUpgrade,
}: {
  tier: PlanTier;
  workspacesOwned: number;
  maxWorkspaces: number;
  onUpgrade: () => void;
}) {
  const name = PLAN_DISPLAY[tier].name;
  const isFree = tier === "free";
  const limitLabel =
    maxWorkspaces === -1 ? null : `${workspacesOwned} of ${maxWorkspaces} workspaces`;

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-mono-ui uppercase tracking-[0.14em] text-mute">
          <Sparkles className="h-3 w-3 shrink-0 text-mute-soft" />
          <span className="truncate">{name} plan</span>
        </div>
        {limitLabel && (
          <p className="mt-0.5 text-[11px] text-mute-soft truncate">{limitLabel}</p>
        )}
      </div>
      {isFree && (
        <button
          onClick={onUpgrade}
          className="shrink-0 text-[11px] font-medium text-accent hover:underline"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
