import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

// スケルトンローディングコンポーネント
export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'bg-[#222639] rounded-lg animate-pulse',
        className
      )}
    />
  )
}

// ダッシュボードカードのスケルトン
export const CardSkeleton = () => (
  <div className="bg-[#1A1D26] border border-[#2E3347] rounded-xl p-5">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-32" />
  </div>
)

// テーブル行のスケルトン
export const TableRowSkeleton = () => (
  <tr>
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
)
