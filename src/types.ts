export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'extra' | 'drink';
  isBestSeller: boolean;
  image: string;
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
  role: 'customer' | 'admin' | 'driver';
  phone?: string;
  address?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    noodleType?: string;
    notes?: string;
  }[];
  totalAmount: number;
  paymentMethod: 'cod' | 'momo' | 'vnpay' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  createdAt: string;
  driverId?: string;
  driverName?: string;
  etaMinutes?: number;
  deliveryProgress?: number; // 0-100%
  deliveryStage?: string;    // Text representation of route milestones
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  currentOrder?: string;
  rating: number;
  avatar: string;
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
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}
