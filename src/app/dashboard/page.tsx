'use client'

// Supabaseを使うため動的レンダリングに設定
export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Download, Search, X } from 'lucide-react'
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
  PROJECT_STATUS_CONFIG,
} from '@/lib/utils'
import { ProjectStatus } from '@/types'

type StatusFilter = 'all' | 'active' | 'completed' | 'invoiced' | 'paid'
type PeriodFilter = 'all' | 'month' | 'quarter' | 'year'

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')

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

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId)
    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      )
    }
  }

  const handleCsvDownload = () => {
    const STATUS_LABELS: Record<string, string> = {
      active: '進行中',
      completed: '完工',
      invoiced: '請求済み',
      paid: '入金済み',
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

  // フィルタリング
  const filteredProjects = useMemo(() => {
    const now = new Date()
    const startOf = (unit: 'month' | 'quarter' | 'year'): Date => {
      const d = new Date(now.getFullYear(), 0, 1)
      if (unit === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
      if (unit === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      return d
    }

    return projects.filter((p) => {
      // テキスト検索
      if (searchText.trim()) {
        const q = searchText.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchClient = (p.client_name ?? '').toLowerCase().includes(q)
        if (!matchName && !matchClient) return false
      }
      // ステータスフィルター
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      // 期間フィルター（created_atで判定）
      if (periodFilter !== 'all') {
        const created = new Date(p.created_at)
        if (created < startOf(periodFilter)) return false
      }
      return true
    })
  }, [projects, searchText, statusFilter, periodFilter])

  const hasFilter = searchText.trim() !== '' || statusFilter !== 'all' || periodFilter !== 'all'

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

        {/* 検索・フィルターUI */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* テキスト検索 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B92A9]" />
            <input
              type="text"
              placeholder="工事名・発注元で検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2E3347] rounded-lg text-[#F0F2F8] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 placeholder:text-[#4B5270]"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B92A9] hover:text-[#F0F2F8]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ステータスフィルター */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#1A1D26] border border-[#2E3347] text-[#8B92A9] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">全ステータス</option>
            <option value="active">進行中</option>
            <option value="completed">完工</option>
            <option value="invoiced">請求済み</option>
            <option value="paid">入金済み</option>
          </select>

          {/* 期間フィルター */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="bg-[#1A1D26] border border-[#2E3347] text-[#8B92A9] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">全期間</option>
            <option value="month">今月</option>
            <option value="quarter">今四半期</option>
            <option value="year">今年</option>
          </select>

          {/* リセット */}
          {hasFilter && (
            <button
              onClick={() => { setSearchText(''); setStatusFilter('all'); setPeriodFilter('all') }}
              className="text-[#8B92A9] hover:text-amber-400 text-sm flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              リセット
            </button>
          )}
        </div>

        {/* 工事一覧テーブル */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>工事一覧</CardTitle>
              {hasFilter && !loading && (
                <span className="text-[#8B92A9] text-xs">{filteredProjects.length} 件表示</span>
              )}
            </div>
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
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#8B92A9]">
                      <p>条件に一致する工事がありません</p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const statusConfig = PROJECT_STATUS_CONFIG[project.status] ?? PROJECT_STATUS_CONFIG['active']
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
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                            <select
                              value={project.status}
                              onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
                              className="bg-[#222639] border border-[#2E3347] text-[#8B92A9] text-xs rounded-md px-1.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="active">進行中</option>
                              <option value="completed">完工</option>
                              <option value="invoiced">請求済み</option>
                              <option value="paid">入金済み</option>
                            </select>
                          </div>
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
