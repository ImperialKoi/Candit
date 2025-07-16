import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Truck, Shield, RotateCcw } from "lucide-react"

export default async function HomePage() {
  const supabase = createServerClient()

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .order("rating", { ascending: false })
    .limit(8)

  const { data: techProducts } = await supabase.from("products").select("*").eq("category", "Technology").limit(4)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-blue-400">Shop</span>
              <span className="text-purple-400">Zone</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">Discover amazing products at unbeatable prices</p>
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
              { name: "Groceries", icon: "🛒", color: "from-orange-600 to-orange-800" },
            ].map((category) => (
              <Card
                key={category.name}
                className="bg-gray-900 border-gray-800 hover:border-blue-400 transition-all cursor-pointer"
              >
                <CardContent className="p-6 text-center">
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
