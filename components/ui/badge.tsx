import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "amber" | "rose" | "emerald" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        {
          "bg-line text-mute": variant === "default",
          "bg-accent-soft text-accent-hover": variant === "accent",
          "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300": variant === "amber",
          "bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300": variant === "rose",
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300": variant === "emerald",
          "border border-line-strong bg-transparent text-mute": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
