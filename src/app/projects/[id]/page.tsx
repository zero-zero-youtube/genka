'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, FileText } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import BudgetVsActualChart from '@/components/charts/BudgetVsActualChart'
import { supabase } from '@/lib/supabase'
import { Project, Cost, ProjectSummary, CostCategory } from '@/types'
import {
  formatCurrency,
  formatRate,
  calculateProjectSummary,
  getProfitRateStatus,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from '@/lib/utils'

const CATEGORIES: CostCategory[] = ['labor', 'material', 'outsource', 'expense']

// 原価入力フォームコンポーネント
const CostInputForm = ({
  projectId,
  onAdded,
}: {
  projectId: string
  onAdded: () => void
}) => {
  const [category, setCategory] = useState<CostCategory>('labor')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = async () => {
    if (!amount || parseInt(amount) <= 0) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('costs').insert({
        project_id: projectId,
        category,
        amount: parseInt(amount),
        description: description.trim() || null,
        cost_date: date,
        created_by: user?.id,
      })
      if (error) throw error

      setToast({
        message: `${formatCurrency(parseInt(amount))} を${CATEGORY_LABELS[category]}として記録しました`,
        type: 'success',
      })
      setAmount('')
      setDescription('')
      onAdded()
    } catch (err) {
      setToast({ message: 'エラーが発生しました', type: 'error' })
      console.error('原価登録エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="text-[#F0F2F8] font-bold mb-4">原価を入力する</h3>

      {/* カテゴリ選択 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`py-3 px-3 rounded-lg text-sm font-medium transition-all min-h-[48px] ${
              category === cat
                ? 'border-2 text-[#F0F2F8]'
                : 'border border-[#2E3347] text-[#8B92A9] hover:text-[#F0F2F8] hover:bg-[#222639]'
            }`}
            style={
              category === cat
                ? {
                    borderColor: CATEGORY_COLORS[cat],
                    backgroundColor: `${CATEGORY_COLORS[cat]}15`,
                    color: CATEGORY_COLORS[cat],
                  }
                : {}
            }
          >
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 金額入力 */}
      <div className="mb-3">
        <label className="block text-sm text-[#8B92A9] mb-1.5 font-medium">金額</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-[#8B92A9] font-mono select-none">¥</span>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#222639] border border-[#2E3347] rounded-lg text-[#F0F2F8] pl-8 pr-12 py-3 font-mono text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 min-h-[48px]"
          />
          <span className="absolute right-3 text-[#8B92A9] select-none text-sm">円</span>
        </div>

        {/* テンキーボタン（スマホ操作向け） */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {['1万', '5万', '10万', '50万'].map((label) => {
            const val = label === '1万' ? 10000 : label === '5万' ? 50000 : label === '10万' ? 100000 : 500000
            return (
              <button
                key={label}
                onClick={() => setAmount(String((parseInt(amount) || 0) + val))}
                className="py-2 bg-[#222639] border border-[#2E3347] rounded text-xs text-[#8B92A9] hover:text-[#F0F2F8] hover:bg-[#2E3347] transition-colors"
              >
                +{label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 摘要 */}
      <div className="mb-3">
        <label className="block text-sm text-[#8B92A9] mb-1.5 font-medium">摘要（任意）</label>
        <input
          type="text"
          placeholder="内容を入力..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-[#222639] border border-[#2E3347] rounded-lg text-[#F0F2F8] px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 min-h-[48px]"
        />
      </div>

      {/* 日付 */}
      <div className="mb-4">
        <label className="block text-sm text-[#8B92A9] mb-1.5 font-medium">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-[#222639] border border-[#2E3347] rounded-lg text-[#F0F2F8] px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 min-h-[48px]"
        />
      </div>

      <Button
        onClick={handleSubmit}
        variant="primary"
        loading={loading}
        disabled={!amount || parseInt(amount) <= 0}
        className="w-full"
      >
        入力する
      </Button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Card>
  )
}

// 工事詳細ページ
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProject = useCallback(async () => {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('工事取得エラー:', projectError)
      router.push('/dashboard')
      return
    }

    const { data: costsData, error: costsError } = await supabase
      .from('costs')
      .select('*')
      .eq('project_id', projectId)
      .order('cost_date', { ascending: false })

    if (costsError) {
      console.error('原価取得エラー:', costsError)
    }

    const projectCosts = costsData ?? []
    setCosts(projectCosts)
    setProject(calculateProjectSummary(projectData as Project, projectCosts as Cost[]))
    setLoading(false)
  }, [projectId, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleDeleteCost = async (costId: string) => {
    if (!confirm('この原価を削除しますか？')) return

    const { error } = await supabase.from('costs').delete().eq('id', costId)
    if (error) {
      console.error('原価削除エラー:', error)
      return
    }
    fetchProject()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-[#8B92A9]">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>読み込み中...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) return null

  const profitStatus = getProfitRateStatus(project.estimated_profit_rate)

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#F0F2F8]">{project.name}</h1>
              {project.client_name && (
                <p className="text-[#8B92A9] text-sm mt-0.5">{project.client_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={profitStatus.variant} pulse={profitStatus.variant === 'danger'}>
              {profitStatus.label}
            </Badge>
            <Link href={`/projects/${projectId}/report`}>
              <Button variant="secondary" size="sm">
                <FileText className="w-4 h-4" />
                完工レポート
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* 左カラム：原価サマリー */}
          <div className="lg:col-span-3 space-y-6">
            {/* 予測完工利益 */}
            <Card danger={project.estimated_profit_rate < 10}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#8B92A9] text-sm font-medium">予測完工利益</span>
                <span className="text-[#8B92A9] text-xs">
                  契約金額 {formatCurrency(project.contract_amount)}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span
                  className={`font-mono text-4xl font-bold ${
                    project.estimated_profit_rate >= 20
                      ? 'text-success'
                      : project.estimated_profit_rate >= 10
                      ? 'text-warning'
                      : 'text-danger'
                  }`}
                >
                  {formatCurrency(project.estimated_profit)}
                </span>
                <span
                  className={`font-mono text-xl ${
                    project.estimated_profit_rate >= 20
                      ? 'text-success'
                      : project.estimated_profit_rate >= 10
                      ? 'text-warning'
                      : 'text-danger'
                  }`}
                >
                  ({formatRate(project.estimated_profit_rate)})
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-[#8B92A9]">
                <span>実績原価: {formatCurrency(project.total_actual_cost)}</span>
                <span>工期進捗: {Math.round(project.progress_rate * 100)}%</span>
              </div>
            </Card>

            {/* 予算vs実績グラフ */}
            <Card>
              <h3 className="text-[#8B92A9] text-sm font-bold uppercase tracking-wider mb-4">
                予算 vs 実績
              </h3>
              <BudgetVsActualChart project={project} />
            </Card>

            {/* カテゴリ別サマリー */}
            <Card>
              <h3 className="text-[#8B92A9] text-sm font-bold uppercase tracking-wider mb-4">
                カテゴリ別内訳
              </h3>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const budget =
                    cat === 'labor'
                      ? project.budget_labor
                      : cat === 'material'
                      ? project.budget_material
                      : cat === 'outsource'
                      ? project.budget_outsource
                      : project.budget_expense
                  const actual = project.cost_by_category[cat]
                  const pct = budget > 0 ? (actual / budget) * 100 : 0

                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#8B92A9]">
                          {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-mono text-[#F0F2F8]">{formatCurrency(actual)}</span>
                          <span className="text-[#8B92A9]">/ {formatCurrency(budget)}</span>
                          <span
                            className={`font-mono w-12 text-right ${
                              pct > 100 ? 'text-danger' : pct > 80 ? 'text-warning' : 'text-success'
                            }`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#222639] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: CATEGORY_COLORS[cat],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* 右カラム：原価入力 */}
          <div className="lg:col-span-2 space-y-6">
            <CostInputForm projectId={projectId} onAdded={fetchProject} />

            {/* 原価履歴 */}
            <Card>
              <h3 className="text-[#8B92A9] text-sm font-bold uppercase tracking-wider mb-4">
                原価履歴
              </h3>
              {costs.length === 0 ? (
                <p className="text-[#8B92A9] text-sm text-center py-4">
                  まだ原価が入力されていません
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {costs.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center justify-between py-2 border-b border-[#2E3347] last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[cost.category]}</span>
                        <div className="min-w-0">
                          <p className="text-xs text-[#8B92A9]">{cost.cost_date}</p>
                          {cost.description && (
                            <p className="text-xs text-[#F0F2F8] truncate">{cost.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-sm text-[#F0F2F8]">
                          {formatCurrency(cost.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="text-[#8B92A9] hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
