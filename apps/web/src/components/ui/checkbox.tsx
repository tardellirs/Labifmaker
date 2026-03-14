import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <input
    className={cn(
      "h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100",
      className
    )}
    ref={ref}
    type="checkbox"
    {...props}
  />
));

Checkbox.displayName = "Checkbox";

export { Checkbox };
