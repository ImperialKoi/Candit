import { createServerClient } from "@/lib/supabase"
import ProductCard from "@/components/product-card"
import { notFound } from "next/navigation"

const categoryMap: Record<string, string> = {
  technology: "Technology",
  "gift-cards": "Gift Cards",
  "home-essentials": "Home Essentials",
  games: "Games",
  "board-games": "Board Games",
  groceries: "Groceries",
}

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryName = categoryMap[params.slug]

  if (!categoryName) {
    notFound()
  }

  const supabase = createServerClient()

  const { data: products } = await supabase.from("products").select("*").eq("category", categoryName).order("name")

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{categoryName}</h1>
          <p className="text-gray-400">Discover our amazing selection of {categoryName.toLowerCase()} products</p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">No products found</h2>
            <p className="text-gray-500">We're working on adding more products to this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}
