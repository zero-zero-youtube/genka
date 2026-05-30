import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 遅延初期化：ブラウザ上で実行時のみ本物のURLを使用
let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // URLが有効な場合のみ本物のクライアントを作成
  const authOptions = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'genka-auth',
    },
  }

  if (url && url.startsWith('https://') && key) {
    _supabase = createClient(url, key, authOptions)
  } else {
    // 開発用ダミー（実際の接続は行われない）
    _supabase = createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder',
      authOptions
    )
  }
  return _supabase
}

// Proxyを使ってsupabaseアクセス時に遅延初期化
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
