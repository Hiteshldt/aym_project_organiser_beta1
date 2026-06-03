// ─────────────────────────────────────────────────────────────────
// Register palettes — shared by the editable grid (manager) and the
// read-only client share table. Classes are written as full literals so
// Tailwind's scanner keeps them; do NOT build these by interpolation.
// ─────────────────────────────────────────────────────────────────

export type RegisterColor =
  | "slate"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink";

export type StatusOption = { label: string; color: RegisterColor };

// The set a brand-new register starts with. Users can rename / recolor / add.
export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { label: "To do", color: "slate" },
  { label: "In progress", color: "amber" },
  { label: "Delivered", color: "green" },
  { label: "Approved", color: "violet" },
];

// The colors offered in the status/row-color pickers, in display order.
export const REGISTER_COLORS: RegisterColor[] = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
];

// Status chip: pill background + text. Light + dark.
export const STATUS_CHIP: Record<RegisterColor, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300",
};

// Small solid dot — used in pickers.
export const COLOR_DOT: Record<RegisterColor, string> = {
  slate: "bg-slate-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

// Row tint — applied to a whole register row. Subtle so text stays readable,
// but strong enough to read on the dark charcoal base.
export const ROW_TINT: Record<RegisterColor, string> = {
  slate: "bg-slate-50 dark:bg-slate-400/15",
  red: "bg-red-50 dark:bg-red-400/15",
  orange: "bg-orange-50 dark:bg-orange-400/15",
  amber: "bg-amber-50 dark:bg-amber-400/15",
  green: "bg-green-50 dark:bg-green-400/15",
  teal: "bg-teal-50 dark:bg-teal-400/15",
  blue: "bg-blue-50 dark:bg-blue-400/15",
  violet: "bg-violet-50 dark:bg-violet-400/15",
  pink: "bg-pink-50 dark:bg-pink-400/15",
};

export function isRegisterColor(v: unknown): v is RegisterColor {
  return typeof v === "string" && (REGISTER_COLORS as string[]).includes(v);
}

/** Resolve a status label to its option (for the chip color). */
export function findStatus(
  options: StatusOption[],
  label: string | null | undefined
): StatusOption | null {
  if (!label) return null;
  return options.find((o) => o.label === label) ?? null;
}
