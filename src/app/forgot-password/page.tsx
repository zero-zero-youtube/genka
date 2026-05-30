'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HardHat, ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError('メール送信に失敗しました。メールアドレスを確認してください。')
      return
    }

    setSent(true)
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
          {sent ? (
            /* 送信完了画面 */
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-[#F0F2F8] mb-2">メールを送信しました</h1>
              <p className="text-[#8B92A9] text-sm leading-relaxed mb-6">
                <span className="text-[#F0F2F8]">{email}</span> にパスワードリセット用のリンクを送信しました。
                <br />メールをご確認ください。
              </p>
              <p className="text-[#8B92A9] text-xs mb-6">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  ログイン画面に戻る
                </Button>
              </Link>
            </div>
          ) : (
            /* メール入力フォーム */
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-[#F0F2F8] mb-1">パスワードをリセット</h1>
                <p className="text-[#8B92A9] text-sm">
                  登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="example@company.co.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" variant="primary" loading={loading} className="w-full">
                  リセットメールを送信
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-[#8B92A9] hover:text-[#F0F2F8] text-sm transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    ログイン画面に戻る
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
