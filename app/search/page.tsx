"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      fetchSearchResults(query)
    } else {
      setProducts([])
      setLoading(false)
    }
  }, [query])

  const fetchSearchResults = async (searchQuery: string) => {
    setLoading(true)
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${searchQuery}%`) // Case-insensitive search on product name
      .order("name")

    if (error) {
      console.error("Error fetching search results:", error)
      setProducts([])
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Searching...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Search Results for "{query}" ({products.length})
        </h1>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="w-24 h-24 text-muted-foreground mx-auto mb-8" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">No products found</h2>
            <p className="text-muted-foreground mb-8">
              Your search for "<strong>{query}</strong>" did not yield any results.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        )}
      </div>
    </div>
  )
}
