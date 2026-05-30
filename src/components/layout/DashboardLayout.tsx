'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Company, MemberRole } from '@/types'
import Sidebar from './Sidebar'

// 認証済みレイアウト（サイドバー付き）
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(null)
  const [role, setRole] = useState<MemberRole>('member')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // company_membersからメンバーとして所属する会社を取得
      const { data: memberData } = await supabase
        .from('company_members')
        .select('role, companies(*)')
        .eq('user_id', user.id)
        .single()

      if (memberData) {
        setCompany(memberData.companies as unknown as Company)
        setRole(memberData.role as MemberRole)
        setLoading(false)
        return
      }

      // company_membersにない = 未セットアップ → 設定ページへ
      if (!pathname.startsWith('/settings') && !pathname.startsWith('/invite')) {
        router.push('/settings?setup=true')
        return
      }
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
      <Sidebar companyName={company?.name ?? ''} role={role} />
      {/* メインコンテンツ：モバイルで底部タブバー分のパディング */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
