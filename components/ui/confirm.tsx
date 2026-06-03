"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the confirm button stays disabled until the user types this
   *  exact string (e.g. the folder name) — guards genuinely destructive acts. */
  requireText?: string;
  requireTextLabel?: string;
};

type Resolver = (ok: boolean) => void;

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Wrap the app in <ConfirmProvider> so any component can do:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete this?", danger: true })) { ... }
 *
 * One dialog at the root replaces all browser confirm() calls.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setTyped("");
      setState(opts);
    });
  }, []);

  function handleResult(ok: boolean) {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setState(null);
    setTyped("");
  }

  const textGate = !!state?.requireText && typed.trim() !== state.requireText;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!state}
        onOpenChange={(open) => {
          if (!open) handleResult(false);
        }}
      >
        {state && (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {state.danger && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-danger/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                  </span>
                )}
                {state.title}
              </DialogTitle>
              {state.body && <DialogDescription>{state.body}</DialogDescription>}
            </DialogHeader>

            {state.requireText && (
              <div className="px-6 pb-1 space-y-1.5">
                <p className="text-xs text-mute">
                  {state.requireTextLabel ?? (
                    <>Type <span className="font-medium text-ink">{state.requireText}</span> to confirm.</>
                  )}
                </p>
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !textGate) handleResult(true);
                  }}
                  placeholder={state.requireText}
                  autoFocus
                />
              </div>
            )}

            <div className="px-6 pb-6 pt-3 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleResult(false)}
                autoFocus={!state.requireText}
              >
                {state.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                type="button"
                variant={state.danger ? "destructive" : "accent"}
                onClick={() => handleResult(true)}
                disabled={textGate}
              >
                {state.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx;
}

/**
 * Escape hatch for non-component contexts (e.g. utilities).
 * Falls back to native confirm() if the provider isn't mounted.
 */
export function useSafeConfirm() {
  const ctx = useContext(ConfirmContext);
  return ctx ?? ((opts: ConfirmOptions) => Promise.resolve(window.confirm(opts.title)));
}

