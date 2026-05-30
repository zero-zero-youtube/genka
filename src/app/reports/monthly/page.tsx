'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { Project, Cost, ProjectSummary } from '@/types'
import {
  formatCurrency,
  formatRate,
  calculateProjectSummary,
  PROJECT_STATUS_CONFIG,
} from '@/lib/utils'

export default function MonthlyReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)

  // 月移動
  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  // 対象月の start/end
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0) // 月末日
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }, [year, month])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // その月に作成された工事 or 工期が重なる工事を取得
        // シンプルにcreated_atで絞る（+進行中は全件含める）
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .or(
            `and(created_at.gte.${startDate}T00:00:00,created_at.lte.${endDate}T23:59:59),` +
            `and(start_date.lte.${endDate},end_date.gte.${startDate})`
          )
          .order('created_at', { ascending: false })

        if (error || !projectsData) { setProjects([]); return }

        const projectIds = projectsData.map((p: Project) => p.id)
        if (projectIds.length === 0) { setProjects([]); return }

        const { data: costsData } = await supabase
          .from('costs')
          .select('*')
          .in('project_id', projectIds)

        const summaries = projectsData.map((p: Project) =>
          calculateProjectSummary(
            p,
            (costsData ?? []).filter((c: Cost) => c.project_id === p.id)
          )
        )
        setProjects(summaries)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [startDate, endDate])

  // 集計
  const summary = useMemo(() => {
    const totalContract = projects.reduce((s, p) => s + p.contract_amount, 0)
    const totalCost = projects.reduce((s, p) => s + p.total_actual_cost, 0)
    const totalProfit = projects.reduce((s, p) => s + p.estimated_profit, 0)
    const avgProfitRate = projects.length > 0
      ? projects.reduce((s, p) => s + p.estimated_profit_rate, 0) / projects.length
      : 0
    return { totalContract, totalCost, totalProfit, avgProfitRate }
  }, [projects])

  const profitColor = (rate: number) =>
    rate >= 20 ? 'text-success' : rate >= 10 ? 'text-warning' : 'text-danger'
  const profitPrintColor = (rate: number) =>
    rate >= 20 ? 'print-success' : rate >= 10 ? 'print-warning' : 'print-danger'

  const reportTitle = `${year}年${month}月 月次レポート`

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto print-page">

        {/* 操作ヘッダー（印刷時非表示） */}
        <div className="print:hidden flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#F0F2F8]">月次レポート</h1>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            印刷 / PDF保存
          </Button>
        </div>

        {/* 月選択（印刷時非表示） */}
        <div className="print:hidden flex items-center gap-4 mb-8">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-[#1A1D26] border border-[#2E3347] text-[#8B92A9] hover:text-[#F0F2F8] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-[#1A1D26] border border-[#2E3347] text-[#F0F2F8] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-[#1A1D26] border border-[#2E3347] text-[#F0F2F8] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg bg-[#1A1D26] border border-[#2E3347] text-[#8B92A9] hover:text-[#F0F2F8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {isCurrentMonth && (
            <span className="text-amber-400 text-sm font-medium">今月</span>
          )}
        </div>

        {/* レポート本体 */}
        <div className="space-y-6">

          {/* レポートタイトル（印刷時表示） */}
          <div className="hidden print:flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{reportTitle}</h1>
            <p className="text-amber-600 font-bold text-lg">GenKa</p>
          </div>

          {/* タイトル見出し（画面表示） */}
          <div className="print:hidden">
            <h2 className="text-xl font-bold text-[#F0F2F8]">{reportTitle}</h2>
            <p className="text-[#8B92A9] text-sm mt-1">
              対象期間: {startDate} 〜 {endDate}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#8B92A9]">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
              読み込み中...
            </div>
          ) : (
            <>
              {/* サマリーカード */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print-card">
                {[
                  { label: '工事件数', value: `${projects.length}件`, color: 'text-[#F0F2F8] print-value' },
                  { label: '総契約金額', value: formatCurrency(summary.totalContract), color: 'text-[#F0F2F8] print-value' },
                  { label: '総実績原価', value: formatCurrency(summary.totalCost), color: 'text-[#F0F2F8] print-value' },
                  {
                    label: '総利益（予測）',
                    value: formatCurrency(summary.totalProfit),
                    color: `${summary.totalProfit >= 0 ? 'text-success' : 'text-danger'} ${summary.totalProfit >= 0 ? 'print-success' : 'print-danger'}`,
                  },
                  {
                    label: '平均利益率',
                    value: formatRate(summary.avgProfitRate),
                    color: `${profitColor(summary.avgProfitRate)} ${profitPrintColor(summary.avgProfitRate)}`,
                  },
                ].map((item) => (
                  <Card key={item.label}>
                    <p className="text-[#8B92A9] print-label text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`font-mono text-xl font-bold ${item.color}`}>{item.value}</p>
                  </Card>
                ))}
              </div>

              {/* 工事一覧テーブル */}
              {projects.length === 0 ? (
                <Card>
                  <p className="text-center text-[#8B92A9] py-10">
                    {reportTitle}の対象工事はありません
                  </p>
                </Card>
              ) : (
                <Card className="print-card">
                  <h3 className="text-[#F0F2F8] print-value font-bold mb-4">工事一覧</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2E3347]">
                          {['工事名', '発注元', '契約金額', '実績原価', '予測利益', '利益率', 'ステータス'].map((h) => (
                            <th
                              key={h}
                              className="text-left px-3 py-2.5 text-[#8B92A9] print-label text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => {
                          const rate = p.estimated_profit_rate
                          const statusConfig = PROJECT_STATUS_CONFIG[p.status] ?? PROJECT_STATUS_CONFIG['active']
                          return (
                            <tr key={p.id} className="border-b border-[#2E3347] last:border-0">
                              <td className="px-3 py-2.5 font-medium text-[#F0F2F8] print-value">{p.name}</td>
                              <td className="px-3 py-2.5 text-[#8B92A9] print-label">{p.client_name ?? '—'}</td>
                              <td className="px-3 py-2.5 font-mono text-[#F0F2F8] print-value">{formatCurrency(p.contract_amount)}</td>
                              <td className="px-3 py-2.5 font-mono text-[#F0F2F8] print-value">{formatCurrency(p.total_actual_cost)}</td>
                              <td className={`px-3 py-2.5 font-mono ${p.estimated_profit >= 0 ? 'text-success print-success' : 'text-danger print-danger'}`}>
                                {formatCurrency(p.estimated_profit)}
                              </td>
                              <td className={`px-3 py-2.5 font-mono font-semibold ${profitColor(rate)} ${profitPrintColor(rate)}`}>
                                {formatRate(rate)}
                              </td>
                              <td className="px-3 py-2.5">
                                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {/* 合計行 */}
                      <tfoot>
                        <tr className="border-t-2 border-[#2E3347] bg-[#222639]">
                          <td className="px-3 py-2.5 font-bold text-[#F0F2F8] print-value" colSpan={2}>合計</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#F0F2F8] print-value">{formatCurrency(summary.totalContract)}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#F0F2F8] print-value">{formatCurrency(summary.totalCost)}</td>
                          <td className={`px-3 py-2.5 font-mono font-bold ${summary.totalProfit >= 0 ? 'text-success print-success' : 'text-danger print-danger'}`}>
                            {formatCurrency(summary.totalProfit)}
                          </td>
                          <td className={`px-3 py-2.5 font-mono font-bold ${profitColor(summary.avgProfitRate)} ${profitPrintColor(summary.avgProfitRate)}`}>
                            {formatRate(summary.avgProfitRate)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              )}

              {/* 印刷フッター */}
              <div className="hidden print:block text-right text-gray-400 text-xs mt-8">
                出力日: {new Date().toLocaleDateString('ja-JP')} — GenKa 工事原価管理システム
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
