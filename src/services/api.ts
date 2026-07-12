import { Product, Driver, Order, Category, Review, User, Invoice, DeliveryArea, DeliveryTrip, MembershipVoucher, UserMembership, InvoiceDetail, OrderStatusHistory, PaymentTransaction, Promotion, ProductOption, MembershipTier } from '../types';

const BASE_URL = 'https://banhcanhjava-be.onrender.com/api';

// === JWT token (Phase 3 auth) ===
const TOKEN_KEY = 'banhcanh_token';

// Shown when an admin-only backend call returns 401/403 — usually means the current session has
// no valid admin JWT (e.g. logged in via the offline mock shortcut, or the token expired).
export const ADMIN_AUTH_ERROR = 'Phiên đăng nhập không có quyền quản trị hợp lệ. Vui lòng đăng xuất và đăng nhập lại bằng tài khoản admin (khi đã kết nối máy chủ).';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Drop-in replacement for `fetch` that auto-attaches "Authorization: Bearer <token>" when a
 * token is on hand. Every backend call in this file goes through this so login/logout is the
 * only place that needs to touch the token.
 */
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  if (!token) return fetch(input, init);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${BASE_URL}${url}`;
  return url;
}

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
    imageUrl: resolveImageUrl(p.imageUrl || p.image_url || p.image || ''),
    preparationTime: Number(p.preparationTime || p.preparation_time || 10),
  };
}

function mapDriver(d: any): Driver {
  return {
    id: String(d.id),
    userId: d.userId ? Number(d.userId) : undefined,
    name: d.name || '',
    phone: d.phone || '',
    vehicle: d.vehicle || d.vehicleType || 'Xe máy',
    vehicleType: d.vehicleType || 'Xe máy',
    vehiclePlate: d.vehiclePlate || '',
    vehicleColor: d.vehicleColor || '',
    avatarUrl: d.avatarUrl || '',
    status: d.status || 'offline',
    isActive: d.isActive !== undefined ? !!d.isActive : (d.is_active !== undefined ? !!d.is_active : true),
    currentLat: d.currentLat,
    currentLng: d.currentLng,
    rating: d.rating || 5,
    totalDeliveries: d.totalDeliveries || 0,
  };
}

function mapOrder(o: any): Order {
  return {
    id: String(o.id || o.orderId || ''),
    userId: o.userId || o.user_id ? Number(o.userId || o.user_id) : undefined,
    customerName: o.customerName || o.customer_name || '',
    phone: o.phone || '',
    address: o.address || '',
    orderType: o.orderType || o.order_type || 'delivery',
    subtotal: Number(o.subtotal) || 0,
    discountAmount: Number(o.discountAmount || o.discount_amount || 0),
    shippingFee: Number(o.shippingFee || o.shipping_fee || 0),
    totalAmount: Number(o.totalAmount || o.total_amount) || 0,
    paymentMethod: (o.paymentMethod || o.payment_method || 'cod') === 'cash' ? 'cod' as const : (o.paymentMethod || o.payment_method || 'cod') as 'cod' | 'momo',
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
      const res = await apiFetch(`${BASE_URL}/products`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. PRODUCTS API
  async getProducts(): Promise<Product[]> {
    const res = await apiFetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const res = await apiFetch(`${BASE_URL}/products/category/${category}`);
    if (!res.ok) throw new Error('Không thể tải sản phẩm theo danh mục');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  // 2. ORDERS API
  async getOrders(): Promise<Order[]> {
    const res = await apiFetch(`${BASE_URL}/orders`);
    if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapOrder) : [];
  },

  async createOrder(order: any): Promise<Order> {
    const res = await apiFetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Không thể gửi đơn hàng lên cơ sở dữ liệu');
    const data = await res.json();
    return mapOrder(data);
  },

  async getOrderById(orderId: string | number): Promise<Order> {
    const res = await apiFetch(`${BASE_URL}/orders/${orderId}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết đơn hàng');
    return mapOrder(await res.json());
  },

  async getOrdersByUser(userId: string | number): Promise<Order[]> {
    const res = await apiFetch(`${BASE_URL}/orders/user/${userId}`);
    if (!res.ok) throw new Error('Không thể tải đơn hàng của bạn');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapOrder) : [];
  },

  async updateOrderStatus(orderId: string | number, status: string): Promise<Order> {
    const res = await apiFetch(`${BASE_URL}/orders/${orderId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
    const data = await res.json();
    return mapOrder(data);
  },

  async updateOrderProgress(orderId: string | number, progress: number, stage?: string): Promise<Order> {
    const params = new URLSearchParams({ progress: String(progress) });
    if (stage) params.set('stage', stage);
    const res = await apiFetch(`${BASE_URL}/orders/${orderId}/progress?${params.toString()}`, {
      method: 'PUT'
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(ADMIN_AUTH_ERROR);
      let msg = 'Không thể cập nhật tiến trình giao hàng';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    return mapOrder(data);
  },

  async assignDriverToOrder(orderId: string | number, driverId: string | number): Promise<Order> {
    const res = await apiFetch(`${BASE_URL}/orders/${orderId}/assign-driver/${driverId}`, {
      method: 'PUT'
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(ADMIN_AUTH_ERROR);
      let msg = 'Không thể điều phối shipper nhận đơn';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    return mapOrder(data);
  },

  // 3. PRODUCT CRUD (Admin)
  async createProduct(product: any): Promise<Product> {
    const res = await apiFetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Không thể tạo sản phẩm');
    const data = await res.json();
    return mapProduct(data);
  },

  async updateProduct(id: string | number, product: any): Promise<Product> {
    const res = await apiFetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Không thể cập nhật sản phẩm');
    const data = await res.json();
    return mapProduct(data);
  },

  async deleteProduct(id: string | number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Không thể xóa sản phẩm');
  },

  // 4. DRIVERS API
  async getDrivers(): Promise<Driver[]> {
    const res = await apiFetch(`${BASE_URL}/drivers`);
    if (!res.ok) throw new Error('Không thể tải danh sách tài xế');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapDriver) : [];
  },

  async registerDriver(driver: any): Promise<{ user: any; driver: Driver }> {
    const res = await apiFetch(`${BASE_URL}/drivers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver)
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = 'Không thể đăng ký tài xế';
      try { const j = JSON.parse(errText); errMsg = j.error || errMsg; } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    return { user: data.user, driver: mapDriver(data.driver) };
  },

  async createDriver(driver: any): Promise<Driver> {
    const res = await apiFetch(`${BASE_URL}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver)
    });
    if (!res.ok) throw new Error('Không thể tạo tài xế mới');
    const data = await res.json();
    return mapDriver(data);
  },

  async updateDriverStatus(driverId: string | number, status: string): Promise<Driver> {
    const res = await apiFetch(`${BASE_URL}/drivers/${driverId}/status?status=${status}`, {
      method: 'PUT'
    });
    if (!res.ok) {
      let msg = 'Không thể cập nhật trạng thái tài xế';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    return mapDriver(data);
  },

  // 5. USERS & STATS API
  async getUsers(): Promise<User[]> {
    const res = await apiFetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
    return res.json();
  },

  async getStats(): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/orders/stats`);
    if (!res.ok) return { totalOrders: 0, totalRevenue: 0 };
    return res.json();
  },

  // 6. AUTH API
  async register(user: any): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/auth/register`, {
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
    const res = await apiFetch(`${BASE_URL}/auth/login`, {
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

  // 7. FORGOT PASSWORD API
  async forgotPassword(email: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    }
    return res.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Không thể đặt lại mật khẩu');
    }
    return res.json();
  },

  // 8. CATEGORIES API
  async getCategories(): Promise<Category[]> {
    const res = await apiFetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Không thể tải danh mục');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapCategory) : [];
  },

  async createCategory(data: { name: string; slug: string }): Promise<Category> {
    const res = await apiFetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể tạo danh mục');
    return mapCategory(await res.json());
  },

  async updateCategory(id: number, data: { name?: string; slug?: string }): Promise<Category> {
    const res = await apiFetch(`${BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật danh mục');
    return mapCategory(await res.json());
  },

  async deleteCategory(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa danh mục');
  },

  // 8. REVIEWS API
  async getReviews(): Promise<Review[]> {
    const res = await apiFetch(`${BASE_URL}/reviews`);
    if (!res.ok) throw new Error('Không thể tải đánh giá');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapReview) : [];
  },

  async createReview(review: any): Promise<Review> {
    const res = await apiFetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error('Không thể gửi đánh giá');
    const data = await res.json();
    return mapReview(data);
  },

  async updateReview(id: string, data: any): Promise<Review> {
    const res = await apiFetch(`${BASE_URL}/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật đánh giá');
    const json = await res.json();
    return mapReview(json);
  },

  async deleteReview(id: string): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/reviews/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa đánh giá');
  },

  // 9. USER PROFILE API
  async getUser(id: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}`);
    if (!res.ok) throw new Error('Không thể tải thông tin người dùng');
    return res.json();
  },

  async updateUser(id: string, data: { fullName?: string; phone?: string; address?: string; email?: string }): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật thông tin');
    return res.json();
  },

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Không thể đổi mật khẩu');
    }
    return res.json();
  },

  // 10. IMAGE UPLOAD (Railway Bucket / S3 Storage)
  async uploadImage(file: File, folder: string, entityId?: string, entityName?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (entityId) formData.append('id', entityId);
    if (entityName) formData.append('name', entityName);
    const res = await apiFetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      let errMsg = 'Không thể tải ảnh lên';
      try {
        const errData = await res.json();
        if (errData.error) errMsg = errData.error;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    return resolveImageUrl(data.url);
  },

  // 10. MOMO PAYMENT API
  async createMoMoPayment(orderId: number, amount: number, orderInfo?: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/payments/momo/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, orderInfo: orderInfo || 'Thanh toan don hang' })
    });
    if (!res.ok) throw new Error('Không thể tạo yêu cầu thanh toán MoMo');
    return res.json();
  },

  async getMoMoPaymentStatus(orderId: number): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/payments/momo/status/${orderId}`);
    if (!res.ok) return { status: 'not_found' };
    return res.json();
  },

  async createPaymentTransaction(data: any): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể tạo giao dịch thanh toán');
    return res.json();
  },

  // 11. RBAC API
  async getRoles(): Promise<any[]> {
    const res = await apiFetch(`${BASE_URL}/roles`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getPermissions(): Promise<any[]> {
    const res = await apiFetch(`${BASE_URL}/permissions`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await apiFetch(`${BASE_URL}/role-permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissionId })
    });
  },

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await apiFetch(`${BASE_URL}/role-permissions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissionId })
    });
  },

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await apiFetch(`${BASE_URL}/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId })
    });
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await apiFetch(`${BASE_URL}/users/${userId}/roles/${roleId}`, {
      method: 'DELETE'
    });
  },

  async getUserRoles(userId: number): Promise<any[]> {
    const res = await apiFetch(`${BASE_URL}/users/${userId}/roles`);
    if (!res.ok) return [];
    return res.json();
  },

  async createRole(role: any): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role)
    });
    if (!res.ok) throw new Error('Không thể tạo vai trò');
    return res.json();
  },

  async updateRole(id: number, role: any): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role)
    });
    if (!res.ok) throw new Error('Không thể cập nhật vai trò');
    return res.json();
  },

  async deleteRole(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/roles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xoá vai trò');
  },

  async getRolePermissions(roleId: number): Promise<any[]> {
    const res = await apiFetch(`${BASE_URL}/roles/${roleId}/permissions`);
    if (!res.ok) return [];
    return res.json();
  },

  // 11. INVOICES API
  async getInvoices(): Promise<Invoice[]> {
    const res = await apiFetch(`${BASE_URL}/invoices`);
    if (!res.ok) throw new Error('Không thể tải hóa đơn');
    return res.json();
  },

  async createInvoice(orderId: number): Promise<Invoice> {
    const res = await apiFetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    if (!res.ok) throw new Error('Không thể tạo hóa đơn');
    return res.json();
  },

  async cancelInvoice(id: number): Promise<Invoice> {
    const res = await apiFetch(`${BASE_URL}/invoices/${id}/cancel`, { method: 'PUT' });
    if (!res.ok) throw new Error('Không thể hủy hóa đơn');
    return res.json();
  },

  // 12. DELIVERY AREAS API
  async getDeliveryAreas(): Promise<DeliveryArea[]> {
    const res = await apiFetch(`${BASE_URL}/delivery-areas`);
    if (!res.ok) throw new Error('Không thể tải khu vực giao hàng');
    return res.json();
  },

  async createDeliveryArea(area: Partial<DeliveryArea>): Promise<DeliveryArea> {
    const res = await apiFetch(`${BASE_URL}/delivery-areas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area)
    });
    if (!res.ok) throw new Error('Không thể tạo khu vực giao hàng');
    return res.json();
  },

  async updateDeliveryArea(id: number, area: Partial<DeliveryArea>): Promise<DeliveryArea> {
    const res = await apiFetch(`${BASE_URL}/delivery-areas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area)
    });
    if (!res.ok) throw new Error('Không thể cập nhật khu vực giao hàng');
    return res.json();
  },

  async deleteDeliveryArea(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/delivery-areas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa khu vực giao hàng');
  },

  // 13. DELIVERY TRIPS API
  async getDeliveryTrips(): Promise<DeliveryTrip[]> {
    const res = await apiFetch(`${BASE_URL}/delivery-trips`);
    if (!res.ok) throw new Error('Không thể tải chuyến giao hàng');
    return res.json();
  },

  async getDeliveryTripsByDriver(driverId: number): Promise<DeliveryTrip[]> {
    const res = await apiFetch(`${BASE_URL}/delivery-trips/driver/${driverId}`);
    if (!res.ok) throw new Error('Không thể tải chuyến giao của tài xế');
    return res.json();
  },

  async getDeliveryTripsByOrder(orderId: number): Promise<DeliveryTrip[]> {
    const res = await apiFetch(`${BASE_URL}/delivery-trips/order/${orderId}`);
    if (!res.ok) throw new Error('Không thể tải chuyến giao của đơn hàng');
    return res.json();
  },

  async createDeliveryTrip(orderId: number, driverId: number): Promise<DeliveryTrip> {
    const res = await apiFetch(`${BASE_URL}/delivery-trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, driverId })
    });
    if (!res.ok) throw new Error('Không thể tạo chuyến giao hàng');
    return res.json();
  },

  async updateDeliveryTripStatus(id: number, status: string, lat?: number, lng?: number): Promise<DeliveryTrip> {
    let url = `${BASE_URL}/delivery-trips/${id}/status?status=${status}`;
    if (lat !== undefined && lng !== undefined) url += `&lat=${lat}&lng=${lng}`;
    const res = await apiFetch(url, { method: 'PUT' });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái chuyến giao');
    return res.json();
  },

  async updateDeliveryTripLocation(id: number, lat: number, lng: number): Promise<DeliveryTrip> {
    const res = await apiFetch(`${BASE_URL}/delivery-trips/${id}/location?lat=${lat}&lng=${lng}`, { method: 'PUT' });
    if (!res.ok) throw new Error('Không thể cập nhật vị trí');
    return res.json();
  },

  // 14. MEMBERSHIPS API
  async getMembership(userId: number): Promise<UserMembership | null> {
    const res = await apiFetch(`${BASE_URL}/memberships/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  },

  async createOrUpdateMembership(userId: number, data: { tierId: number; currentPoints?: number; totalOrders?: number }): Promise<UserMembership> {
    const res = await apiFetch(`${BASE_URL}/memberships/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật thành viên');
    return res.json();
  },

  async getVouchers(userId: number): Promise<MembershipVoucher[]> {
    const res = await apiFetch(`${BASE_URL}/memberships/${userId}/vouchers`);
    if (!res.ok) throw new Error('Không thể tải voucher');
    return res.json();
  },

  async claimVoucher(userId: number, tierId: number): Promise<MembershipVoucher> {
    const res = await apiFetch(`${BASE_URL}/memberships/${userId}/vouchers/claim?tierId=${tierId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Không thể nhận voucher');
    return res.json();
  },

  async useVoucher(voucherId: number): Promise<MembershipVoucher> {
    const res = await apiFetch(`${BASE_URL}/memberships/vouchers/${voucherId}/use`, { method: 'PUT' });
    if (!res.ok) throw new Error('Không thể sử dụng voucher');
    return res.json();
  },

  // --- Admin Membership ---
  async getAllMemberships(): Promise<UserMembership[]> {
    const res = await apiFetch(`${BASE_URL}/memberships/admin/all`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAllVouchers(tierId?: number): Promise<MembershipVoucher[]> {
    const url = tierId ? `${BASE_URL}/memberships/admin/vouchers?tierId=${tierId}` : `${BASE_URL}/memberships/admin/vouchers`;
    const res = await apiFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async adminCreateVoucher(data: { userId: number; tierId: number; discountPercent?: number; maxDiscount?: number; minOrderAmount?: number }): Promise<MembershipVoucher> {
    const res = await apiFetch(`${BASE_URL}/memberships/admin/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể tạo voucher');
    return res.json();
  },

  async adminCreateVouchersBatch(data: { userIds: number[]; tierId: number; discountPercent?: number; maxDiscount?: number; minOrderAmount?: number; code?: string; status?: string; expiresAt?: string }): Promise<{ created: number }> {
    const res = await apiFetch(`${BASE_URL}/memberships/admin/vouchers/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể tạo voucher hàng loạt');
    return res.json();
  },

  // 15. ORDER HISTORY API
  async getOrderHistory(orderId: number): Promise<OrderStatusHistory[]> {
    const res = await apiFetch(`${BASE_URL}/order-history/order/${orderId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 16. PAYMENT TRANSACTIONS API
  async getPaymentTransactions(orderId: number): Promise<PaymentTransaction[]> {
    const res = await apiFetch(`${BASE_URL}/payments/order/${orderId}`);
    if (!res.ok) return [];
    return res.json();
  },

  // 17. INVOICE DETAILS API
  async getInvoiceDetails(invoiceId: number): Promise<InvoiceDetail[]> {
    const res = await apiFetch(`${BASE_URL}/invoice-details/invoice/${invoiceId}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết hóa đơn');
    return res.json();
  },

  async createInvoiceDetail(detail: Partial<InvoiceDetail>): Promise<InvoiceDetail> {
    const res = await apiFetch(`${BASE_URL}/invoice-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detail)
    });
    if (!res.ok) throw new Error('Không thể tạo chi tiết hóa đơn');
    return res.json();
  },

  // 18. DRIVER EXTENDED API
  async getDriver(id: number): Promise<Driver> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}`);
    if (!res.ok) throw new Error('Không thể tải thông tin tài xế');
    return res.json();
  },

  async deleteDriver(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa tài xế');
  },

  async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể cập nhật tài xế');
    return res.json();
  },

  async updateDriverLocation(id: number, lat: number, lng: number): Promise<Driver> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}/location?lat=${lat}&lng=${lng}`, { method: 'PUT' });
    if (!res.ok) throw new Error('Không thể cập nhật vị trí tài xế');
    return res.json();
  },

  async getDriverStats(id: number): Promise<{ totalTrips: number; activeTrips: number; completedTrips: number; totalEarnings: number; rating: number }> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}/stats`);
    if (!res.ok) return { totalTrips: 0, activeTrips: 0, completedTrips: 0, totalEarnings: 0, rating: 5 };
    return res.json();
  },

  async getDriverTrips(id: number): Promise<DeliveryTrip[]> {
    const res = await apiFetch(`${BASE_URL}/drivers/${id}/trips`);
    if (!res.ok) throw new Error('Không thể tải chuyến giao của tài xế');
    return res.json();
  },

  // 19. PROMOTIONS API
  async getPromotions(): Promise<Promotion[]> {
    const res = await apiFetch(`${BASE_URL}/promotions`);
    if (!res.ok) throw new Error('Không thể tải khuyến mãi');
    return res.json();
  },

  async createPromotion(promo: any): Promise<Promotion> {
    const res = await apiFetch(`${BASE_URL}/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo)
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      let msg = 'Không thể tạo khuyến mãi';
      try { const j = JSON.parse(errBody); if (j.error) msg = j.error; } catch {}
      msg += ' (' + res.status + ')';
      throw new Error(msg);
    }
    return res.json();
  },

  async updatePromotion(id: number, promo: any): Promise<Promotion> {
    const res = await apiFetch(`${BASE_URL}/promotions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo)
    });
    if (!res.ok) throw new Error('Không thể cập nhật khuyến mãi');
    return res.json();
  },

  async deletePromotion(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/promotions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa khuyến mãi');
  },

  async validatePromotion(code: string, orderAmount: number): Promise<{ valid: boolean; promo?: Promotion; error?: string }> {
    const res = await apiFetch(`${BASE_URL}/promotions/${encodeURIComponent(code)}/validate?orderAmount=${orderAmount}`);
    const data = await res.json();
    return data;
  },

  // 20. PRODUCT OPTIONS (TOPPINGS) API
  async getProductOptions(): Promise<ProductOption[]> {
    const res = await apiFetch(`${BASE_URL}/product-options`);
    if (!res.ok) throw new Error('Không thể tải tuỳ chọn sản phẩm');
    return res.json();
  },

  async createProductOption(opt: any): Promise<ProductOption> {
    const res = await apiFetch(`${BASE_URL}/product-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opt)
    });
    if (!res.ok) throw new Error('Không thể tạo tuỳ chọn');
    return res.json();
  },

  async updateProductOption(id: number, opt: any): Promise<ProductOption> {
    const res = await apiFetch(`${BASE_URL}/product-options/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opt)
    });
    if (!res.ok) throw new Error('Không thể cập nhật tuỳ chọn');
    return res.json();
  },

  async deleteProductOption(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/product-options/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa tuỳ chọn');
  },

  // 21. MEMBERSHIP TIERS API
  async getMembershipTiers(): Promise<MembershipTier[]> {
    const res = await apiFetch(`${BASE_URL}/membership-tiers`);
    if (!res.ok) throw new Error('Không thể tải hạng thành viên');
    return res.json();
  },

  async createMembershipTier(tier: any): Promise<MembershipTier> {
    const res = await apiFetch(`${BASE_URL}/membership-tiers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tier)
    });
    if (!res.ok) throw new Error('Không thể tạo hạng thành viên');
    return res.json();
  },

  async updateMembershipTier(id: number, tier: any): Promise<MembershipTier> {
    const res = await apiFetch(`${BASE_URL}/membership-tiers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tier)
    });
    if (!res.ok) throw new Error('Không thể cập nhật hạng thành viên');
    return res.json();
  },

  async deleteMembershipTier(id: number): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/membership-tiers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa hạng thành viên');
  },

  // === Admin User Operations ===

  async adminDeleteUser(id: number): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xoá tài khoản');
    return res.json();
  },

  async adminChangeUserRole(id: number, role: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Không thể đổi vai trò');
    return res.json();
  },

  async adminToggleUserActive(id: number): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}/toggle-active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Không thể thay đổi trạng thái');
    return res.json();
  },

  async adminResetUserPassword(id: number, newPassword: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/users/${id}/admin-reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) throw new Error('Không thể đặt lại mật khẩu');
    return res.json();
  },
};

