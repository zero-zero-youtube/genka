'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Brain, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Project, Cost, ProjectSummary } from '@/types'
import {
  formatCurrency,
  formatRate,
  calculateProjectSummary,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/utils'

// 完工レポートページ
export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiComment, setAiComment] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

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

    const { data: costsData } = await supabase
      .from('costs')
      .select('*')
      .eq('project_id', projectId)

    const projectCosts = costsData ?? []
    setProject(calculateProjectSummary(projectData as Project, projectCosts as Cost[]))
    setLoading(false)
  }, [projectId, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // AI所見を生成
  const generateAiComment = async () => {
    if (!project) return
    setAiLoading(true)
    setAiComment('')

    try {
      // 予算超過カテゴリを特定
      const overBudgetCategories = []
      if (project.cost_by_category.labor > project.budget_labor) overBudgetCategories.push('労務費')
      if (project.cost_by_category.material > project.budget_material) overBudgetCategories.push('材料費')
      if (project.cost_by_category.outsource > project.budget_outsource) overBudgetCategories.push('外注費')
      if (project.cost_by_category.expense > project.budget_expense) overBudgetCategories.push('経費')

      const prompt = `以下の工事原価データを分析し、経営者向けに3点の所見と1点の改善提案を簡潔に日本語で記述してください。
工事名：${project.name}
契約金額：${formatCurrency(project.contract_amount)}
実績原価：${formatCurrency(project.total_actual_cost)}
予測利益率：${formatRate(project.estimated_profit_rate)}
予算超過カテゴリ：${overBudgetCategories.length > 0 ? overBudgetCategories.join('、') : 'なし'}
所見は箇条書きで、改善提案は1段落で。`

      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error('AI分析に失敗しました')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAiComment(text)
      }
    } catch (err) {
      console.error('AI分析エラー:', err)
      setAiComment('AI分析の生成中にエラーが発生しました。APIキーの設定をご確認ください。')
    } finally {
      setAiLoading(false)
    }
  }

  // PDF印刷
  const handlePrint = () => {
    window.print()
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

  const totalBudget =
    project.budget_labor +
    project.budget_material +
    project.budget_outsource +
    project.budget_expense

  const categories = [
    {
      key: 'labor' as const,
      budget: project.budget_labor,
      actual: project.cost_by_category.labor,
    },
    {
      key: 'material' as const,
      budget: project.budget_material,
      actual: project.cost_by_category.material,
    },
    {
      key: 'outsource' as const,
      budget: project.budget_outsource,
      actual: project.cost_by_category.outsource,
    },
    {
      key: 'expense' as const,
      budget: project.budget_expense,
      actual: project.cost_by_category.expense,
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* ヘッダー（印刷時非表示） */}
        <div className="print:hidden flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#F0F2F8]">完工レポート</h1>
          </div>
          <Button onClick={handlePrint} variant="secondary">
            <Download className="w-4 h-4" />
            PDF出力
          </Button>
        </div>

        {/* レポート本体 */}
        <div className="space-y-6">
          {/* レポートヘッダー */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#F0F2F8]">{project.name}</h2>
                {project.client_name && (
                  <p className="text-[#8B92A9] mt-1">発注元：{project.client_name}</p>
                )}
                {project.end_date && (
                  <p className="text-[#8B92A9] text-sm mt-1">完工予定日：{project.end_date}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[#8B92A9] text-xs">工事原価管理システム</p>
                <p className="text-amber-400 font-bold text-lg">GenKa</p>
              </div>
            </div>
          </Card>

          {/* サマリーカード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-[#8B92A9] text-xs font-bold uppercase tracking-wider mb-2">契約金額</p>
              <p className="font-mono text-xl font-semibold text-[#F0F2F8]">
                {formatCurrency(project.contract_amount)}
              </p>
            </Card>
            <Card>
              <p className="text-[#8B92A9] text-xs font-bold uppercase tracking-wider mb-2">実績原価</p>
              <p className="font-mono text-xl font-semibold text-[#F0F2F8]">
                {formatCurrency(project.total_actual_cost)}
              </p>
            </Card>
            <Card>
              <p className="text-[#8B92A9] text-xs font-bold uppercase tracking-wider mb-2">予測利益</p>
              <p
                className={`font-mono text-xl font-semibold ${
                  project.estimated_profit >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {formatCurrency(project.estimated_profit)}
              </p>
            </Card>
            <Card>
              <p className="text-[#8B92A9] text-xs font-bold uppercase tracking-wider mb-2">利益率</p>
              <p
                className={`font-mono text-2xl font-bold ${
                  project.estimated_profit_rate >= 20
                    ? 'text-success'
                    : project.estimated_profit_rate >= 10
                    ? 'text-warning'
                    : 'text-danger'
                }`}
              >
                {formatRate(project.estimated_profit_rate)}
              </p>
            </Card>
          </div>

          {/* 原価内訳テーブル */}
          <Card>
            <h3 className="text-[#8B92A9] text-sm font-bold uppercase tracking-wider mb-4">
              原価内訳
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2E3347]">
                    {['カテゴリ', '予算', '実績', '差異', '達成率'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-[#8B92A9] font-medium text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(({ key, budget, actual }) => {
                    const diff = budget - actual
                    const rate = budget > 0 ? (actual / budget) * 100 : 0
                    return (
                      <tr key={key} className="border-b border-[#2E3347] last:border-0">
                        <td className="px-3 py-2.5 text-[#F0F2F8]">
                          {CATEGORY_ICONS[key]} {CATEGORY_LABELS[key]}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[#F0F2F8]">
                          {formatCurrency(budget)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[#F0F2F8]">
                          {formatCurrency(actual)}
                        </td>
                        <td
                          className={`px-3 py-2.5 font-mono ${
                            diff >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </td>
                        <td
                          className={`px-3 py-2.5 font-mono ${
                            rate > 100 ? 'text-danger' : rate > 80 ? 'text-warning' : 'text-success'
                          }`}
                        >
                          {rate.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                  {/* 合計行 */}
                  <tr className="border-t-2 border-[#2E3347] bg-[#222639]">
                    <td className="px-3 py-2.5 font-bold text-[#F0F2F8]">合計</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#F0F2F8]">
                      {formatCurrency(totalBudget)}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#F0F2F8]">
                      {formatCurrency(project.total_actual_cost)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-mono font-bold ${
                        totalBudget - project.total_actual_cost >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {totalBudget - project.total_actual_cost >= 0 ? '+' : ''}
                      {formatCurrency(totalBudget - project.total_actual_cost)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-mono font-bold ${
                        totalBudget > 0 && project.total_actual_cost / totalBudget > 1
                          ? 'text-danger'
                          : 'text-success'
                      }`}
                    >
                      {totalBudget > 0
                        ? ((project.total_actual_cost / totalBudget) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI所見セクション */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-400" />
                <h3 className="text-[#F0F2F8] font-bold">AI分析レポート</h3>
              </div>
              <Button
                onClick={generateAiComment}
                variant="secondary"
                size="sm"
                loading={aiLoading}
                className="print:hidden"
              >
                <RefreshCw className="w-4 h-4" />
                {aiComment ? '再生成' : '生成する'}
              </Button>
            </div>

            {aiLoading && !aiComment && (
              <div className="flex items-center gap-2 text-[#8B92A9] text-sm py-4">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                AI分析中...
              </div>
            )}

            {aiComment ? (
              <div className="prose prose-invert max-w-none">
                <div className="text-[#F0F2F8] text-sm leading-relaxed whitespace-pre-wrap">
                  {aiComment}
                </div>
              </div>
            ) : !aiLoading ? (
              <div className="text-center py-6">
                <p className="text-[#8B92A9] text-sm mb-3">
                  AIが工事データを分析し、経営者向けの所見と改善提案を生成します
                </p>
                <Button onClick={generateAiComment} variant="primary" size="sm">
                  <Brain className="w-4 h-4" />
                  AI分析を開始
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
