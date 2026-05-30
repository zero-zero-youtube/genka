import Link from 'next/link'
import { HardHat, BarChart2, Smartphone, FileText, CheckCircle, ArrowRight, Mail } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import ScreenshotSection from '@/components/ScreenshotSection'
import PricingSection from '@/components/PricingSection'

// ランディングページ
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F0F2F8]">
      {/* ナビゲーション */}
      <nav className="border-b border-[#2E3347] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">GenKa</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[#8B92A9] hover:text-[#F0F2F8] text-sm transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/login"
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="px-6 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              建設業向け工事原価管理システム
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              工事が終わってから
              <br />
              <span className="text-amber-400">赤字を知る</span>、
              <br />
              もう終わりにしよう。
            </h1>
            <p className="text-[#8B92A9] text-xl mb-8 leading-relaxed">
              リアルタイムの原価管理で、完工前に手を打てる。
              <br />
              スマホから入力、AIが分析、経営判断を支援します。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                無料で始める
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="sm:self-center text-[#8B92A9] text-sm">
                30日間無料 · クレジットカード不要
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 課題提示 */}
      <section className="px-6 py-16 bg-[#1A1D26]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-3">
            こんな経験、ありませんか？
          </h2>
          <p className="text-[#8B92A9] text-center mb-10">
            多くの工務店・建設会社が抱える課題です
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '😰',
                title: '工事完了後に実際の利益がわからない',
                desc: '完工後に集計してはじめて赤字に気づく。手遅れになることも。',
              },
              {
                icon: '📊',
                title: 'Excelで管理しているが更新が追いつかない',
                desc: '現場での原価入力が後回しになり、データが常に古い状態。',
              },
              {
                icon: '🤷',
                title: '担当者ごとに管理方法がバラバラ',
                desc: '退職・異動のたびにデータの継続性が失われる。',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#0F1117] border border-[#2E3347] rounded-xl p-6"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-[#F0F2F8] mb-2">{item.title}</h3>
                <p className="text-[#8B92A9] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10">
            GenKaの主要機能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart2,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                title: 'リアルタイム利益予測',
                desc: '実績原価を入力するたびに予測完工利益を自動計算。赤字リスクが一目でわかります。',
              },
              {
                icon: Smartphone,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                title: 'スマホからかんたん原価入力',
                desc: '現場でスマホから30秒で入力完了。労務費・材料費・外注費・経費をカテゴリ別に管理。',
              },
              {
                icon: FileText,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                title: '完工レポート自動生成',
                desc: '工事完了時に原価内訳・利益率レポートを自動作成。AIが所見と改善提案を提供。',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center">
                  <div
                    className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-[#F0F2F8] mb-2">{item.title}</h3>
                  <p className="text-[#8B92A9] text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* スクリーンショット */}
      <ScreenshotSection />

      {/* 料金（PricingSectionコンポーネントに移行済み） */}
      <PricingSection />

      {/* 料金（削除予定の旧コード - 非表示） */}
      {false && <section className="px-6 py-16 bg-[#1A1D26]">
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
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
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
              <Link
                href="/login"
                className="block text-center bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 rounded-xl transition-colors"
              >
                30日間無料で試す
              </Link>
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
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-[#8B92A9]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center bg-[#222639] hover:bg-[#2E3347] text-[#F0F2F8] font-bold py-3 rounded-xl transition-colors"
              >
                30日間無料で試す
              </Link>
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
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-[#8B92A9]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center bg-[#222639] hover:bg-[#2E3347] text-[#F0F2F8] font-bold py-3 rounded-xl transition-colors"
              >
                30日間無料で試す
              </Link>
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
                  a: 'スターター・スタンダード・プロは初月無料でお試しいただけます。クレジットカードの登録は不要です。',
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
      </section>}

      {/* お問い合わせ */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">お問い合わせ</h2>
            <p className="text-[#8B92A9]">
              導入のご相談・ご質問はお気軽にお問い合わせください。
              <br />
              通常2〜3営業日以内にご返信します。
            </p>
          </div>
          <div className="bg-[#1A1D26] border border-[#2E3347] rounded-2xl p-5 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-[#2E3347] px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <HardHat className="w-4 h-4 text-gray-900" />
            </div>
            <span className="font-bold text-sm">GenKa</span>
          </div>
          <p className="text-[#8B92A9] text-xs">© 2024 GenKa. 建設業向け工事原価管理システム</p>
        </div>
      </footer>
    </div>
  )
}
