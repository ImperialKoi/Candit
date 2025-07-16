export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  rating: number
  created_at: string
  is_free_shipping?: boolean // Added new property
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
}
