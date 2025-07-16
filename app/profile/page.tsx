"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Calendar, ShoppingBag, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fullName, setFullName] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }

    setUser(user)
    fetchProfile(user.id)
  }

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || "")
    } else if (error && error.code === "PGRST116") {
      // Profile doesn't exist, create one
      const { data: newProfile } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email: user?.email,
          full_name: "",
          avatar_url: "",
        })
        .select()
        .single()

      if (newProfile) {
        setProfile(newProfile)
      }
    }

    setLoading(false)
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUpdating(true)

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: profile?.avatar_url || "",
    })

    if (!error) {
      setProfile({ ...profile, full_name: fullName })
    }

    setUpdating(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                <Button type="submit" disabled={updating} className="w-full bg-blue-600 hover:bg-blue-700">
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Mail className="w-5 h-5 mr-2" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Email Verified</span>
                <span className="text-green-400">{user?.email_confirmed_at ? "Yes" : "No"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Member Since</span>
                <span className="text-blue-400">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Last Sign In</span>
                <span className="text-purple-400">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/cart")}
                variant="outline"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                View Cart
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Heart className="w-4 h-4 mr-2" />
                Wishlist
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Order History
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSignOut} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
