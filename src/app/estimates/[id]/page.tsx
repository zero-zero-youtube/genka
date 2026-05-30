'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Estimate, EstimateStatus } from '@/types'
import { formatCurrency, formatRate, ESTIMATE_STATUS_CONFIG, CATEGORY_LABELS } from '@/lib/utils'

export default function EstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('estimates')
          .select('*')
          .eq('id', id)
          .single()
        if (error || !data) { router.push('/estimates'); return }
        setEstimate(data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, router])

  const handleStatusChange = async (newStatus: EstimateStatus) => {
    if (!estimate) return
    const { error } = await supabase
      .from('estimates')
      .update({ status: newStatus })
      .eq('id', id)
    if (!error) setEstimate((prev) => prev ? { ...prev, status: newStatus } : prev)
  }

  // 工事に変換
  const handleConvertToProject = async () => {
    if (!estimate) return
    setConverting(true)
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          company_id: estimate.company_id,
          name: estimate.name,
          client_name: estimate.client_name,
          contract_amount: estimate.contract_amount,
          budget_labor: estimate.cost_labor,
          budget_material: estimate.cost_material,
          budget_outsource: estimate.cost_outsource,
          budget_expense: estimate.cost_expense,
          status: 'active',
        })
        .select()
        .single()
      if (error) throw error

      // 見積もりのステータスを「受注」に更新し、工事IDを紐付け
      await supabase
        .from('estimates')
        .update({ status: 'ordered', converted_project_id: project.id })
        .eq('id', id)

      setToast({ message: '工事を作成しました。工事ページに移動します...', type: 'success' })
      setTimeout(() => router.push(`/projects/${project.id}`), 1500)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'エラーが発生しました'
      setToast({ message: msg, type: 'error' })
    } finally {
      setConverting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この見積もりを削除しますか？')) return
    const { error } = await supabase.from('estimates').delete().eq('id', id)
    if (!error) router.push('/estimates')
  }

  if (loading || !estimate) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-[#2E3347] rounded animate-pulse" />
          <div className="h-64 bg-[#2E3347] rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  const totalCost = estimate.cost_labor + estimate.cost_material + estimate.cost_outsource + estimate.cost_expense
  const profit = estimate.contract_amount - totalCost
  const profitRate = estimate.contract_amount > 0 ? (profit / estimate.contract_amount) * 100 : 0
  const statusConfig = ESTIMATE_STATUS_CONFIG[estimate.status] ?? ESTIMATE_STATUS_CONFIG['draft']
  const isConverted = !!estimate.converted_project_id

  const costRows = [
    { label: CATEGORY_LABELS.labor,     icon: '👷', value: estimate.cost_labor },
    { label: CATEGORY_LABELS.material,  icon: '🧱', value: estimate.cost_material },
    { label: CATEGORY_LABELS.outsource, icon: '🔧', value: estimate.cost_outsource },
    { label: CATEGORY_LABELS.expense,   icon: '📋', value: estimate.cost_expense },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/estimates">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" />戻る</Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F8]">{estimate.name}</h1>
            {estimate.client_name && (
              <p className="text-[#8B92A9] mt-1">{estimate.client_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <button onClick={handleDelete} className="text-[#8B92A9] hover:text-red-400 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 試算サマリー */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: '契約金額', value: formatCurrency(estimate.contract_amount), color: 'text-[#F0F2F8]' },
            { label: '想定原価', value: formatCurrency(totalCost), color: 'text-[#F0F2F8]' },
            { label: '想定利益', value: formatCurrency(profit), color: profit >= 0 ? 'text-success' : 'text-danger' },
            { label: '想定利益率', value: formatRate(profitRate), color: profitRate >= 20 ? 'text-success' : profitRate >= 10 ? 'text-warning' : 'text-danger' },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-[#8B92A9] text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`font-mono text-xl font-semibold ${item.color}`}>{item.value}</p>
            </Card>
          ))}
        </div>

        {/* 想定原価内訳 */}
        <Card className="mb-6">
          <h2 className="text-[#F0F2F8] font-bold mb-4">想定原価内訳</h2>
          <div className="space-y-3">
            {costRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#2E3347] last:border-0">
                <span className="text-[#8B92A9] text-sm">{row.icon} {row.label}</span>
                <span className="font-mono text-[#F0F2F8] text-sm">{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[#F0F2F8] font-bold text-sm">合計</span>
              <span className="font-mono text-[#F0F2F8] font-bold">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </Card>

        {/* メモ */}
        {estimate.note && (
          <Card className="mb-6">
            <h2 className="text-[#F0F2F8] font-bold mb-2">メモ</h2>
            <p className="text-[#8B92A9] text-sm whitespace-pre-wrap">{estimate.note}</p>
          </Card>
        )}

        {/* ステータス変更 */}
        {!isConverted && (
          <Card className="mb-6">
            <h2 className="text-[#F0F2F8] font-bold mb-4">ステータス変更</h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ESTIMATE_STATUS_CONFIG) as EstimateStatus[]).map((s) => {
                const cfg = ESTIMATE_STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      estimate.status === s
                        ? 'bg-amber-500 border-amber-500 text-gray-900'
                        : 'bg-[#222639] border-[#2E3347] text-[#8B92A9] hover:text-[#F0F2F8] hover:border-[#4B5270]'
                    }`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* 工事化ボタン */}
        {isConverted ? (
          <Link href={`/projects/${estimate.converted_project_id}`}>
            <Button variant="secondary" className="w-full">
              <ArrowRight className="w-4 h-4" />
              工事ページを開く
            </Button>
          </Link>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleConvertToProject}
            loading={converting}
          >
            <ArrowRight className="w-4 h-4" />
            この見積もりを工事に変換する
          </Button>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </DashboardLayout>
  )
}
