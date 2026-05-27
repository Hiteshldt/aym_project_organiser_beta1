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
          "bg-[#f0f0f0] text-[#555]": variant === "default",
          "bg-accent-soft text-accent-hover": variant === "accent",
          "bg-amber-50 text-amber-700": variant === "amber",
          "bg-rose-50 text-rose-700": variant === "rose",
          "bg-emerald-50 text-emerald-700": variant === "emerald",
          "border border-[#e5e5e5] bg-transparent text-[#555]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
