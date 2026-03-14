// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// .env.local から値を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 外のファイル（Pageなど）で使い回せるように export する
export const supabase = createClient(supabaseUrl, supabaseAnonKey)