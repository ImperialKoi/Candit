"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, XCircle, UploadCloud } from "lucide-react" // Added UploadCloud
import Image from "next/image" // Import Image component for preview

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null)
  const [formMessage, setFormMessage] = useState("")
  const [formError, setFormError] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkUserAndAdminStatus()
    fetchProducts()
  }, [])

  const checkUserAndAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }
    setUser(user)

    const { data: profile, error } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single()

    if (error || !profile?.is_admin) {
      router.push("/") // Redirect non-admins
      return
    }
    setIsAdmin(true)
    setLoading(false)
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching products:", error)
    } else {
      setProducts(data || [])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewImage(URL.createObjectURL(file))
    } else {
      setSelectedFile(null)
      // If no new file is selected, revert preview to existing product image if editing
      setPreviewImage(currentProduct?.image_url || null)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage("")
    setFormError(false)
    setUploadingImage(false) // Reset upload status

    if (!currentProduct?.name || !currentProduct?.price || !currentProduct?.category) {
      setFormMessage("Name, Price, and Category are required.")
      setFormError(true)
      return
    }

    let imageUrlToSave = currentProduct.image_url || null

    if (selectedFile) {
      setUploadingImage(true)
      try {
        const fileExtension = selectedFile.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
        const filePath = `product_images/${fileName}` // Folder inside the bucket

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images") // Ensure this bucket exists in Supabase Storage
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false, // Set to true if you want to overwrite existing files with the same name
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath)
        imageUrlToSave = publicUrlData.publicUrl
      } catch (error: any) {
        setFormMessage(`Image upload failed: ${error.message}`)
        setFormError(true)
        setUploadingImage(false)
        return
      } finally {
        setUploadingImage(false)
      }
    }

    try {
      const productData = {
        name: currentProduct.name,
        description: currentProduct.description || null,
        price: currentProduct.price,
        image_url: imageUrlToSave, // Use the uploaded URL or existing one
        category: currentProduct.category,
        stock: currentProduct.stock || 0,
        rating: currentProduct.rating || 0,
        is_free_shipping: currentProduct.is_free_shipping || false,
      }

      if (isEditing && currentProduct?.id) {
        const { error } = await supabase.from("products").update(productData).eq("id", currentProduct.id)
        if (error) throw error
        setFormMessage("Product updated successfully!")
      } else {
        const { error } = await supabase.from("products").insert(productData)
        if (error) throw error
        setFormMessage("Product created successfully!")
      }
      setFormError(false)
      setCurrentProduct(null)
      setIsEditing(false)
      setSelectedFile(null)
      setPreviewImage(null)
      fetchProducts() // Refresh product list
    } catch (error: any) {
      setFormMessage(`Error: ${error.message}`)
      setFormError(true)
      console.error("Product form error:", error)
    }
  }

  const handleEdit = (product: Product) => {
    setCurrentProduct(product)
    setIsEditing(true)
    setPreviewImage(product.image_url || null) // Set preview to existing image
    setSelectedFile(null) // Clear selected file when editing
    setFormMessage("")
    setFormError(false)
  }

  const handleDelete = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Optional: Delete image from storage if it exists
        const productToDelete = products.find((p) => p.id === productId)
        if (productToDelete?.image_url) {
          // Extract the file path from the public URL
          // Assuming the public URL structure is like:
          // https://[project_ref].supabase.co/storage/v1/object/public/product-images/product_images/filename.ext
          const pathSegments = productToDelete.image_url.split("/")
          // Find the index of 'product-images' (your bucket name)
          const bucketIndex = pathSegments.indexOf("product-images")
          if (bucketIndex !== -1 && pathSegments.length > bucketIndex + 1) {
            // The path after the bucket name is the file path in storage
            const filePathInStorage = pathSegments.slice(bucketIndex + 1).join("/")
            const { error: deleteStorageError } = await supabase.storage
              .from("product-images")
              .remove([filePathInStorage])
            if (deleteStorageError) {
              console.warn("Failed to delete image from storage:", deleteStorageError.message)
              // Don't block product deletion if image deletion fails
            }
          }
        }

        const { error } = await supabase.from("products").delete().eq("id", productId)
        if (error) throw error
        setFormMessage("Product deleted successfully!")
        setFormError(false)
        fetchProducts() // Refresh product list
      } catch (error: any) {
        setFormMessage(`Error deleting product: ${error.message}`)
        setFormError(true)
        console.error("Delete product error:", error)
      }
    }
  }

  const handleCancelEdit = () => {
    setCurrentProduct(null)
    setIsEditing(false)
    setSelectedFile(null)
    setPreviewImage(null)
    setFormMessage("")
    setFormError(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Product Management Form */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              {isEditing ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              {isEditing ? "Edit Product" : "Create New Product"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Product Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={currentProduct?.name || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={currentProduct?.description || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-gray-300">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={currentProduct?.price || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: Number.parseFloat(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-300">
                    Category
                  </Label>
                  <Input
                    id="category"
                    type="text"
                    value={currentProduct?.category || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock" className="text-gray-300">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={currentProduct?.stock || 0}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, stock: Number.parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="rating" className="text-gray-300">
                    Rating (0-5)
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={currentProduct?.rating || 0}
                    onChange={(e) =>
                      setCurrentProduct({ ...currentProduct, rating: Number.parseFloat(e.target.value) })
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="imageUpload" className="text-gray-300">
                  Product Image
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-800 border-gray-700 text-white file:text-white file:bg-blue-600 file:hover:bg-blue-700 file:border-none file:rounded-md file:px-3 file:py-1 file:mr-2"
                />
                {previewImage && (
                  <div className="mt-4 relative w-32 h-32 rounded-md overflow-hidden border border-gray-700">
                    <Image
                      src={previewImage || "/placeholder.svg"}
                      alt="Product Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFreeShipping"
                  checked={currentProduct?.is_free_shipping || false}
                  onCheckedChange={(checked) =>
                    setCurrentProduct({ ...currentProduct, is_free_shipping: checked as boolean })
                  }
                />
                <Label htmlFor="isFreeShipping" className="text-gray-300 cursor-pointer">
                  Free Shipping Eligible
                </Label>
              </div>
              {formMessage && (
                <div className={`text-sm ${formError ? "text-red-400" : "text-green-400"}`}>{formMessage}</div>
              )}
              <div className="flex gap-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={uploadingImage}>
                  {uploadingImage ? (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2 animate-pulse" /> Uploading Image...
                    </>
                  ) : isEditing ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Product List */}
        <h2 className="text-2xl font-bold mb-6">Existing Products</h2>
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-gray-400">No products found. Add some using the form above!</p>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-400 text-sm">
                      ${product.price.toFixed(2)} | {product.category} | Stock: {product.stock}
                      {product.is_free_shipping && <span className="ml-2 text-green-400">(Free Shipping)</span>}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
