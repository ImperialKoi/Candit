"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const categories = ["Technology", "Gift Cards", "Home Essentials", "Games", "Board Games", "Groceries"]

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchCartCount(user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCartCount(session.user.id)
      } else {
        setCartCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchCartCount = async (userId: string) => {
    const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", userId)

    const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0
    setCartCount(total)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-blue-400">Shop</span>
            <span className="text-purple-400">Zone</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="sm" className="text-white hover:text-blue-400">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-white hover:text-blue-400">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-red-400">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Categories - Desktop */}
        <div className="hidden md:flex space-x-6 py-2 border-t border-gray-800">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/category/${category.toLowerCase().replace(" ", "-")}`}
              className="text-gray-300 hover:text-blue-400 text-sm transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-4 py-2">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2 mb-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase().replace(" ", "-")}`}
                  className="block text-gray-300 hover:text-blue-400 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-800">
              {user ? (
                <>
                  <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="text-white">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Cart ({cartCount})
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="text-white">
                      <User className="w-5 h-5 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="text-red-400"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="border-blue-400 text-blue-400 bg-transparent">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
