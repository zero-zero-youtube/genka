'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

// 工事新規登録フォーム
export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    contract_amount: '',
    budget_labor: '',
    budget_material: '',
    budget_outsource: '',
    budget_expense: '',
    start_date: '',
    end_date: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // 数値入力を整数に変換
  const toInt = (value: string): number => {
    const num = parseInt(value.replace(/,/g, ''), 10)
    return isNaN(num) ? 0 : num
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('工事名を入力してください')
      return
    }
    if (toInt(form.contract_amount) <= 0) {
      setError('契約金額を入力してください')
      return
    }

    setLoading(true)

    try {
      // 会社IDを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証エラー')

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (companyError || !company) throw new Error('会社情報が見つかりません')

      // 工事を登録
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          company_id: company.id,
          name: form.name.trim(),
          client_name: form.client_name.trim() || null,
          contract_amount: toInt(form.contract_amount),
          budget_labor: toInt(form.budget_labor),
          budget_material: toInt(form.budget_material),
          budget_outsource: toInt(form.budget_outsource),
          budget_expense: toInt(form.budget_expense),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/projects/${project.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      console.error('工事登録エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // 予算合計を表示
  const totalBudget =
    toInt(form.budget_labor) +
    toInt(form.budget_material) +
    toInt(form.budget_outsource) +
    toInt(form.budget_expense)

  const contractAmount = toInt(form.contract_amount)
  const budgetProfitRate =
    contractAmount > 0
      ? ((contractAmount - totalBudget) / contractAmount) * 100
      : 0

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F0F2F8]">新規工事登録</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-4">基本情報</h2>
            <div className="space-y-4">
              <Input
                label="工事名 *"
                placeholder="〇〇邸 新築工事"
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

          {/* 工期 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-4">工期</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="着工日"
                type="date"
                value={form.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
              <Input
                label="完工予定日"
                type="date"
                value={form.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          </Card>

          {/* 予算内訳 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-bold mb-1">予算内訳</h2>
            <p className="text-[#8B92A9] text-xs mb-4">
              カテゴリ別の予算を設定します（後から変更可能）
            </p>
            <div className="space-y-3">
              <Input
                label="👷 労務費"
                type="number"
                inputMode="numeric"
                placeholder="0"
                prefix="¥"
                suffix="円"
                value={form.budget_labor}
                onChange={(e) => handleChange('budget_labor', e.target.value)}
              />
              <Input
                label="🧱 材料費"
                type="number"
                inputMode="numeric"
                placeholder="0"
                prefix="¥"
                suffix="円"
                value={form.budget_material}
                onChange={(e) => handleChange('budget_material', e.target.value)}
              />
              <Input
                label="🔧 外注費"
                type="number"
                inputMode="numeric"
                placeholder="0"
                prefix="¥"
                suffix="円"
                value={form.budget_outsource}
                onChange={(e) => handleChange('budget_outsource', e.target.value)}
              />
              <Input
                label="📋 経費"
                type="number"
                inputMode="numeric"
                placeholder="0"
                prefix="¥"
                suffix="円"
                value={form.budget_expense}
                onChange={(e) => handleChange('budget_expense', e.target.value)}
              />
            </div>

            {/* 予算サマリー */}
            {totalBudget > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2E3347]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8B92A9]">予算合計</span>
                  <span className="font-mono text-[#F0F2F8]">
                    ¥{totalBudget.toLocaleString('ja-JP')}
                  </span>
                </div>
                {contractAmount > 0 && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-[#8B92A9]">予算上の利益率</span>
                    <span
                      className={`font-mono font-semibold ${
                        budgetProfitRate >= 20
                          ? 'text-success'
                          : budgetProfitRate >= 10
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {budgetProfitRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            工事を登録する
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
}