// === Image Service (Presigned URLs from Supabase Storage / T3 Storage) ===
const presignedCache = new Map<string, string>();

const S3_FOLDERS = ['product_Image', 'avatar_Image', 'review_Image', 'category_Image', 'payment_Image'];

function extractS3Key(imageUrl: string): string | null {
  if (!imageUrl) return null;

  // Plain key: "product_Image/slug/uuid.jpg" — no protocol
  if (!imageUrl.includes('://')) {
    if (S3_FOLDERS.some(f => imageUrl.startsWith(f + '/'))) return imageUrl;
    return null;
  }

  try {
    const url = new URL(imageUrl);
    let key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

    // Strip the storage API's own path prefix first — our backend's S3 endpoint is
    // itself mounted at /storage/v1/s3, so presigned URLs look like
    // .../storage/v1/s3/<bucket>/<key>, not just /<bucket>/<key>.
    // Also handles Supabase's REST-style object URLs and T3 path-style URLs.
    const pathPrefixes = ['storage/v1/s3/', 'storage/v1/object/public/', 'storage/v1/object/authenticated/', 'object/public/', 'object/authenticated/'];
    for (const prefix of pathPrefixes) {
      if (key.startsWith(prefix)) { key = key.slice(prefix.length); break; }
    }

    // Virtual-hosted style (https://<bucket>.t3.storageapi.dev/<key>) has no bucket segment
    // in the path at all, so this strip is a no-op there — safe either way.
    const bucketNames = ['Image', 'collapsible-burrito-tvsjvu'];
    for (const b of bucketNames) {
      if (key.startsWith(b + '/')) {
        key = key.slice(b.length + 1);
        break;
      }
    }

    return key || null;
  } catch {
    return null;
  }
}

