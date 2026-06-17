import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'accent';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)]",
        {
          'bg-[var(--color-primary-base)] text-white': variant === 'default',
          'bg-slate-100 text-slate-800': variant === 'secondary',
          'text-slate-800 border border-slate-200': variant === 'outline',
          'bg-[var(--color-accent-glow)] text-white': variant === 'accent',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
