'use client'

import { useState } from 'react'

type TabType = 'dashboard' | 'report' | 'estimate'

export default function ScreenshotSection() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [contract, setContract] = useState(850)
  const [labor, setLabor] = useState(180)
  const [material, setMaterial] = useState(210)
  const [outsource, setOutsource] = useState(120)
  const [expense, setExpense] = useState(50)

  const totalCost = labor + material + outsource + expense
  const profit = contract - totalCost
  const margin = contract > 0 ? (profit / contract) * 100 : 0

  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'ダッシュボード' },
    { key: 'report', label: '月次レポート' },
    { key: 'estimate', label: '見積もり試算' },
  ]

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="mb-10">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-2">実際の画面</p>
          <h2 className="text-3xl font-bold text-white mb-3">使い方は、見ればわかる。</h2>
          <p className="text-gray-400 text-lg">複雑な操作は不要。現場でスマホから入力するだけで、経営数字がリアルタイムに更新されます。</p>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeTab === tab.key
                  ? 'bg-amber-400 text-gray-900 border-amber-400'
                  : 'text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ブラウザフレーム */}
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-white/10">
          {/* ブラウザバー */}
          <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-white/30 font-mono">genka-steel.vercel.app</span>
          </div>

          {/* ダッシュボードパネル */}
          {activeTab === 'dashboard' && (
            <div className="flex h-80">
              <MockSidebar active="dashboard" />
              <div className="flex-1 p-5 overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-base">ダッシュボード</h3>
                    <p className="text-white/40 text-xs">進行中の工事を管理しています</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-gray-700 text-white/70 text-xs px-3 py-1.5 rounded-md border border-white/10">↓ CSV</button>
                    <button className="bg-amber-400 text-gray-900 text-xs px-3 py-1.5 rounded-md font-semibold">+ 新規工事登録</button>
                  </div>
                </div>
                {/* 赤字アラート */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 mb-3 flex items-center gap-2 text-xs text-red-400">
                  <span>⚠</span>
                  <span>赤字リスク：「渋谷区オフィス改修」の予測利益率が -8.2% です。確認してください。</span>
                </div>
                {/* KPIカード */}
                <div className="grid grid-cols-4 gap-2.5 mb-3">
                  {[
                    { label: '進行中の工事', value: '8件', color: 'text-white' },
                    { label: '総契約金額', value: '¥47,820万', color: 'text-white' },
                    { label: '総実績原価', value: '¥31,240万', color: 'text-white' },
                    { label: '予測粗利益率', value: '18.4%', color: 'text-green-400' },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-gray-800 rounded-lg p-3 border border-white/5">
                      <div className="text-white/40 text-xs mb-1">{kpi.label}</div>
                      <div className={`font-bold text-sm ${kpi.color}`}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
                {/* 工事テーブル */}
                <div className="bg-gray-800 rounded-lg border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-6 px-3 py-2 text-xs text-white/30 border-b border-white/5">
                    <span className="col-span-2">工事名</span>
                    <span>契約金額</span>
                    <span>利益率</span>
                    <span>進捗</span>
                    <span>状態</span>
                  </div>
                  {[
                    { name: '新宿マンション新築', amount: '¥1,850万', margin: '22.1%', marginColor: 'text-green-400', progress: 68, status: '進行中', statusColor: 'bg-green-500/20 text-green-400' },
                    { name: '渋谷区オフィス改修', amount: '¥680万', margin: '-8.2%', marginColor: 'text-red-400', progress: 91, status: '要確認', statusColor: 'bg-red-500/20 text-red-400' },
                    { name: '港区戸建てリノベ', amount: '¥320万', margin: '12.8%', marginColor: 'text-amber-400', progress: 45, status: '進行中', statusColor: 'bg-amber-500/20 text-amber-400' },
                  ].map(row => (
                    <div key={row.name} className="grid grid-cols-6 px-3 py-2.5 text-xs text-white/70 border-b border-white/5 last:border-0 items-center">
                      <span className="col-span-2">{row.name}</span>
                      <span>{row.amount}</span>
                      <span className={`font-semibold ${row.marginColor}`}>{row.margin}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="text-white/30 text-xs">{row.progress}%</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${row.statusColor}`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 月次レポートパネル */}
          {activeTab === 'report' && (
            <div className="flex h-80">
              <MockSidebar active="report" />
              <div className="flex-1 p-5">
                <h3 className="text-white font-semibold text-base mb-1">月次レポート</h3>
                <p className="text-white/40 text-xs mb-4">2025年 粗利益推移</p>
                <div className="bg-gray-800 rounded-lg border border-white/5 p-4 mb-3">
                  <p className="text-white text-sm font-semibold mb-3">月別粗利益（万円）</p>
                  <div className="flex items-end gap-2 h-20">
                    {[
                      { month: '1月', h: '55%', highlight: false },
                      { month: '2月', h: '68%', highlight: false },
                      { month: '3月', h: '45%', highlight: false },
                      { month: '4月', h: '82%', highlight: false },
                      { month: '5月', h: '63%', highlight: false },
                      { month: '6月', h: '90%', highlight: true },
                    ].map(bar => (
                      <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm ${bar.highlight ? 'bg-amber-400' : 'bg-green-500/60'}`}
                          style={{ height: bar.h }}
                        />
                        <span className={`text-xs ${bar.highlight ? 'text-amber-400 font-semibold' : 'text-white/30'}`}>{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">今月完工件数</div>
                    <div className="text-white font-bold text-lg">3件</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 border border-white/5">
                    <div className="text-white/40 text-xs mb-1">今月粗利益合計</div>
                    <div className="text-green-400 font-bold text-lg">¥428万</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 見積もり試算パネル */}
          {activeTab === 'estimate' && (
            <div className="flex h-80">
              <MockSidebar active="estimate" />
              <div className="flex-1 p-5">
                <h3 className="text-white font-semibold text-base mb-1">受注前利益試算</h3>
                <p className="text-white/40 text-xs mb-4">原価を入力して受注前に利益を確認</p>
                <div className="bg-gray-800 rounded-lg border border-white/5 p-4">
                  <div className="mb-3">
                    <label className="text-white/40 text-xs block mb-1">契約金額（万円）</label>
                    <input
                      type="number"
                      value={contract}
                      onChange={e => setContract(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: '労務費（万円）', value: labor, setter: setLabor },
                      { label: '材料費（万円）', value: material, setter: setMaterial },
                      { label: '外注費（万円）', value: outsource, setter: setOutsource },
                      { label: '経費（万円）', value: expense, setter: setExpense },
                    ].map(field => (
                      <div key={field.label}>
                        <label className="text-white/40 text-xs block mb-1">{field.label}</label>
                        <input
                          type="number"
                          value={field.value}
                          onChange={e => field.setter(Number(e.target.value))}
                          className="w-full bg-gray-900 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    className={`rounded-lg p-3 flex justify-between border ${
                      margin >= 15
                        ? 'bg-green-500/10 border-green-500/30'
                        : margin >= 0
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div>
                      <div className="text-white/40 text-xs">予測粗利益</div>
                      <div className={`text-lg font-bold ${margin >= 15 ? 'text-green-400' : margin >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        ¥{Math.round(profit)}万
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs">粗利益率</div>
                      <div className={`text-lg font-bold ${margin >= 15 ? 'text-green-400' : margin >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {margin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3カラム訴求 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { icon: '⚠️', title: '赤字を完工前に検知', desc: '実績原価が積み上がるたびに予測利益率を再計算。危険ラインに達すると自動アラート。' },
            { icon: '📊', title: '月次の利益を一画面で', desc: '月別粗利益の推移グラフで、好調月・不振月を一目で把握。経営会議の資料にそのまま使える。' },
            { icon: '🧮', title: '受注前に利益を試算', desc: '見積もり段階で原価を入力するだけ。「この工事を取るべきか」を数字で判断できる。' },
          ].map(card => (
            <div key={card.title} className="bg-gray-900 border border-white/10 rounded-xl p-5">
              <div className="text-2xl mb-2">{card.icon}</div>
              <h4 className="text-white font-semibold mb-1">{card.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MockSidebar({ active }: { active: string }) {
  const items = [
    { key: 'dashboard', label: 'ダッシュボード' },
    { key: 'estimate', label: '見積もり' },
    { key: 'report', label: '月次レポート' },
    { key: 'new', label: '新規工事登録' },
    { key: 'team', label: 'チーム管理' },
    { key: 'settings', label: '設定' },
  ]
  return (
    <div className="w-44 bg-gray-950 p-3 border-r border-white/5 flex-shrink-0">
      <div className="px-2 py-3 border-b border-white/10 mb-2">
        <div className="text-amber-400 font-bold text-base">GenKa</div>
        <div className="text-white/30 text-xs">田中工務店</div>
      </div>
      {items.map(item => (
        <div
          key={item.key}
          className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs mb-0.5 ${
            active === item.key ? 'bg-amber-400/15 text-amber-400' : 'text-white/40'
          }`}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}
