import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ProjectSummary, Project, Cost } from '@/types'

// tailwindクラス結合ユーティリティ（shadcn方式）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 金額を日本円フォーマットで表示
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`
}

// 利益率をフォーマット
export const formatRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`
}

// 予測完工利益を計算
export const calculateProjectSummary = (
  project: Project,
  costs: Cost[]
): ProjectSummary => {
  // カテゴリ別実績原価を集計
  const costByCategory = {
    labor: 0,
    material: 0,
    outsource: 0,
    expense: 0,
  }
  costs.forEach((cost) => {
    costByCategory[cost.category] += cost.amount
  })

  const totalActualCost =
    costByCategory.labor +
    costByCategory.material +
    costByCategory.outsource +
    costByCategory.expense

  const totalBudget =
    project.budget_labor +
    project.budget_material +
    project.budget_outsource +
    project.budget_expense

  // 工期進捗率を計算（日付ベース）
  let progressRate = 0
  if (project.start_date && project.end_date) {
    const start = new Date(project.start_date).getTime()
    const end = new Date(project.end_date).getTime()
    const now = Date.now()
    const total = end - start
    const elapsed = Math.max(0, Math.min(now - start, total))
    progressRate = total > 0 ? elapsed / total : 0
  }

  // 予測残原価 = (予算 - 実績) × (1 - 進捗率) × 1.1（10%バッファ）
  const remainingBudget = Math.max(0, totalBudget - totalActualCost)
  const estimatedRemainingCost = remainingBudget * (1 - progressRate) * 1.1

  const estimatedProfit =
    project.contract_amount - totalActualCost - estimatedRemainingCost
  const estimatedProfitRate =
    project.contract_amount > 0
      ? (estimatedProfit / project.contract_amount) * 100
      : 0

  return {
    ...project,
    total_actual_cost: totalActualCost,
    estimated_profit: Math.round(estimatedProfit),
    estimated_profit_rate: estimatedProfitRate,
    progress_rate: progressRate,
    cost_by_category: costByCategory,
  }
}

// 利益率に応じたカラークラスを返す
export const getProfitRateColorClass = (rate: number): string => {
  if (rate >= 20) return 'text-success'
  if (rate >= 10) return 'text-warning'
  return 'text-danger'
}

// 利益率に応じたステータスラベルを返す
export const getProfitRateStatus = (
  rate: number
): { label: string; variant: 'danger' | 'warning' | 'success' } => {
  if (rate < 10) return { label: '⚠ 要確認', variant: 'danger' }
  if (rate < 15) return { label: '△ 注意', variant: 'warning' }
  return { label: '● 順調', variant: 'success' }
}

// 工事ステータスのラベル・バッジvariantを返す
export const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'blue' | 'success' | 'warning' | 'gray' }
> = {
  active:    { label: '進行中', variant: 'blue' },
  completed: { label: '完工',   variant: 'success' },
  invoiced:  { label: '請求済み', variant: 'warning' },
  paid:      { label: '入金済み', variant: 'gray' },
}

// カテゴリの日本語ラベル
export const CATEGORY_LABELS: Record<string, string> = {
  labor: '労務費',
  material: '材料費',
  outsource: '外注費',
  expense: '経費',
}

// カテゴリのカラー
export const CATEGORY_COLORS: Record<string, string> = {
  labor: '#3B82F6',
  material: '#F59E0B',
  outsource: '#8B5CF6',
  expense: '#10B981',
}

// カテゴリの絵文字
export const CATEGORY_ICONS: Record<string, string> = {
  labor: '👷',
  material: '🧱',
  outsource: '🔧',
  expense: '📋',
}
