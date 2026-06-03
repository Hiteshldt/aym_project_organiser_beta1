"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "ayuvam-theme";
type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

/**
 * Scopes dark mode to whatever it wraps (workspace, share view). The class
 * goes on <html> so portals (modals, toasts, dropdowns) inherit it too, and is
 * removed on unmount so marketing pages — which never mount this — stay light.
 * A matching inline script in layout.tsx applies it pre-paint to avoid a flash.
 */
export function ThemeController({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-md text-mute hover:text-ink hover:bg-line/60 transition-colors",
        className
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
