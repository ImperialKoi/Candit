import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  bio?: string
  website?: string
  location?: string
  email_confirmed: boolean
  email_confirmed_at?: string
  last_sign_in_at?: string
  created_at: string
  updated_at: string
}

export const userProfileService = {
  // Get current user profile
  async getCurrentProfile(): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  // Create or update user profile
  async upsertProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error upserting user profile:", error)
      return null
    }

    return data
  },

  // Update profile
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user profile:", error)
      return null
    }

    return data
  },

  // Get profile by ID (for admin or public profiles)
  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile by ID:", error)
      return null
    }

    return data
  },

  // Check if profile exists
  async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase.from("user_profiles").select("id").eq("id", userId).single()

    return !error && !!data
  },
}
