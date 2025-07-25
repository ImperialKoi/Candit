import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const checkEmailConfirmation = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user && !user.email_confirmed_at
}
