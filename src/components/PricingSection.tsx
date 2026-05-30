'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type PlanKey = 'starter' | 'standard' | 'pro'

export default function PricingSection() {
  const [loading, setLoading] = useState<PlanKey | null>(null)

  const handleCheckout = async (plan: PlanKey) => {
    setLoading(plan)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // ユーザーの会社IDを取得
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user.id,
          companyId: memberData?.company_id ?? '',
          email: user.email,
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('決済の開始に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="px-6 py-16 bg-[#1A1D26]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-3">料金プラン</h2>
        <p className="text-[#8B92A9] text-center mb-10">まず無料プランでお試しいただけます</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* フリー */}
          <div className="bg-[#0F1117] border border-[#2E3347] rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-1">フリー</h3>
            <p className="text-[#8B92A9] text-sm mb-4">まず試したい方へ</p>
            <div className="mb-6">
              <span className="font-mono text-4xl font-bold text-[#F0F2F8]">無料</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['工事3件まで', '1ユーザー', '基本機能のみ', 'GenKaロゴ表示あり'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-[#8B92A9]">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block text-center bg-[#222639] hover:bg-[#2E3347] text-[#F0F2F8] font-bold py-3 rounded-xl transition-colors"
            >
              無料で始める
            </Link>
          </div>

          {/* スターター */}
          <div className="bg-[#0F1117] border-2 border-amber-500 rounded-2xl p-6 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
              おすすめ
            </div>
            <h3 className="text-xl font-bold mb-1">スターター</h3>
            <p className="text-[#8B92A9] text-sm mb-4">小規模・個人事業主向け</p>
            <div className="mb-6">
              <span className="font-mono text-4xl font-bold text-[#F0F2F8]">¥29,800</span>
              <span className="text-[#8B92A9]">/月</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['工事件数 無制限', '5ユーザー', '全機能利用可能', 'GenKaロゴ非表示', 'メールサポート'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-[#8B92A9]">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('starter')}
              disabled={loading === 'starter'}
              className="block w-full text-center bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl transition-colors"
            >
              {loading === 'starter' ? '処理中...' : '30日間無料で試す'}
            </button>
          </div>

          {/* スタンダード */}
          <div className="bg-[#0F1117] border border-[#2E3347] rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-1">スタンダード</h3>
            <p className="text-[#8B92A9] text-sm mb-4">成長中の建設会社向け</p>
            <div className="mb-6">
              <span className="font-mono text-4xl font-bold text-[#F0F2F8]">¥99,000</span>
              <span className="text-[#8B92A9]">/月</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['工事件数 無制限', '10ユーザー', '全機能', 'GenKaロゴなし', '優先メールサポート', '月次レポートPDF'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-[#8B92A9]">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('standard')}
              disabled={loading === 'standard'}
              className="block w-full text-center bg-[#222639] hover:bg-[#2E3347] disabled:opacity-60 disabled:cursor-not-allowed text-[#F0F2F8] font-bold py-3 rounded-xl transition-colors"
            >
              {loading === 'standard' ? '処理中...' : '30日間無料で試す'}
            </button>
          </div>

          {/* プロ */}
          <div className="bg-[#0F1117] border border-[#2E3347] rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-1">プロ</h3>
            <p className="text-[#8B92A9] text-sm mb-4">大規模・複数現場向け</p>
            <div className="mb-6">
              <span className="font-mono text-4xl font-bold text-[#F0F2F8]">¥198,000</span>
              <span className="text-[#8B92A9]">/月</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {['ユーザー無制限', 'AI月次レポート', '専任サポート担当', 'カスタムレポート'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-[#8B92A9]">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading === 'pro'}
              className="block w-full text-center bg-[#222639] hover:bg-[#2E3347] disabled:opacity-60 disabled:cursor-not-allowed text-[#F0F2F8] font-bold py-3 rounded-xl transition-colors"
            >
              {loading === 'pro' ? '処理中...' : '30日間無料で試す'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-center text-[#F0F2F8] mb-6">よくある質問</h3>
          <div className="space-y-4">
            {[
              {
                q: 'いつでも解約できますか？',
                a: 'はい。契約期間の縛りはなく、いつでも解約できます。解約後も当月末まで利用可能です。',
              },
              {
                q: '30日間無料とはどういう意味ですか？',
                a: 'スターター・スタンダード・プロは初月無料でお試しいただけます。クレジットカードの登録は必要ですが、30日以内に解約すれば費用は発生しません。',
              },
              {
                q: 'プランはあとから変更できますか？',
                a: 'はい。フリー→スターター→スタンダード→プロへのアップグレードはいつでも可能です。',
              },
              {
                q: '建設業許可がなくても使えますか？',
                a: 'もちろんです。個人事業主の大工・左官・電気工事など、業種・規模を問わずご利用いただけます。',
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#0F1117] border border-[#2E3347] rounded-xl p-5">
                <p className="text-[#F0F2F8] font-medium text-sm mb-2">Q. {faq.q}</p>
                <p className="text-[#8B92A9] text-sm leading-relaxed">A. {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
