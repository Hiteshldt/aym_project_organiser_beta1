import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Turn a long URL into a clean, scannable label.
 * "https://docs.google.com/spreadsheets/d/1qW3.../edit?usp=sharing"
 *   → "docs.google.com"
 * Falls back to the raw string if it isn't a parseable URL.
 */
export function prettyUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

// Query params that are view-state / tracking noise, not resource identity.
// Stripped before comparing two URLs so the same Google Doc opened with
// "?gid=…" and "?usp=sharing" is recognised as one link. Meaningful params
// (e.g. YouTube's "?v=") are deliberately kept.
const URL_NOISE_PARAMS = new Set([
  "usp",
  "gid",
  "fbclid",
  "gclid",
  "ref",
  "ref_src",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "mc_cid",
  "mc_eid",
  "igshid",
  "spm",
]);

/**
 * Canonicalize a URL for duplicate detection:
 * - lowercase scheme + host, drop a leading "www."
 * - drop the #fragment
 * - drop known tracking / view-state query params, keep the rest (sorted)
 * - strip a trailing slash
 * Two links to the same resource collapse to the same string. Falls back to a
 * trimmed/lowercased copy if the input isn't a parseable URL.
 */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.replace(/^www\./, "").toLowerCase();
    u.hash = "";
    const kept = new URLSearchParams();
    [...u.searchParams.entries()]
      .filter(([k]) => !URL_NOISE_PARAMS.has(k.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => kept.append(k, v));
    u.search = kept.toString();
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const FOLDER_COLORS = {
  slate: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-400" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
} as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
