import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  danger?: boolean
}

// カードコンポーネント
export const Card = ({ className, danger, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-[#1A1D26] border border-[#2E3347] rounded-xl p-5',
        danger && 'border-red-500/40 danger-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// カードヘッダー
export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
)

// カードタイトル
export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-[#8B92A9] text-sm font-bold uppercase tracking-wider', className)} {...props}>
    {children}
  </h3>
)

// カードの大きな値表示
export const CardValue = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('font-mono text-3xl font-semibold text-[#F0F2F8] mt-1', className)} {...props}>
    {children}
  </div>
)
