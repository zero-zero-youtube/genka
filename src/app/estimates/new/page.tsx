'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

export default function NewEstimatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    contract_amount: '',
    cost_labor: '',
    cost_material: '',
    cost_outsource: '',
    cost_expense: '',
    note: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toInt = (v: string) => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n }

  const contractAmount = toInt(form.contract_amount)
  const totalCost =
    toInt(form.cost_labor) + toInt(form.cost_material) +
    toInt(form.cost_outsource) + toInt(form.cost_expense)
  const profit = contractAmount - totalCost
  const profitRate = contractAmount > 0 ? (profit / contractAmount) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('案件名を入力してください'); return }
    if (contractAmount <= 0) { setError('契約金額を入力してください'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証エラー')

      const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()
      if (!member) throw new Error('会社情報が見つかりません')

      const { data: est, error: insertError } = await supabase
        .from('estimates')
        .insert({
          company_id: member.company_id,
          name: form.name.trim(),
          client_name: form.client_name.trim() || null,
          contract_amount: contractAmount,
          cost_labor: toInt(form.cost_labor),
          cost_material: toInt(form.cost_material),
          cost_outsource: toInt(form.cost_outsource),
          cost_expense: toInt(form.cost_expense),
          note: form.note.trim() || null,
          status: 'draft',
        })
        .select()
        .single()
      if (insertError) throw insertError

      router.push(`/estimates/${est.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/estimates">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" />戻る</Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F0F2F8]">新規見積もり</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-4">基本情報</h2>
            <div className="space-y-4">
              <Input
                label="案件名 *"
                placeholder="〇〇邸 リフォーム工事"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Input
                label="発注元（任意）"
                placeholder="〇〇不動産株式会社"
                value={form.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
              />
              <Input
                label="契約金額（円）*"
                type="number"
                inputMode="numeric"
                placeholder="5000000"
                prefix="¥"
                suffix="円"
                value={form.contract_amount}
                onChange={(e) => handleChange('contract_amount', e.target.value)}
                required
              />
            </div>
          </Card>

          {/* 想定原価 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-1">想定原価</h2>
            <p className="text-[#8B92A9] text-xs mb-4">カテゴリ別の見込み原価を入力してください</p>
            <div className="space-y-3">
              <Input label="👷 労務費" type="number" inputMode="numeric" placeholder="0" prefix="¥" suffix="円"
                value={form.cost_labor} onChange={(e) => handleChange('cost_labor', e.target.value)} />
              <Input label="🧱 材料費" type="number" inputMode="numeric" placeholder="0" prefix="¥" suffix="円"
                value={form.cost_material} onChange={(e) => handleChange('cost_material', e.target.value)} />
              <Input label="🔧 外注費" type="number" inputMode="numeric" placeholder="0" prefix="¥" suffix="円"
                value={form.cost_outsource} onChange={(e) => handleChange('cost_outsource', e.target.value)} />
              <Input label="📋 経費" type="number" inputMode="numeric" placeholder="0" prefix="¥" suffix="円"
                value={form.cost_expense} onChange={(e) => handleChange('cost_expense', e.target.value)} />
            </div>

            {/* リアルタイム試算 */}
            {contractAmount > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2E3347] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B92A9]">想定原価合計</span>
                  <span className="font-mono text-[#F0F2F8]">¥{totalCost.toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B92A9]">想定利益</span>
                  <span className={`font-mono font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    ¥{profit.toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B92A9]">想定利益率</span>
                  <span className={`font-mono font-semibold text-lg ${profitRate >= 20 ? 'text-success' : profitRate >= 10 ? 'text-warning' : 'text-danger'}`}>
                    {profitRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* メモ */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-4">メモ</h2>
            <textarea
              className="w-full bg-[#222639] border border-[#2E3347] rounded-lg text-[#F0F2F8] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder:text-[#4B5270] transition-colors px-4 py-3 min-h-[100px] resize-none"
              placeholder="条件・懸念点・メモなど"
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
            />
          </Card>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            見積もりを保存する
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
}
