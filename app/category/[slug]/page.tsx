"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"
import type { Product } from "@/lib/types"
// Removed: import { useScrollReveal } from "@/hooks/use-scroll-reveal"
// Removed: import { cn } from "@/lib/utils" // Assuming cn is only used for animation here

const categoryMap: Record<string, string> = {
  technology: "Technology",
  "gift-cards": "Gift Cards",
  "home-essentials": "Home Essentials",
  games: "Games",
  "board-games": "Board Games",
  groceries: "Groceries",
}

const brandsByCategory: Record<string, string[]> = {
  Technology: ["Apple", "Samsung", "Sony", "Microsoft", "Google"],
  "Gift Cards": ["Amazon", "iTunes", "Google Play", "Steam", "Netflix"],
  "Home Essentials": ["Dyson", "Instant Pot", "Ninja", "KitchenAid", "Philips"],
  Games: ["PlayStation", "Xbox", "Nintendo", "Steam", "Epic Games"],
  "Board Games": ["Hasbro", "Mattel", "Ravensburger", "Days of Wonder", "Fantasy Flight"],
  Groceries: ["Organic", "Fresh", "Local", "Premium", "Store Brand"],
}

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  // Removed: Scroll reveal hook
  // const { ref: productsGridRef, isVisible: productsGridIsVisible } = useScrollReveal({ delay: 100, key: params.slug })

  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000])
  const [minRating, setMinRating] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>("relevance")

  const categoryName = categoryMap[params.slug]

  useEffect(() => {
    if (!categoryName) {
      router.push("/404")
      return
    }
    fetchProducts()
  }, [categoryName, router])

  useEffect(() => {
    applyFiltersAndSort()
  }, [products, selectedBrands, priceRange, minRating, inStockOnly, sortBy])

  const fetchProducts = async () => {
    setLoading(true)
    const supabase = createServerClient()
    const { data } = await supabase.from("products").select("*").eq("category", categoryName).order("name")

    if (data) {
      setProducts(data)
      const prices = data.map((p) => p.price)
      const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0
      const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000
      setPriceRange([minPrice, maxPrice])
    }
    setLoading(false)
  }

  const applyFiltersAndSort = () => {
    let filtered = [...products]

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) =>
        selectedBrands.some((brand) => product.name.toLowerCase().includes(brand.toLowerCase())),
      )
    }

    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])
    filtered = filtered.filter((product) => product.rating >= minRating)

    if (inStockOnly) {
      filtered = filtered.filter((product) => product.stock > 0)
    }

    switch (sortBy) {
      case "popularity":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "price-low-high":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high-low":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "relevance":
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setFilteredProducts(filtered)
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand])
    } else {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand))
    }
  }

  const clearAllFilters = () => {
    setSelectedBrands([])
    const prices = products.map((p) => p.price)
    const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0
    const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000
    setPriceRange([minPrice, maxPrice])
    setMinRating(0)
    setInStockOnly(false)
    setSortBy("relevance")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  const brands = brandsByCategory[categoryName] || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-64 space-y-4 shrink-0`}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Brand</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {brands.slice(0, 5).map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={brand}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                    />
                    <Label htmlFor={brand} className="text-xs cursor-pointer">
                      {brand}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Price Range</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Minimum Rating</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Slider
                  value={[minRating]}
                  onValueChange={(value) => setMinRating(value[0])}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">{minRating} stars and above</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Availability</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={inStockOnly}
                    onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                  />
                  <Label htmlFor="in-stock" className="text-xs cursor-pointer">
                    In Stock Only
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            {filteredProducts.length > 0 ? (
              // Removed ref and animation classes
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-muted-foreground mb-4">No products found</h2>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria.</p>
                <Button onClick={clearAllFilters}>Clear All Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
