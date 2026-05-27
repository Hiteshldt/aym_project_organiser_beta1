import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#111] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-accent-soft-hover focus:border-accent disabled:opacity-50 transition-all duration-150 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