function needsPresign(url: string): boolean {
  if (!url) return false;
  if (url.includes('storageapi.dev')) return true;
  if (url.includes('storage.supabase.co')) return true;
  if (S3_FOLDERS.some(f => url.startsWith(f + '/'))) return true;
  return false;
}

export const ImageService = {
  async getPresignedUrl(imageUrl: string): Promise<string> {
    if (!imageUrl) return '';
    if (!needsPresign(imageUrl)) return imageUrl;
    if (presignedCache.has(imageUrl)) return presignedCache.get(imageUrl)!;
    const key = extractS3Key(imageUrl);
    if (!key) return imageUrl;
    try {
      const res = await apiFetch(`${BASE_URL}/upload/presigned?key=${encodeURIComponent(key)}&expireHours=24`);
      if (!res.ok) return imageUrl;
      const data = await res.json();
      const signed = data.url || imageUrl;
      presignedCache.set(imageUrl, signed);
      return signed;
    } catch {
      return imageUrl;
    }
  },

  async getPresignedUrlsBatch(imageUrls: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const uncached: { url: string; key: string }[] = [];
    for (const u of imageUrls) {
      if (!needsPresign(u)) { result.set(u, u); continue; }
      if (presignedCache.has(u)) { result.set(u, presignedCache.get(u)!); continue; }
      const key = extractS3Key(u);
      if (key) uncached.push({ url: u, key });
      else result.set(u, u);
    }
    await Promise.all(uncached.map(async ({ url, key }) => {
      try {
        const res = await apiFetch(`${BASE_URL}/upload/presigned?key=${encodeURIComponent(key)}&expireHours=24`);
        if (res.ok) {
          const data = await res.json();
          const signed = data.url || url;
          presignedCache.set(url, signed);
          result.set(url, signed);
        } else {
          result.set(url, url);
        }
      } catch { result.set(url, url); }
    }));
    return result;
  },
};
