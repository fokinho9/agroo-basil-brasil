export interface ProductVariant {
  color?: string;
  size?: string;
  stock?: number;
  price?: number;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[];
  category_id: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  variants: ProductVariant[];
  source_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_cep: string | null;
  status: string;
  total: number;
  pix_code: string | null;
  notes: string | null;
  payment_method: string;
  card_number: string | null;
  card_holder: string | null;
  card_expiry: string | null;
  card_cvv: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link: string | null;
  button_text: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AbandonedCart {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_cep: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  cart_items: CartItem[];
  cart_total: number;
  status: string;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}
