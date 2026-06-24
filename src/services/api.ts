import { Product, Driver, Order, Category, Review, User } from '../types';

const BASE_URL = 'https://banhcanhjavabe-production.up.railway.app/api';

function mapProduct(p: any): Product {
  return {
    id: String(p.id),
    name: p.name || '',
    description: p.description || '',
    price: Number(p.price) || 0,
    categoryId: p.categoryId || p.category_id || undefined,
    categoryName: p.categoryName || p.category_name || undefined,
    isBestSeller: !!p.isBestSeller || !!p.is_best_seller,
    isAvailable: p.isAvailable !== undefined ? !!p.isAvailable : (p.is_available !== undefined ? !!p.is_available : true),
    imageUrl: p.imageUrl || p.image_url || p.image || '',
    preparationTime: Number(p.preparationTime || p.preparation_time || 10),
  };
}

function mapDriver(d: any): Driver {
  return {
    id: String(d.id),
    name: d.name || '',
    phone: d.phone || '',
    vehicle: d.vehicle || '',
    status: d.status || 'available',
    isActive: d.isActive !== undefined ? !!d.isActive : (d.is_active !== undefined ? !!d.is_active : true),
  };
}

function mapOrder(o: any): Order {
  return {
    id: String(o.id || o.orderId || ''),
    customerName: o.customerName || o.customer_name || '',
    phone: o.phone || '',
    address: o.address || '',
    orderType: o.orderType || o.order_type || 'delivery',
    subtotal: Number(o.subtotal) || 0,
    discountAmount: Number(o.discountAmount || o.discount_amount || 0),
    shippingFee: Number(o.shippingFee || o.shipping_fee || 0),
    totalAmount: Number(o.totalAmount || o.total_amount) || 0,
    paymentMethod: o.paymentMethod || o.payment_method || 'cash',
    paymentStatus: o.paymentStatus || o.payment_status || 'pending',
    status: o.status || 'pending',
    driverId: o.driverId || o.driver_id ? String(o.driverId || o.driver_id) : undefined,
    notes: o.notes || undefined,
    createdAt: o.createdAt || o.created_at || new Date().toISOString(),
    deliveryProgress: Number(o.deliveryProgress) || 0,
    deliveryStage: o.deliveryStage || undefined,
    items: Array.isArray(o.items) ? o.items.map((it: any) => ({
      productId: it.productId || it.product_id ? Number(it.productId || it.product_id) : undefined,
      productName: it.productName || it.product_name || it.name || '',
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      optionsText: it.optionsText || it.options_text || undefined,
      noodleType: it.noodleType || it.noodle_type || undefined,
      notes: it.notes || undefined,
      subtotal: Number(it.subtotal) || 0,
    })) : [],
  };
}

function mapCategory(c: any): Category {
  return {
    id: Number(c.id),
    name: c.name || '',
    slug: c.slug || '',
    description: c.description || undefined,
    imageUrl: c.imageUrl || c.image_url || undefined,
    displayOrder: Number(c.displayOrder || c.display_order || 0),
    isActive: c.isActive !== undefined ? !!c.isActive : (c.is_active !== undefined ? !!c.is_active : true),
  };
}

function mapReview(r: any): Review {
  return {
    id: String(r.id),
    userId: r.userId || r.user_id ? Number(r.userId || r.user_id) : undefined,
    productId: r.productId || r.product_id ? Number(r.productId || r.product_id) : undefined,
    orderId: r.orderId ? String(r.orderId) : undefined,
    customerName: r.customerName || r.customer_name || '',
    productName: r.productName || r.product_name || '',
    rating: Number(r.rating) || 5,
    comment: r.comment || '',
    imageUrl: r.imageUrl || r.image_url || undefined,
    isApproved: !!r.isApproved || !!r.is_approved,
    adminReply: r.adminReply || r.admin_reply || undefined,
    createdAt: r.createdAt || r.created_at || new Date().toISOString(),
  };
}

export const ApiService = {
  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
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
    const res = await fetch(`${BASE_URL}/orders/${orderId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
    const data = await res.json();
    return mapOrder(data);
  },

  async assignDriverToOrder(orderId: string | number, driverId: string | number): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/assign-driver/${driverId}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể điều phối shipper nhận đơn');
    const data = await res.json();
    return mapOrder(data);
  },

  // 3. PRODUCT CRUD (Admin)
  async createProduct(product: any): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Không thể tạo sản phẩm');
    const data = await res.json();
    return mapProduct(data);
  },

  async updateProduct(id: string | number, product: any): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Không thể cập nhật sản phẩm');
    const data = await res.json();
    return mapProduct(data);
  },

  async deleteProduct(id: string | number): Promise<void> {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Không thể xóa sản phẩm');
  },

  // 4. DRIVERS API
  async getDrivers(): Promise<Driver[]> {
    const res = await fetch(`${BASE_URL}/drivers`);
    if (!res.ok) throw new Error('Không thể tải danh sách tài xế');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapDriver) : [];
  },

  async createDriver(driver: any): Promise<Driver> {
    const res = await fetch(`${BASE_URL}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver)
    });
    if (!res.ok) throw new Error('Không thể tạo tài xế mới');
    const data = await res.json();
    return mapDriver(data);
  },

  async updateDriverStatus(driverId: string | number, status: string): Promise<Driver> {
    const res = await fetch(`${BASE_URL}/drivers/${driverId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái tài xế');
    const data = await res.json();
    return mapDriver(data);
  },

  // 5. USERS & STATS API
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
    return res.json();
  },

  async getStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/orders/stats`);
    if (!res.ok) return { totalOrders: 0, totalRevenue: 0 };
    return res.json();
  },

  // 6. AUTH API
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
  },

  // 7. CATEGORIES API
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Không thể tải danh mục');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapCategory) : [];
  },

  // 8. REVIEWS API
  async getReviews(): Promise<Review[]> {
    const res = await fetch(`${BASE_URL}/reviews`);
    if (!res.ok) throw new Error('Không thể tải đánh giá');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapReview) : [];
  },

  // 9. IMAGE UPLOAD (Railway Bucket)
  async uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Không thể tải ảnh lên');
    const data = await res.json();
    return data.url;
  },

  // 10. RBAC API
  async getRoles(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/roles`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getPermissions(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/permissions`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await fetch(`${BASE_URL}/role-permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissionId })
    });
  },

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await fetch(`${BASE_URL}/role-permissions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissionId })
    });
  },

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await fetch(`${BASE_URL}/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId })
    });
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await fetch(`${BASE_URL}/users/${userId}/roles/${roleId}`, {
      method: 'DELETE'
    });
  },

  async getUserRoles(userId: number): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/users/${userId}/roles`);
    if (!res.ok) return [];
    return res.json();
  },

  async getRolePermissions(roleId: number): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/roles/${roleId}/permissions`);
    if (!res.ok) return [];
    return res.json();
  },
};
