'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Copy, Trash2, UserPlus } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { Invitation } from '@/types'

interface MemberRow {
  id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  email: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setMyUserId(user.id)

        // 自分のcompany_id取得
        const { data: memberData, error: memberErr } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (memberErr || !memberData) {
          console.error('company_members取得エラー:', memberErr)
          setLoading(false)
          return
        }
        setCompanyId(memberData.company_id)

        // メンバー一覧取得
        const { data: membersData } = await supabase
          .from('company_members')
          .select('id, user_id, role, joined_at')
          .eq('company_id', memberData.company_id)
          .order('joined_at', { ascending: true })
        setMembers((membersData ?? []) as MemberRow[])

        // 招待一覧取得（未承認のみ）
        const { data: invData } = await supabase
          .from('invitations')
          .select('*')
          .eq('company_id', memberData.company_id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
        setInvitations(invData ?? [])
      } catch (e) {
        console.error('fetchData error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 招待リンクを生成
  const handleCreateInvite = async () => {
    if (!companyId) return
    setInviting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          company_id: companyId,
          email: inviteEmail.trim() || null,
          role: 'member',
          invited_by: user?.id,
        })
        .select()
        .single()
      if (error) throw error

      setInvitations((prev) => [data, ...prev])
      setInviteEmail('')
      setToast({ message: '招待リンクを生成しました', type: 'success' })
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'エラーが発生しました'
      setToast({ message: msg, type: 'error' })
    } finally {
      setInviting(false)
    }
  }

  // 招待リンクをクリップボードにコピー
  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setToast({ message: '招待リンクをコピーしました', type: 'success' })
  }

  // メンバー削除
  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === myUserId) {
      setToast({ message: '自分自身は削除できません', type: 'error' })
      return
    }
    const { error } = await supabase.from('company_members').delete().eq('id', memberId)
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      setToast({ message: 'メンバーを削除しました', type: 'success' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-[#2E3347] rounded animate-pulse" />
          <div className="h-40 bg-[#2E3347] rounded-xl animate-pulse" />
          <div className="h-40 bg-[#2E3347] rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <p className="text-[#8B92A9]">
            チームデータを取得できませんでした。Supabaseの
            <code className="text-amber-400 mx-1">company_members</code>
            テーブルが作成されているか確認してください。
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F0F2F8]">チーム管理</h1>
          <p className="text-[#8B92A9] text-sm mt-1">メンバーの招待・管理ができます</p>
        </div>

        {/* 招待リンク生成 */}
        <Card className="mb-6">
          <h2 className="text-[#F0F2F8] font-bold mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            メンバーを招待
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="メールアドレス（任意）"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
              />
            </div>
            <Button variant="primary" onClick={handleCreateInvite} loading={inviting}>
              招待リンクを生成
            </Button>
          </div>
          <p className="text-[#8B92A9] text-xs mt-2">
            メールアドレスは省略可能です。生成されたリンクを共有してください。有効期限は7日間です。
          </p>
        </Card>

        {/* 未承認の招待一覧 */}
        {invitations.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-[#F0F2F8] font-bold mb-4">招待中（未承認）</h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-[#222639] rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="text-[#F0F2F8] text-sm font-medium">
                      {inv.email ?? 'リンク招待'}
                    </p>
                    <p className="text-[#8B92A9] text-xs mt-0.5">
                      期限: {new Date(inv.expires_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyInviteLink(inv.id)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    コピー
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* メンバー一覧 */}
        <Card>
          <h2 className="text-[#F0F2F8] font-bold mb-4">メンバー一覧</h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-[#222639] rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                    {member.role === 'owner' ? 'O' : 'M'}
                  </div>
                  <div>
                    <p className="text-[#F0F2F8] text-sm font-medium">
                      {member.user_id === myUserId ? 'あなた' : `メンバー`}
                    </p>
                    <p className="text-[#8B92A9] text-xs mt-0.5">
                      参加: {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'owner' ? 'warning' : 'blue'}>
                    {member.role === 'owner' ? 'オーナー' : 'メンバー'}
                  </Badge>
                  {member.role !== 'owner' && member.user_id !== myUserId && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="text-[#8B92A9] hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </DashboardLayout>
  )
}
