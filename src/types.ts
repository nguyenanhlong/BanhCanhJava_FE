export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Bánh Canh Cá Lóc', slug: 'banh-canh-ca-loc', displayOrder: 1, isActive: true },
  { id: 2, name: 'Đồ Ăn Kèm', slug: 'do-an-kem', displayOrder: 2, isActive: true },
  { id: 3, name: 'Đồ Uống', slug: 'do-uong', displayOrder: 3, isActive: true },
  { id: 4, name: 'Tráng Miệng', slug: 'trang-mieng', displayOrder: 4, isActive: true },
  { id: 5, name: 'Combo', slug: 'combo', displayOrder: 5, isActive: true },
];

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId?: number;
  categoryName?: string;
  isBestSeller: boolean;
  isAvailable: boolean;
  imageUrl: string;
  preparationTime: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  noodleType?: 'Bột gạo' | 'Bột lọc';
  notes?: string;
  toppings?: Product[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'admin' | 'super_admin';
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export interface OrderItem {
  productId?: number;
  productName: string;
  quantity: number;
  price: number;
  optionsText?: string;
  noodleType?: string;
  notes?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  userId?: number;
  customerName: string;
  phone: string;
  address: string;
  tableId?: number;
  orderType: 'delivery' | 'dine-in' | 'takeaway';
  subtotal: number;
  discountId?: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'momo';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  status: OrderStatus;
  driverId?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  deliveryProgress?: number;
  deliveryStage?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  isActive: boolean;
}

export interface DiningTable {
  id: number;
  tableNumber: string;
  capacity: number;
  position?: string;
  status: 'available' | 'occupied' | 'reserved';
  isActive: boolean;
}

export interface Material {
  id: number;
  name: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  unitPrice: number;
  supplier?: string;
  isActive: boolean;
}

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ProductOption {
  id: number;
  productId: number;
  name: string;
  optionGroup: 'topping' | 'size' | 'spice_level';
  price: number;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  oldStatus?: string;
  newStatus: string;
  changedBy?: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: number;
  orderId: number;
  transactionCode?: string;
  paymentMethod: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  gateway?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId?: number;
  productId?: number;
  orderId?: string;
  productName?: string;
  customerName?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  isApproved: boolean;
  adminReply?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface ProductReview {
  id: string;
  orderId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
