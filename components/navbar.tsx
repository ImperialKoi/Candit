"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"

const categories = ["Technology", "Gift Cards", "Home Essentials", "Games", "Board Games", "Groceries"]

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`)
      setSearchQuery("") // Clear search input after navigating
      setIsMenuOpen(false) // Close mobile menu after search
    }
  }

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-black/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Candit Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Candit
            </span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 pr-10 focus:ring-blue-400 focus:border-blue-400"
                value={searchQuery} // Bind value to state
                onChange={(e) => setSearchQuery(e.target.value)} // Update state on change
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery)
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-muted-foreground w-8 h-8 hover:bg-transparent"
                onClick={() => handleSearch(searchQuery)}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="sm" className="text-white hover:text-blue-400 hover:bg-gray-800">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white px-1.5 py-0.5 text-xs rounded-full min-w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-white hover:text-blue-400 hover:bg-gray-800">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut} 
                  className="text-white hover:text-red-400 hover:bg-gray-800"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black bg-transparent transition-colors"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-white hover:bg-gray-800"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Categories - Desktop */}
        <div className="hidden md:flex justify-center space-x-6 py-3 border-t border-gray-800">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/category/${category.toLowerCase().replace(" ", "-")}`}
              className="text-gray-300 hover:text-blue-400 text-sm transition-colors relative group"
            >
              {category}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 shadow-lg">
          <div className="px-4 py-4">
            <div className="mb-4 relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery} // Bind value to state
                onChange={(e) => setSearchQuery(e.target.value)} // Update state on change
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery)
                  }
                }}
                className="w-full bg-background border-input text-foreground placeholder-muted-foreground pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-muted-foreground w-8 h-8 hover:bg-transparent"
                onClick={() => handleSearch(searchQuery)}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 mb-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase().replace(" ", "-")}`}
                  className="block text-gray-300 hover:text-blue-400 py-2 px-2 rounded-md hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
            </div>

            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
              {user ? (
                <>
                  <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-gray-800">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Cart ({cartCount})
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-gray-800">
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
                    className="w-full justify-start text-red-400 hover:bg-gray-800"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black bg-transparent"
                  >
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