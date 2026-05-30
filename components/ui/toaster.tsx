"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Brand-styled sonner toaster.
 * Used at the root layout so toast() can be called from anywhere.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={3500}
      visibleToasts={4}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "!bg-paper-elevated !text-ink !border !border-line !rounded-xl !shadow-[0_8px_30px_-15px_rgba(15,15,15,0.18)] !font-sans !text-sm",
          title: "!text-ink !font-medium !text-sm",
          description: "!text-mute !text-xs",
          success: "!border-success/30",
          error: "!border-danger/30",
          actionButton: "!bg-accent !text-white !rounded-md !text-xs",
          cancelButton: "!bg-line !text-ink !rounded-md !text-xs",
          icon: "!text-accent",
        },
      }}
    />
  );
}
