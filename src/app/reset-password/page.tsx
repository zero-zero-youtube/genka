'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat, Lock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabaseはパスワードリセットリンクのクリック後、
    // onAuthStateChangeでPASSWORD_RECOVERYイベントを発火する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      } else if (event === 'SIGNED_IN' && session) {
        // すでにセッションがある場合も表示する
        setReady(true)
      }
    })

    // すでにセッションがある場合の初期チェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError('パスワードの更新に失敗しました。もう一度お試しください。')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B92A9] text-sm">認証情報を確認中...</p>
        </div>
      </div>
    )
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
          <p className="text-[#8B92A9] text-sm">工事原価管理システム</p>
        </div>

        <div className="bg-[#1A1D26] border border-[#2E3347] rounded-2xl p-8">
          {done ? (
            /* 完了画面 */
            <div className="text-center">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">パスワードを更新しました</h1>
              <p className="text-[#8B92A9] text-sm">
                ダッシュボードに移動します...
              </p>
            </div>
          ) : (
            /* パスワード入力フォーム */
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <h1 className="text-xl font-bold text-[#F0F2F8] mb-1">新しいパスワードを設定</h1>
                <p className="text-[#8B92A9] text-sm">
                  8文字以上の新しいパスワードを入力してください。
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="新しいパスワード"
                  type="password"
                  placeholder="8文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />

                <Input
                  label="パスワード（確認）"
                  type="password"
                  placeholder="もう一度入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" variant="primary" loading={loading} className="w-full">
                  パスワードを更新する
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
