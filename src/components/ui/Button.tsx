'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

// メインボタンコンポーネント
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]'

    const variants = {
      primary:
        'bg-amber-500 hover:bg-amber-400 text-gray-900 shadow-lg shadow-amber-500/20',
      secondary:
        'bg-[#222639] hover:bg-[#2E3347] text-[#F0F2F8] border border-[#2E3347]',
      danger: 'bg-red-600 hover:bg-red-500 text-white',
      ghost: 'hover:bg-[#222639] text-[#8B92A9] hover:text-[#F0F2F8]',
    }

    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5',
      md: 'px-5 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
