// ============================================
// Enums
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
export type UserRole = 'admin' | 'farmer';

// ============================================
// Base Types
// ============================================

export interface Farmer {
  id: number;
  name: string;
  bio: string | null;
  location: string;
  profile_pic: string | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  stock_qty: number;
  is_organic: boolean;
  image_url: string | null;
  farmer_id: number;
  farmer?: Farmer;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  is_harvested: boolean;
  product?: Product;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  address: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
  delivery_date: string | null;
  items: OrderItem[];
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  farmer_id: number | null;
}

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  unit: string;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  detail?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  email: string;
}

// ============================================
// Form Types
// ============================================

export interface OrderCreateRequest {
  customer_name: string;
  customer_email: string;
  address: string;
  total_price: number;
  items: {
    product_id: number;
    quantity: number;
    price: number;
  }[];
}

export interface ProductUpsertRequest {
  id?: number;
  name: string;
  price: number;
  stock_qty: number;
  unit: string;
  farmer_id: number;
  file?: File;
}

export interface FarmerCreateRequest {
  name: string;
  email: string;
  password: string;
  location: string;
  bio: string;
  file?: File;
}
