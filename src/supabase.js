import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dtqmgvwxzsgsntrvtsbs.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ZEABGf4cKX-ibyNEo-XndA_c0QBduuh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
