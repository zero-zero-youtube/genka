import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

// 入力フィールドコンポーネント
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-[#8B92A9] mb-1.5 font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-[#8B92A9] font-mono select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[#222639] border border-[#2E3347] rounded-lg text-[#F0F2F8]',
              'focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
              'placeholder:text-[#4B5270] transition-colors',
              'min-h-[48px] px-4 py-3',
              prefix && 'pl-8',
              suffix && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-[#8B92A9] select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
