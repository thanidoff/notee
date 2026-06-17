import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm': variant === 'primary',
            'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm': variant === 'secondary',
            'hover:bg-slate-100 text-slate-700': variant === 'ghost',
            'bg-red-100 text-red-600 hover:bg-red-200': variant === 'destructive',
            'h-9 px-4 py-2': size === 'md',
            'h-8 px-3 text-xs': size === 'sm',
            'h-11 px-8 rounded-[var(--radius-lg)]': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
