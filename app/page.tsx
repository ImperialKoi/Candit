"use client" // Added 'use client' for the search functionality

import { useState } from "react" // Import useState
import { useRouter } from "next/navigation" // Import useRouter
import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Truck, Shield, RotateCcw, Search } from "lucide-react" // Import Search icon
import { Input } from "@/components/ui/input" // Import Input component
import { Button } from "@/components/ui/button" // Import Button component

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("") // State for search input
  const router = useRouter()

  // Function to handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("") // Clear search input after navigating
    }
  }

  // Note: Data fetching for featuredProducts and techProducts will still happen on the server
  // as this component is now a client component, but the initial data fetch will be done
  // on the server and then hydrated on the client.
  // For a more optimized approach with client components, you might consider SWR or React Query.
  // For this example, we'll keep the existing server-side data fetching pattern for simplicity.
  const [featuredProducts, setFeaturedProducts] = useState<any[] | null>(null)
  const [techProducts, setTechProducts] = useState<any[] | null>(null)

  useState(() => {
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
  })

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Spotlight */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Latest <span className="text-blue-400">Technology</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
