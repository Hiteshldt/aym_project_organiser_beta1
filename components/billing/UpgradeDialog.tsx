"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import PlanCards from "./PlanCards";
import type { PlanTier } from "@/lib/billing/plans";

const REASON_COPY: Record<string, string> = {
  workspace:
    "You've used all the client workspaces on your current plan. Here's what more room looks like.",
  members: "Need more teammates in a workspace? A higher plan opens that up.",
  storage: "Running low on storage? More comes with the plans below.",
};

export default function UpgradeDialog({
  open,
  onOpenChange,
  currentTier,
  email,
  userId,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: PlanTier;
  email: string;
  userId: string;
  reason?: string | null;
}) {
  const contextLine = reason ? REASON_COPY[reason] : null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="upgrade-overlay fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="upgrade-sheet fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-line bg-paper shadow-float"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper/95 nav-blur px-7 py-5">
            <div>
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-accent">
                Plans
              </p>
              <DialogPrimitive.Title className="mt-1 font-display text-2xl text-ink tracking-[-0.01em]">
                Room to grow
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[13px] text-mute max-w-md">
                {contextLine ??
                  "Upgrade any time. Plans are billed through Paddle — cancel whenever."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="shrink-0 rounded-lg p-1.5 text-mute hover:text-ink hover:bg-line/50 transition-colors">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="px-7 py-6">
            <PlanCards currentTier={currentTier} email={email} userId={userId} />
            <p className="mt-6 text-center text-[11px] font-mono-ui text-mute-soft">
              Secure checkout by Paddle · prices in USD
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
