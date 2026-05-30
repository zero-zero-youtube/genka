'use client'

import { useState, useEffect } from 'react'

export default function MonitorBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const closed = localStorage.getItem('monitor-banner-closed')
    if (!closed) setVisible(true)
  }, [])

  const handleClose = () => {
    localStorage.setItem('monitor-banner-closed', '1')
    setVisible(false)
  }

  const handleApply = () => {
    const el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <div className="w-full bg-amber-400 text-gray-900 py-3 px-4 flex items-center justify-between gap-4 animate-pulse-slow">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-bold text-sm whitespace-nowrap">
          🎯 無料モニター募集中
        </span>
        <span className="text-sm">
          先着3社限定・2ヶ月無料｜条件：フィードバック提供・導入事例掲載許可
        </span>
        <button
          onClick={handleApply}
          className="bg-gray-900 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          申し込む →
        </button>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-700 hover:text-gray-900 text-lg font-bold flex-shrink-0"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  )
}
