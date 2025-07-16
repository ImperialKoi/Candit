-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Cart items are viewable by user who owns them" ON cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON user_profiles FOR ALL USING (auth.uid() = id);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category, stock, rating) VALUES
-- Technology
('iPhone 15 Pro', 'Latest iPhone with titanium design', 999.99, '/placeholder.svg?height=300&width=300', 'Technology', 50, 4.8),
('MacBook Air M3', 'Powerful laptop with M3 chip', 1299.99, '/placeholder.svg?height=300&width=300', 'Technology', 30, 4.9),
('AirPods Pro', 'Wireless earbuds with noise cancellation', 249.99, '/placeholder.svg?height=300&width=300', 'Technology', 100, 4.7),
('iPad Pro', 'Professional tablet for creative work', 799.99, '/placeholder.svg?height=300&width=300', 'Technology', 25, 4.8),

-- Gift Cards
('Amazon Gift Card $25', 'Perfect for any occasion', 25.00, '/placeholder.svg?height=300&width=300', 'Gift Cards', 1000, 5.0),
('Amazon Gift Card $50', 'Great value gift card', 50.00, '/placeholder.svg?height=300&width=300', 'Gift Cards', 1000, 5.0),
('Amazon Gift Card $100', 'Premium gift card', 100.00, '/placeholder.svg?height=300&width=300', 'Gift Cards', 1000, 5.0),

-- Home Essentials
('Dyson V15 Vacuum', 'Powerful cordless vacuum cleaner', 649.99, '/placeholder.svg?height=300&width=300', 'Home Essentials', 20, 4.6),
('Instant Pot Duo', '7-in-1 electric pressure cooker', 89.99, '/placeholder.svg?height=300&width=300', 'Home Essentials', 75, 4.5),
('Ninja Blender', 'High-performance blender', 129.99, '/placeholder.svg?height=300&width=300', 'Home Essentials', 40, 4.4),

-- Games
('PlayStation 5', 'Next-gen gaming console', 499.99, '/placeholder.svg?height=300&width=300', 'Games', 15, 4.9),
('Xbox Series X', 'Powerful gaming console', 499.99, '/placeholder.svg?height=300&width=300', 'Games', 12, 4.8),
('Nintendo Switch OLED', 'Portable gaming system', 349.99, '/placeholder.svg?height=300&width=300', 'Games', 35, 4.7),

-- Board Games
('Settlers of Catan', 'Classic strategy board game', 49.99, '/placeholder.svg?height=300&width=300', 'Board Games', 60, 4.6),
('Ticket to Ride', 'Railway adventure board game', 44.99, '/placeholder.svg?height=300&width=300', 'Board Games', 45, 4.5),
('Azul', 'Beautiful tile-laying game', 39.99, '/placeholder.svg?height=300&width=300', 'Board Games', 30, 4.7),

-- Groceries
('Organic Bananas', 'Fresh organic bananas (2 lbs)', 3.99, '/placeholder.svg?height=300&width=300', 'Groceries', 200, 4.3),
('Whole Milk', 'Fresh whole milk (1 gallon)', 4.49, '/placeholder.svg?height=300&width=300', 'Groceries', 150, 4.2),
('Organic Eggs', 'Free-range organic eggs (12 count)', 5.99, '/placeholder.svg?height=300&width=300', 'Groceries', 80, 4.4);
