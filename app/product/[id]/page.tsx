"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Star, ShoppingCart, Heart, Truck, Shield, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single()

    if (error || !data) {
      router.push("/404")
      return
    }

    setProduct(data)
    setLoading(false)
  }

  const addToCart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }

    setAddingToCart(true)

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", params.id)
        .single()

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: params.id,
          quantity: quantity,
        })
      }

      router.push("/cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Product not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square relative bg-gray-900 rounded-lg overflow-hidden">
            <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-400 ml-2">({product.rating} out of 5)</span>
              </div>
            </div>

            <div className="text-4xl font-bold text-blue-400">${product.price.toFixed(2)}</div>

            <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
                >
                  {[...Array(Math.min(10, product.stock))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {product.stock < 10 && product.stock > 0 && (
                <span className="text-orange-400 text-sm">Only {product.stock} left in stock!</span>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={addToCart}
                disabled={addingToCart || product.stock === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                {addingToCart ? (
                  "Adding to Cart..."
                ) : product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-sm">Free Shipping</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-sm">Secure Payment</span>
                  </div>
                  <div className="flex items-center">
                    <RotateCcw className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-sm">Easy Returns</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
