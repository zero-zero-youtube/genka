'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        // ログイン処理
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push('/dashboard')
      } else {
        // 新規登録処理
        if (!companyName.trim()) {
          throw new Error('会社名を入力してください')
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        if (signUpData.user) {
          // 会社情報を保存
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ name: companyName.trim(), owner_id: signUpData.user.id })
            .select()
            .single()
          if (companyError) throw companyError

          // オーナーをcompany_membersに登録（これがないとダッシュボードに入れない）
          const { error: memberError } = await supabase.from('company_members').insert({
            company_id: newCompany.id,
            user_id: signUpData.user.id,
            role: 'owner',
          })
          if (memberError) throw memberError
        }

        router.push('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      // エラーメッセージを日本語化
      if (message.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (message.includes('User already registered')) {
        setError('このメールアドレスはすでに登録されています')
      } else {
        setError(message)
      }
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
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
          <p className="text-[#8B92A9] text-sm">工事原価管理システム</p>
        </div>

        {/* フォームカード */}
        <div className="bg-[#1A1D26] border border-[#2E3347] rounded-2xl p-8">
          {/* タブ切替 */}
          <div className="flex bg-[#222639] rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-[#1A1D26] text-[#F0F2F8] shadow'
                  : 'text-[#8B92A9] hover:text-[#F0F2F8]'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-[#1A1D26] text-[#F0F2F8] shadow'
                  : 'text-[#8B92A9] hover:text-[#F0F2F8]'
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="会社名"
                type="text"
                placeholder="株式会社〇〇建設"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            )}

            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@company.co.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="パスワード"
              type="password"
              placeholder={mode === 'register' ? '8文字以上' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
            >
              {mode === 'login' ? 'ログイン' : '無料で始める'}
            </Button>

            {mode === 'login' && (
              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-[#8B92A9] hover:text-amber-400 text-sm transition-colors"
                >
                  パスワードを忘れた方はこちら
                </a>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-[#8B92A9] text-xs mt-6">
          © 2024 GenKa. 建設業向け工事原価管理システム
        </p>
      </div>
    </div>
  )
}
