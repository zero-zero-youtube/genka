'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { Company } from '@/types'

// 設定フォームの内部コンポーネント（useSearchParamsをSuspenseでラップ）
function SettingsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'

  const [company, setCompany] = useState<Company | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!error && data) {
        setCompany(data)
        setCompanyName(data.name)
      }
    }
    fetchCompany()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証エラー')

      if (company) {
        // 更新
        const { error } = await supabase
          .from('companies')
          .update({ name: companyName.trim() })
          .eq('id', company.id)
        if (error) throw error
      } else {
        // 新規作成（初期セットアップ）
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ name: companyName.trim(), owner_id: user.id })
          .select()
          .single()
        if (companyError) throw companyError

        // オーナーをメンバーテーブルに登録（失敗してもリダイレクトは継続）
        const { error: memberError } = await supabase.from('company_members').insert({
          company_id: newCompany.id,
          user_id: user.id,
          role: 'owner',
        })
        if (memberError) {
          console.warn('company_members登録警告（DashboardLayoutで再試行されます）:', JSON.stringify(memberError))
        }
      }

      setToast({ message: '会社情報を保存しました', type: 'success' })

      if (isSetup) {
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'エラーが発生しました'
      setToast({ message, type: 'error' })
      console.error('設定保存エラー:', JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#F0F2F8]">
            {isSetup ? '会社情報の設定' : '設定'}
          </h1>
          {isSetup && (
            <p className="text-[#8B92A9] text-sm mt-1">
              まず会社名を設定してください
            </p>
          )}
        </div>

        <Card>
          <h2 className="text-[#F0F2F8] font-bold mb-4">会社情報</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="会社名"
              placeholder="株式会社〇〇建設"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" loading={loading}>
              保存する
            </Button>
          </form>
        </Card>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  )
}

// デフォルトエクスポート：Suspenseでラップ
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SettingsForm />
    </Suspense>
  )
}
