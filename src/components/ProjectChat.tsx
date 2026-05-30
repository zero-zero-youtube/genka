'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  image_url?: string | null
  created_at: string
  user_id: string
}

interface Props {
  projectId: string
}

export default function ProjectChat({ projectId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      // セッション確認（競合状態を防ぐためawaitで待つ）
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[ProjectChat] getSession error:', sessionError)
        setAuthError(`認証エラー: ${sessionError.message}`)
        return
      }

      if (!session) {
        console.warn('[ProjectChat] セッションなし — localStorage key:', 'genka-auth',
          '— localStorage値:', typeof window !== 'undefined' ? localStorage.getItem('genka-auth') : 'N/A')
        setAuthError('セッションが見つかりません。再ログインしてください。')
        return
      }

      console.log('[ProjectChat] session OK, user:', session.user.id, 'expires:', new Date(session.expires_at! * 1000).toLocaleString())
      setCurrentUserId(session.user.id)

      await loadMessages()

      const channel = supabase
        .channel(`project-chat-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_messages',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  }, [projectId])

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('[ProjectChat] loadMessages error:', JSON.stringify(error))
      return
    }

    if (data) {
      setMessages(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending || !currentUserId) return
    setSending(true)

    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: currentUserId,
      content: input.trim(),
    })

    if (error) {
      console.error('[ProjectChat] insert error:', JSON.stringify(error))
      alert(`送信エラー: ${error.message} (code: ${error.code})`)
    }

    setInput('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return
    setImageUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName)

      await supabase.from('project_messages').insert({
        project_id: projectId,
        user_id: currentUserId,
        content: '📸 写真を送信しました',
        image_url: publicUrl,
      })
    } catch (err) {
      console.error('画像アップロードエラー:', err)
      alert('アップロードに失敗しました')
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col bg-[#1A1D26] rounded-xl border border-[#2E3347] overflow-hidden" style={{ height: '480px' }}>
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-[#2E3347] flex items-center gap-2 flex-shrink-0">
        <span className="text-amber-400 text-base">💬</span>
        <h3 className="text-[#F0F2F8] font-semibold text-sm">現場トーク</h3>
        <span className="text-[#8B92A9] text-xs ml-auto">{messages.length}件</span>
      </div>

      {/* 認証エラー表示 */}
      {authError && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {authError}
        </div>
      )}

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !authError && (
          <div className="text-center text-[#8B92A9] text-sm py-8">
            まだメッセージがありません。最初のメッセージを送りましょう。
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.user_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[#8B92A9] text-xs px-1">メンバー</span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-amber-500 text-gray-900 rounded-tr-sm'
                    : 'bg-[#222639] text-[#F0F2F8] rounded-tl-sm'
                }`}>
                  {msg.content}
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="添付画像"
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                </div>
                <span className="text-[#8B92A9] text-xs px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="p-3 border-t border-[#2E3347] flex gap-2 items-end flex-shrink-0">
        <label className={`text-[#8B92A9] hover:text-amber-400 cursor-pointer p-2 transition-colors flex-shrink-0 ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {imageUploading ? (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-lg">📎</span>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageAttach}
            className="hidden"
            disabled={imageUploading}
          />
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enterで送信)"
          rows={1}
          className="flex-1 bg-[#222639] border border-[#2E3347] rounded-xl px-3 py-2 text-[#F0F2F8] text-sm resize-none focus:outline-none focus:border-amber-500/50 placeholder:text-[#4A5066]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || !currentUserId}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex-shrink-0"
        >
          送信
        </button>
      </div>
    </div>
  )
}
