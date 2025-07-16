"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          setStatus("error")
          setMessage(error.message || "Authentication failed")
          setTimeout(() => router.push("/auth"), 3000)
          return
        }

        if (data.session) {
          // Check if this is an email confirmation
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (user?.email_confirmed_at) {
            setStatus("success")
            setMessage("Email confirmed successfully! Redirecting...")
            setTimeout(() => router.push("/"), 2000)
          } else {
            setStatus("success")
            setMessage("Signed in successfully! Redirecting...")
            setTimeout(() => router.push("/"), 2000)
          }
        } else {
          // No session, might be a confirmation link that needs manual handling
          const accessToken = searchParams.get("access_token")
          const refreshToken = searchParams.get("refresh_token")

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              setStatus("error")
              setMessage("Failed to confirm email")
              setTimeout(() => router.push("/auth"), 3000)
            } else {
              setStatus("success")
              setMessage("Email confirmed successfully! Redirecting...")
              setTimeout(() => router.push("/"), 2000)
            }
          } else {
            setStatus("error")
            setMessage("Invalid confirmation link")
            setTimeout(() => router.push("/auth"), 3000)
          }
        }
      } catch (error) {
        console.error("Callback error:", error)
        setStatus("error")
        setMessage("Something went wrong")
        setTimeout(() => router.push("/auth"), 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
              <p className="text-white">Confirming your account...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
              <p className="text-green-400 font-medium">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="text-red-400 font-medium">{message}</p>
              <p className="text-gray-400 text-sm">Redirecting to login...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
