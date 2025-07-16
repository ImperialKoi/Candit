"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { userProfileService } from "@/lib/user-profile"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"

type AuthMode = "signin" | "signup" | "reset"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [mode, setMode] = useState<AuthMode>("signin")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Ensure user profile exists
        const profileExists = await userProfileService.profileExists(user.id)
        if (!profileExists) {
          await userProfileService.upsertProfile({
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "",
            email_confirmed: !!user.email_confirmed_at,
            email_confirmed_at: user.email_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
          })
        }
        router.push("/")
      }
    }
    checkUser()
  }, [router])

  const showMessage = (text: string, type: "success" | "error" = "error") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(""), 5000)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showMessage("Passwords don't match")
      return
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters")
      return
    }

    if (!fullName.trim()) {
      showMessage("Please enter your full name")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        // Create user profile immediately
        await userProfileService.upsertProfile({
          email: data.user.email || "",
          full_name: fullName.trim(),
          email_confirmed: !!data.user.email_confirmed_at,
          email_confirmed_at: data.user.email_confirmed_at,
          last_sign_in_at: data.user.last_sign_in_at,
        })

        if (!data.user.email_confirmed_at) {
          setNeedsConfirmation(true)
          setConfirmationEmail(email)
          showMessage(
            "Account created! Please check your email and click the confirmation link to complete your registration.",
            "success",
          )
        } else {
          showMessage("Account created successfully!", "success")
          router.push("/")
        }
      }
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        showMessage("An account with this email already exists. Try signing in instead.")
        switchMode("signin")
      } else {
        showMessage(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Update user profile on sign in
        await userProfileService.upsertProfile({
          email: data.user.email || "",
          full_name: data.user.user_metadata?.full_name || "",
          email_confirmed: !!data.user.email_confirmed_at,
          email_confirmed_at: data.user.email_confirmed_at,
          last_sign_in_at: data.user.last_sign_in_at,
        })

        showMessage("Signed in successfully!", "success")
        router.push("/")
      }
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        showMessage("Please check your email and confirm your account before signing in.")
      } else if (error.message.includes("Invalid login credentials")) {
        showMessage("Invalid email or password. Please check your credentials.")
      } else {
        showMessage(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      showMessage("Please enter your email address")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      showMessage("Password reset link sent! Check your email for instructions.", "success")
    } catch (error: any) {
      showMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    switch (mode) {
      case "signup":
        return handleSignUp(e)
      case "signin":
        return handleSignIn(e)
      case "reset":
        return handlePasswordReset(e)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setFullName("")
    setMessage("")
    setShowPassword(false)
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      showMessage("Confirmation email sent! Please check your inbox.", "success")
    } catch (error: any) {
      showMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-sm border-gray-800 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-white">
            {mode === "signin" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "reset" && "Reset Password"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {mode === "signin" && "Sign in to your account"}
            {mode === "signup" && "Create a new account to get started"}
            {mode === "reset" && "Enter your email to reset your password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </div>

            {mode !== "reset" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {mode === "signup" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            >
              {loading
                ? "Loading..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </Button>
          </form>

          {needsConfirmation && (
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 space-y-3">
              <div className="text-blue-400 text-sm">
                <p className="font-medium">Check your email</p>
                <p>
                  We sent a confirmation link to <span className="font-mono">{confirmationEmail}</span>
                </p>
              </div>
              <Button
                onClick={handleResendConfirmation}
                disabled={loading}
                variant="outline"
                size="sm"
                className="w-full border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent"
              >
                {loading ? "Sending..." : "Resend confirmation email"}
              </Button>
            </div>
          )}

          {message && (
            <Alert
              className={`${
                messageType === "success"
                  ? "border-green-500 bg-green-500/10 text-green-400"
                  : "border-red-500 bg-red-500/10 text-red-400"
              }`}
            >
              <AlertDescription className="text-sm">{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 text-center">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Forgot your password?
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Don't have an account? <span className="text-blue-400 hover:text-blue-300">Sign up</span>
                  </button>
                </div>
              </>
            )}

            {mode === "signup" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-gray-400 hover:text-white text-sm"
              >
                Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
              </button>
            )}

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-gray-400 hover:text-white text-sm"
              >
                Remember your password? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
