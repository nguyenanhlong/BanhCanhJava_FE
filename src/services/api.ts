// ===================================================================
// FRONTEND API SERVICE FOR SPRING BOOT BACKEND (React -> Spring Boot)
// ===================================================================

import { Product, Driver, Order } from '../types';

const BASE_URL = 'https://banhcanhjavabe-production.up.railway.app/api';

// Map backend Product (imageUrl, etc.) to frontend Product (image, etc.)
function mapProduct(p: any): Product {
  return {
    id: String(p.id),
    name: p.name || '',
    description: p.description || '',
    price: Number(p.price) || 0,
    category: p.category || 'main',
    isBestSeller: !!p.isBestSeller,
    image: p.image || p.imageUrl || '🍲'
  };
}

// Map backend Driver (vehicle, rating, etc.) to frontend Driver
function mapDriver(d: any): Driver {
  return {
    id: String(d.id),
    name: d.name || '',
    phone: d.phone || '',
    vehicle: d.vehicle || '',
    status: d.status || 'available',
    currentOrder: d.currentOrder || undefined,
    rating: Number(d.rating) || 5.0,
    avatar: d.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
  };
}

// Map backend Order to frontend Order structure
function mapOrder(o: any): Order {
  return {
    id: String(o.id || o.orderId || ''),
    customerName: o.customerName || '',
    phone: o.phone || '',
    address: o.address || '',
    totalAmount: Number(o.totalAmount) || 0,
    paymentMethod: o.paymentMethod || 'cod',
    paymentStatus: o.paymentStatus || 'pending',
    status: o.status || 'pending',
    createdAt: o.createdAt || new Date().toISOString(),
    driverId: o.driverId ? String(o.driverId) : undefined,
    driverName: o.driverName || undefined,
    deliveryProgress: Number(o.deliveryProgress) || 0,
    deliveryStage: o.deliveryStage || undefined,
    items: Array.isArray(o.items) ? o.items.map((it: any) => ({
      productName: it.productName || it.name || '',
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      noodleType: it.noodleType || undefined,
      notes: it.notes || undefined
    })) : []
  };
}

export const ApiService = {
  // Test connection to Spring Boot
  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Quick ping check
      const res = await fetch(`${BASE_URL}/products`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. PRODUCTS API
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/products/category/${category}`);
    if (!res.ok) throw new Error('Không thể tải sản phẩm theo danh mục');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  // 2. ORDERS API
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/orders`);
    if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapOrder) : [];
  },

  async createOrder(order: any): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Không thể gửi đơn hàng lên cơ sở dữ liệu');
    const data = await res.json();
    return mapOrder(data);
  },

  async updateOrderStatus(orderId: string | number, status: string): Promise<Order> {
    // Standard URL query param pattern: /orders/{id}/status?status=preparing
    const res = await fetch(`${BASE_URL}/orders/${orderId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
    const data = await res.json();
    return mapOrder(data);
  },

  async assignDriverToOrder(orderId: string | number, driverId: string | number): Promise<Order> {
    // Standard URL pattern: /orders/{id}/assign-driver/{driverId}
    const res = await fetch(`${BASE_URL}/orders/${orderId}/assign-driver/${driverId}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể điều phối shipper nhận đơn');
    const data = await res.json();
    return mapOrder(data);
  },

  // 3. DRIVERS API
  async getDrivers(): Promise<Driver[]> {
    const res = await fetch(`${BASE_URL}/drivers`);
    if (!res.ok) throw new Error('Không thể tải bưu tá lội bộ');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapDriver) : [];
  },

  // 4. AUTH API
  async register(user: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Đăng ký tài khoản thất bại');
    }
    return res.json();
  },

  async login(credentials: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Tên đăng nhập hoặc mật khẩu sai');
    }
    return res.json();
  }
};
