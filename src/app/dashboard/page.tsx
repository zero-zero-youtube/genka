'use client'

// Supabaseを使うため動的レンダリングに設定
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Download } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Project, Cost, ProjectSummary } from '@/types'
import {
  formatCurrency,
  formatRate,
  calculateProjectSummary,
  getProfitRateStatus,
} from '@/lib/utils'

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 自社の工事一覧を取得
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('工事取得エラー:', projectsError)
        setLoading(false)
        return
      }

      // 全工事の原価を一括取得
      const projectIds = projectsData.map((p: Project) => p.id)
      const { data: costsData, error: costsError } = await supabase
        .from('costs')
        .select('*')
        .in('project_id', projectIds)

      if (costsError) {
        console.error('原価取得エラー:', costsError)
      }

      // 工事ごとにサマリーを計算
      const summaries = projectsData.map((project: Project) => {
        const projectCosts = (costsData ?? []).filter(
          (c: Cost) => c.project_id === project.id
        )
        return calculateProjectSummary(project, projectCosts)
      })

      setProjects(summaries)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleCsvDownload = () => {
    const STATUS_LABELS: Record<string, string> = {
      active: '進行中',
      completed: '完了',
      cancelled: 'キャンセル',
    }
    const header = ['工事名', '発注元', '契約金額', '実績原価', '予測利益', '予測利益率', 'ステータス']
    const rows = projects.map((p) => [
      p.name,
      p.client_name ?? '',
      p.contract_amount,
      p.total_actual_cost,
      p.estimated_profit,
      `${p.estimated_profit_rate.toFixed(1)}%`,
      STATUS_LABELS[p.status] ?? p.status,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `genka_projects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // アクティブな工事のみ
  const activeProjects = projects.filter((p) => p.status === 'active')

  // サマリー集計
  const totalContractAmount = activeProjects.reduce(
    (sum, p) => sum + p.contract_amount,
    0
  )
  const totalActualCost = activeProjects.reduce(
    (sum, p) => sum + p.total_actual_cost,
    0
  )
  const avgProfitRate =
    activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + p.estimated_profit_rate, 0) /
        activeProjects.length
      : 0

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* ページヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F8]">ダッシュボード</h1>
            <p className="text-[#8B92A9] text-sm mt-1">進行中の工事を管理しています</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCsvDownload} disabled={loading || projects.length === 0}>
              <Download className="w-4 h-4" />
              CSVダウンロード
            </Button>
            <Link href="/projects/new">
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                新規工事登録
              </Button>
            </Link>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>進行中の工事</CardTitle>
                </CardHeader>
                <CardValue>{activeProjects.length}<span className="text-lg text-[#8B92A9] ml-1">件</span></CardValue>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>総契約金額</CardTitle>
                </CardHeader>
                <CardValue className="text-xl lg:text-2xl">{formatCurrency(totalContractAmount)}</CardValue>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>総実績原価</CardTitle>
                </CardHeader>
                <CardValue className="text-xl lg:text-2xl">{formatCurrency(totalActualCost)}</CardValue>
              </Card>

              <Card danger={avgProfitRate < 10}>
                <CardHeader>
                  <CardTitle>予測粗利益率（平均）</CardTitle>
                </CardHeader>
                <div className="flex items-end gap-2 mt-1">
                  <span
                    className={`font-mono text-3xl font-semibold ${
                      avgProfitRate >= 20
                        ? 'text-success'
                        : avgProfitRate >= 10
                        ? 'text-warning'
                        : 'text-danger'
                    }`}
                  >
                    {formatRate(avgProfitRate)}
                  </span>
                  {avgProfitRate >= 15 ? (
                    <TrendingUp className="w-5 h-5 text-success mb-1" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-danger mb-1" />
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* 工事一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>工事一覧</CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E3347]">
                  {['工事名', '発注元', '契約金額', '実績原価', '予測利益率', '進捗', 'ステータス', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[#8B92A9] font-medium text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#8B92A9]">
                      <p className="mb-3">工事がまだ登録されていません</p>
                      <Link href="/projects/new">
                        <Button variant="secondary" size="sm">
                          <Plus className="w-4 h-4" />
                          最初の工事を登録する
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => {
                    const status = getProfitRateStatus(project.estimated_profit_rate)
                    return (
                      <tr
                        key={project.id}
                        className="border-b border-[#2E3347] last:border-0 hover:bg-[#222639]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#F0F2F8]">{project.name}</span>
                        </td>
                        <td className="px-4 py-3 text-[#8B92A9]">{project.client_name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-[#F0F2F8]">
                          {formatCurrency(project.contract_amount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#F0F2F8]">
                          {formatCurrency(project.total_actual_cost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-semibold ${
                              project.estimated_profit_rate >= 20
                                ? 'text-success'
                                : project.estimated_profit_rate >= 10
                                ? 'text-warning'
                                : 'text-danger'
                            }`}
                          >
                            {formatRate(project.estimated_profit_rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#222639] rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-amber-500"
                                style={{ width: `${Math.min(100, project.progress_rate * 100)}%` }}
                              />
                            </div>
                            <span className="text-[#8B92A9] text-xs w-8 text-right">
                              {Math.round(project.progress_rate * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={status.variant}
                            pulse={status.variant === 'danger'}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="ghost" size="sm">
                              詳細 →
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
