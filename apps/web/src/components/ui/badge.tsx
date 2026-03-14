import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700",
        brand: "bg-brand-100 text-brand-700",
        warm: "bg-amber-100 text-amber-800",
        success: "bg-emerald-100 text-emerald-800",
        danger: "bg-rose-100 text-rose-800"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, variant, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
