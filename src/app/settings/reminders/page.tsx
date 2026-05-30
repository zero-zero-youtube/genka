'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

type Member = {
  user_id: string
  email: string
  role: string
}

export default function ReminderSettingsPage() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [, setRole] = useState<string>('')
  const [enabled, setEnabled] = useState(true)
  const [intervalDays, setIntervalDays] = useState(3)
  const [lineToken, setLineToken] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .single()

      if (!memberData) { router.push('/dashboard'); return }
      if (memberData.role !== 'owner') { router.push('/settings'); return }

      setCompanyId(memberData.company_id)
      setRole(memberData.role)

      // メンバー一覧取得（auth.usersのemailはAPIから取得できないので、
      // company_membersからuser_idを取得してauth.admin経由で取得）
      const { data: membersData } = await supabase
        .from('company_members')
        .select('user_id, role')
        .eq('company_id', memberData.company_id)

      if (membersData) {
        // anon keyでは auth.admin は使えないのでメタデータから取得
        const memberList: Member[] = []
        for (const m of membersData) {
          // 各ユーザーのemailはSupabaseのauth.usersから取得できないため
          // profiles or company_membersにemailカラムがあればそちらを使う
          // ここではuser_idのみ表示
          memberList.push({
            user_id: m.user_id,
            email: `メンバー (${m.user_id.substring(0, 8)}...)`,
            role: m.role,
          })
        }
        setMembers(memberList)
      }

      // リマインダー設定取得
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('company_id', memberData.company_id)
        .single()

      if (settings) {
        setEnabled(settings.enabled)
        setIntervalDays(settings.interval_days)
        setLineToken(settings.line_notify_token || '')
        setSelectedMembers(settings.notify_members || [])
      }
    }
    init()
  }, [router])

  const handleSave = async () => {
    if (!companyId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .upsert({
          company_id: companyId,
          enabled,
          interval_days: intervalDays,
          line_notify_token: lineToken || null,
          notify_members: selectedMembers,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' })

      if (error) throw error
      setToast({ message: 'リマインダー設定を保存しました', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ message: '保存に失敗しました', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(m => m !== userId) : [...prev, userId]
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F8]">リマインダー設定</h1>
            <p className="text-[#8B92A9] text-sm">原価未入力の工事を自動で通知します</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ON/OFF */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#F0F2F8] font-semibold">リマインダーを有効にする</h2>
                <p className="text-[#8B92A9] text-sm mt-1">設定した日数、原価入力がない工事を自動通知</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-amber-500' : 'bg-[#2E3347]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </Card>

          {/* 通知間隔 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-semibold mb-4">通知間隔</h2>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={30}
                value={intervalDays}
                onChange={e => setIntervalDays(Number(e.target.value))}
                className="w-20 bg-[#0F1117] border border-[#2E3347] rounded-lg px-3 py-2 text-[#F0F2F8] text-center focus:outline-none focus:border-amber-500"
              />
              <span className="text-[#8B92A9]">日間、原価入力がない工事を通知</span>
            </div>
          </Card>

          {/* LINE通知 */}
          <Card>
            <h2 className="text-[#F0F2F8] font-semibold mb-2">LINE通知トークン</h2>
            <p className="text-[#8B92A9] text-sm mb-4">
              <a href="https://notify-bot.line.me/ja/" target="_blank" rel="noopener noreferrer"
                className="text-amber-400 hover:underline">LINE Notify</a> でトークンを発行して入力してください
            </p>
            <input
              type="text"
              value={lineToken}
              onChange={e => setLineToken(e.target.value)}
              placeholder="LINE Notifyトークン（任意）"
              className="w-full bg-[#0F1117] border border-[#2E3347] rounded-lg px-4 py-3 text-[#F0F2F8] text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-[#8B92A9] text-xs mt-2">
              取得方法：LINE Notify → ログイン → マイページ → トークンを発行する → 「1:1でLINE Notifyから通知を受け取る」を選択
            </p>
          </Card>

          {/* メール通知対象メンバー */}
          <Card>
            <h2 className="text-[#F0F2F8] font-semibold mb-4">メール通知対象メンバー</h2>
            {members.length === 0 ? (
              <p className="text-[#8B92A9] text-sm">メンバーがいません</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.user_id}
                    onClick={() => toggleMember(member.user_id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedMembers.includes(member.user_id)
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#0F1117] border-[#2E3347] hover:border-[#4A5066]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedMembers.includes(member.user_id)
                        ? 'bg-amber-500 border-amber-500'
                        : 'border-[#4A5066]'
                    }`}>
                      {selectedMembers.includes(member.user_id) && (
                        <span className="text-gray-900 text-xs font-bold leading-none">✓</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[#F0F2F8] text-sm font-medium">{member.email}</div>
                      <div className="text-[#8B92A9] text-xs">{member.role === 'owner' ? 'オーナー' : 'メンバー'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">
            設定を保存する
          </Button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </DashboardLayout>
  )
}
