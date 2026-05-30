'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { Estimate } from '@/types'
import { formatCurrency, formatRate, ESTIMATE_STATUS_CONFIG } from '@/lib/utils'

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('estimates')
          .select('*')
          .order('created_at', { ascending: false })
        setEstimates(data ?? [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalCost = (e: Estimate) =>
    e.cost_labor + e.cost_material + e.cost_outsource + e.cost_expense

  const profitRate = (e: Estimate) =>
    e.contract_amount > 0
      ? ((e.contract_amount - totalCost(e)) / e.contract_amount) * 100
      : 0

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F8]">見積もり</h1>
            <p className="text-[#8B92A9] text-sm mt-1">受注前の利益試算を管理します</p>
          </div>
          <Link href="/estimates/new">
            <Button variant="primary">
              <Plus className="w-4 h-4" />
              新規見積もり
            </Button>
          </Link>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E3347]">
                  {['案件名', '発注元', '契約金額', '想定原価', '想定利益率', 'ステータス', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[#8B92A9] font-medium text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : estimates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#8B92A9]">
                      <p className="mb-3">見積もりがまだありません</p>
                      <Link href="/estimates/new">
                        <Button variant="secondary" size="sm">
                          <Plus className="w-4 h-4" />
                          最初の見積もりを作成する
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  estimates.map((est) => {
                    const rate = profitRate(est)
                    const cost = totalCost(est)
                    const statusConfig = ESTIMATE_STATUS_CONFIG[est.status] ?? ESTIMATE_STATUS_CONFIG['draft']
                    return (
                      <tr
                        key={est.id}
                        className="border-b border-[#2E3347] last:border-0 hover:bg-[#222639]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#F0F2F8]">{est.name}</span>
                          {est.converted_project_id && (
                            <span className="ml-2 text-xs text-success">→ 工事化済み</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#8B92A9]">{est.client_name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-[#F0F2F8]">
                          {formatCurrency(est.contract_amount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#F0F2F8]">
                          {formatCurrency(cost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-semibold ${
                              rate >= 20 ? 'text-success' : rate >= 10 ? 'text-warning' : 'text-danger'
                            }`}
                          >
                            {formatRate(rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/estimates/${est.id}`}>
                            <Button variant="ghost" size="sm">詳細 →</Button>
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
