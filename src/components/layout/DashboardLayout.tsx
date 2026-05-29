'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Company } from '@/types'
import Sidebar from './Sidebar'

// 認証済みレイアウト（サイドバー付き）
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      // セッション確認
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 会社情報取得
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (error || !companyData) {
        // 会社未登録なら設定ページへ（すでに設定ページにいる場合はリダイレクトしない）
        if (!pathname.startsWith('/settings')) {
          router.push('/settings?setup=true')
          return
        }
        setLoading(false)
        return
      }

      setCompany(companyData)
      setLoading(false)
    }
    init()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8B92A9]">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex">
      <Sidebar companyName={company?.name ?? ''} />
      {/* メインコンテンツ：モバイルで底部タブバー分のパディング */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
