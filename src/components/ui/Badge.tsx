import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'danger' | 'warning' | 'success' | 'blue' | 'gray'
  children: React.ReactNode
  className?: string
  pulse?: boolean
}

// ステータスバッジコンポーネント
const Badge = ({ variant, children, className, pulse }: BadgeProps) => {
  const variants = {
    danger: 'badge-danger',
    warning: 'badge-warning',
    success: 'badge-success',
    blue: 'badge-blue',
    gray: 'badge-gray',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold',
        variants[variant],
        pulse && variant === 'danger' && 'animate-pulse-danger',
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
