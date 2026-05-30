'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HardHat, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

type State = 'loading' | 'valid' | 'accepted' | 'expired' | 'error'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [state, setState] = useState<State>('loading')
  const [companyName, setCompanyName] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const checkInvitation = async () => {
      const { data: inv, error } = await supabase
        .from('invitations')
        .select('*, companies(name)')
        .eq('id', token)
        .single()

      if (error || !inv) { setState('error'); return }
      if (inv.accepted_at) { setState('accepted'); return }
      if (new Date(inv.expires_at) < new Date()) { setState('expired'); return }

      setCompanyName((inv.companies as { name: string })?.name ?? '')
      setState('valid')
    }
    checkInvitation()
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 未ログインならログインページへ（戻ってくるためのURLを渡す）
        router.push(`/login?redirect=/invite/${token}`)
        return
      }

      // 招待情報を再取得
      const { data: inv } = await supabase
        .from('invitations')
        .select('company_id, role')
        .eq('id', token)
        .single()
      if (!inv) throw new Error('招待が見つかりません')

      // すでに別の会社に所属していないか確認
      const { data: existing } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (existing) throw new Error('すでに別の会社に所属しています')

      // メンバーとして追加
      const { error: memberError } = await supabase.from('company_members').insert({
        company_id: inv.company_id,
        user_id: user.id,
        role: inv.role,
      })
      if (memberError) throw memberError

      // 招待を承認済みに更新
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', token)

      setState('accepted')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      setState('error')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <HardHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="text-3xl font-bold text-[#F0F2F8] tracking-tight">GenKa</span>
          </div>
        </div>

        <div className="bg-[#1A1D26] border border-[#2E3347] rounded-2xl p-8 text-center">
          {state === 'loading' && (
            <div className="flex items-center justify-center gap-3 text-[#8B92A9]">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>確認中...</span>
            </div>
          )}

          {state === 'valid' && (
            <>
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">チームへの招待</h1>
              <p className="text-[#8B92A9] mb-6">
                <span className="text-amber-400 font-bold">{companyName}</span> に招待されています。
                <br />参加しますか？
              </p>
              <Button variant="primary" className="w-full" onClick={handleAccept} loading={accepting}>
                招待を承認して参加する
              </Button>
            </>
          )}

          {state === 'accepted' && (
            <>
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">参加完了</h1>
              <p className="text-[#8B92A9]">チームに参加しました。ダッシュボードに移動します...</p>
            </>
          )}

          {state === 'expired' && (
            <>
              <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">招待の有効期限切れ</h1>
              <p className="text-[#8B92A9]">この招待リンクは期限切れです。オーナーに再発行を依頼してください。</p>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">エラー</h1>
              <p className="text-[#8B92A9]">招待リンクが無効です。</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
