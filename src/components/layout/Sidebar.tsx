'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, HardHat, Plus, Settings, LogOut, Users, FileText, BarChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { MemberRole } from '@/types'

// サイドバーナビゲーション
const Sidebar = ({ companyName, role }: { companyName: string; role: MemberRole }) => {
  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: BarChart2 },
    { href: '/estimates', label: '見積もり', icon: FileText },
    { href: '/reports/monthly', label: '月次レポート', icon: BarChart },
    { href: '/projects/new', label: '新規工事登録', icon: Plus },
    ...(role === 'owner' ? [{ href: '/team', label: 'チーム管理', icon: Users }] : []),
    { href: '/settings', label: '設定', icon: Settings },
  ]
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* デスクトップサイドバー */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#1A1D26] border-r border-[#2E3347] min-h-screen">
        {/* ロゴ */}
        <div className="px-6 py-5 border-b border-[#2E3347]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-xl font-bold text-[#F0F2F8] tracking-tight">GenKa</span>
          </div>
          <p className="text-xs text-[#8B92A9] mt-1 truncate">{companyName}</p>
        </div>

        {/* ナビメニュー */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-[#8B92A9] hover:text-[#F0F2F8] hover:bg-[#222639]'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-3 py-4 border-t border-[#2E3347]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[#8B92A9] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* モバイル底部タブバー */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1D26] border-t border-[#2E3347] flex">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-amber-400' : 'text-[#8B92A9]'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export default Sidebar
