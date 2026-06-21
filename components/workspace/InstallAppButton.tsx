"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

// Subtle "Install app" affordance. On Chrome/Edge we capture the browser's
// beforeinstallprompt and fire the native install dialog on click. On Safari
// (no programmatic prompt) we point to File → Add to Dock. Hidden entirely once
// the app is already running as an installed standalone window, and on browsers
// with no install path at all.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [isSafari, setIsSafari] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Already installed → nothing to offer.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
    setIsSafari(safari);
    // Show immediately for Safari (manual path); Chrome/Edge reveal on the event.
    if (safari) setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setHidden(true);
      setDeferred(null);
      toast.success("Ayuvam installed — find it in your Dock or Start menu.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setHidden(true);
      return;
    }
    toast(
      isSafari
        ? "In Safari: File → Add to Dock to install Ayuvam as an app."
        : "Open your browser menu and choose “Install Ayuvam” to add it as an app.",
      { duration: 6000 }
    );
  }

  return (
    <button
      onClick={handleClick}
      title="Install Ayuvam as an app"
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-mute hover:text-ink hover:bg-line/50 transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">Install app</span>
    </button>
  );
}
