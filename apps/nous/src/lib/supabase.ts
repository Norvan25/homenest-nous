import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Untyped client — the Database type in @homenest/db is outdated and missing
// newer tables (email_queue, email_queue_settings). Once types are regenerated
// from Supabase, add the generic back: createBrowserClient<Database>(...)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
