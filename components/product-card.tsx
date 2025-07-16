"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, Truck } from "lucide-react" // Added Truck icon
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge" // Import Badge

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }

    setIsLoading(true)

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .single()

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        })
      }

      // Trigger a page refresh to update cart count
      window.location.reload()
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="bg-gray-900 border-gray-800 hover:border-blue-400 transition-all duration-200 group cursor-pointer">
        <CardContent className="p-4">
          <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-800">
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>

          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 text-sm ml-2">({product.rating})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-blue-400">${product.price.toFixed(2)}</span>

            <Button
              onClick={addToCart}
              disabled={isLoading || product.stock === 0}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                "Adding..."
              ) : product.stock === 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1 sm:mr-0 lg:mr-1" />
                  <span className="hidden sm:inline">Add to Cart</span>
                  <span className="inline sm:hidden">Add</span>
                </>
              )}
            </Button>
          </div>

          {product.stock < 10 && product.stock > 0 && (
            <p className="text-orange-400 text-sm mt-2">Only {product.stock} left in stock!</p>
          )}

          {product.is_free_shipping && (
            <Badge variant="secondary" className="mt-2 bg-green-600 text-white">
              <Truck className="w-3 h-3 mr-1" /> Free Shipping
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
