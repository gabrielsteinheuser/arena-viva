import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Nulo enquanto o .env não estiver configurado; as telas mostram as instruções.
export const supabase = url && key ? createClient(url, key) : null
