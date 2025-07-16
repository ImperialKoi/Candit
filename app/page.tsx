"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Truck, Shield, RotateCcw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Removed: import { useScrollReveal } from "@/hooks/use-scroll-reveal"
// Removed: import { cn } from "@/lib/utils" // Assuming cn is only used for animation here

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Removed: Scroll reveal hooks for each section
  // const { ref: featuredRef, isVisible: featuredIsVisible } = useScrollReveal({ delay: 100 })
  // const { ref: techRef, isVisible: techIsVisible } = useScrollReveal({ delay: 200 })
  // const { ref: categoriesRef, isVisible: categoriesIsVisible } = useScrollReveal({ delay: 300 })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const [featuredProducts, setFeaturedProducts] = useState<any[] | null>(null)
  const [techProducts, setTechProducts] = useState<any[] | null>(null)

  useEffect(() => {
    const fetchInitialProducts = async () => {
      const supabase = createServerClient()
      const { data: featured } = await supabase
        .from("products")
        .select("*")
        .order("rating", { ascending: false })
        .limit(8)
      setFeaturedProducts(featured)

      const { data: tech } = await supabase.from("products").select("*").eq("category", "Technology").limit(4)
      setTechProducts(tech)
    }
    fetchInitialProducts()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Candit
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">Discover amazing products at unbeatable prices</p>
            {/* Search Bar in Hero Section */}
            <div className="max-w-md mx-auto flex gap-2 mb-8">
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-5 h-5" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center">
                <Truck className="w-5 h-5 mr-2 text-blue-400" />
                Free Shipping
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-400" />
                Secure Payment
              </div>
              <div className="flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-blue-400" />
                Easy Returns
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Star className="w-6 h-6 text-yellow-400 mr-2" />
            <h2 className="text-3xl font-bold">Featured Products</h2>
          </div>

          {/* Removed ref and animation classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Technology", icon: "💻", color: "from-blue-600 to-blue-800" },
              { name: "Gift Cards", icon: "🎁", color: "from-purple-600 to-purple-800" },
              { name: "Home Essentials", icon: "🏠", color: "from-green-600 to-green-800" },
              { name: "Games", icon: "🎮", color: "from-red-600 to-red-800" },
              { name: "Board Games", icon: "🎲", color: "from-yellow-600 to-yellow-800" },
            ].map((category) => (
              <Card
                key={category.name}
                className="bg-gray-900 border-gray-800 hover:border-blue-400 transition-all cursor-pointer"
              >
                <CardContent className="p-6 text-center" onClick={() => router.push(`/category/${category.name.toLowerCase().replace(" ", "-")}`)}>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-white font-semibold">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
