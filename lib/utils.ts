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
