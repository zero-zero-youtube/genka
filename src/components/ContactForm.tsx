'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '送信に失敗しました')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました。しばらく後にお試しください。')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-[#F0F2F8] mb-2">お問い合わせありがとうございました</h3>
        <p className="text-[#8B92A9] text-sm leading-relaxed">
          内容を確認の上、担当者よりご連絡いたします。
          <br />
          通常2〜3営業日以内にご返信します。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="min-w-0">
          <label className="block text-[#8B92A9] text-sm font-medium mb-1.5">
            会社名 <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            placeholder="株式会社〇〇建設"
            value={form.companyName}
            onChange={handleChange}
            required
            className="block w-full bg-[#0F1117] border border-[#2E3347] rounded-lg px-4 py-3 text-[#F0F2F8] text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-[#8B92A9] text-sm font-medium mb-1.5">
            担当者名 <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            name="contactName"
            placeholder="山田 太郎"
            value={form.contactName}
            onChange={handleChange}
            required
            className="block w-full bg-[#0F1117] border border-[#2E3347] rounded-lg px-4 py-3 text-[#F0F2F8] text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[#8B92A9] text-sm font-medium mb-1.5">
          メールアドレス <span className="text-amber-400">*</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="example@company.co.jp"
          value={form.email}
          onChange={handleChange}
          required
          className="block w-full bg-[#0F1117] border border-[#2E3347] rounded-lg px-4 py-3 text-[#F0F2F8] text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-[#8B92A9] text-sm font-medium mb-1.5">
          お問い合わせ内容 <span className="text-amber-400">*</span>
        </label>
        <textarea
          name="message"
          placeholder="ご質問・ご要望などをご記入ください"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          className="block w-full bg-[#0F1117] border border-[#2E3347] rounded-lg px-4 py-3 text-[#F0F2F8] text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-bold py-3.5 rounded-xl transition-colors"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            送信する
          </>
        )}
      </button>
    </form>
  )
}
