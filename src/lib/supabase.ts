import { createClient } from '@supabase/supabase-js'

// NEXT_PUBLIC_* 変数はビルド時にインライン化されるため常に利用可能
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'genka-auth',
    },
  }
)
