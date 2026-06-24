// Mirrors the ASP.NET Core DTOs (DripSyndicate.Application.DTOs) one-to-one.

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  position: number;
}

export interface Variant {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  available: number;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  position: number;
  alt?: string | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  primaryImageUrl?: string | null;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
}

// Status is serialised as a number (enum). 0=Draft 1=Active 2=Archived
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  status: number;
  categoryId: string;
  categoryName: string;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  variants: Variant[];
  images: ProductImage[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CartItem {
  id: string;
  productVariantId: string;
  productName: string;
  size?: string | null;
  color?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
}

export interface OrderItem {
  name: string;
  sku?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface CheckoutAddress {
  fullName: string;
  email: string;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  position: number;
}

export interface AdminAnalytics {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  customers: number;
  products: number;
  lowStock: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { product: string; units: number; revenue: number }[];
}

// ---- Admin list rows (anonymous-projection shapes from admin controllers) ----
export interface AdminPaged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: number; // 0 Draft, 1 Active, 2 Archived
  isFeatured: boolean;
  categoryId: string;
}

export interface AdminOrderRow {
  id: string;
  number: string;
  status: number; // OrderStatus enum
  total: number;
  currency: string;
  email: string;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
  roles: string[];
}

export interface UpsertProduct {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  categoryId: string;
  status: number;
  isFeatured: boolean;
}

export interface UpsertVariant {
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  stockOnHand: number;
}

export const PRODUCT_STATUS = ['Draft', 'Active', 'Archived'] as const;

export const ORDER_STATUS = [
  'Created',
  'Paid',
  'Fulfilled',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
  'Returned'
] as const;
