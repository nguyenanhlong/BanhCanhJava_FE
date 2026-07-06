import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Order, Driver, OrderStatus, Product, MembershipTier, MembershipVoucher, UserMembership, DeliveryTrip, PaymentTransaction } from '../types';
import { JAVA_BACKEND_FILES, MYSQL_DATABASE_SQL, FRONTEND_INTEGRATION_FILES } from '../data';
import { FileCode, Check, Copy, AlertTriangle, Plus, Edit3, Trash2, X, FileText, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';

function toSlug(str: string): string {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface AdminDashboardProps {
  orders: Order[];
  drivers: Driver[];
  products: Product[];
  isBackendConnected: boolean;
  userRole?: string;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignDriver: (orderId: string, driverId: string) => void;
  onCreateDriver: (name: string, phone: string, vehicle: string) => void;
  onUpdateDriverStatus: (driverId: string, status: Driver['status']) => void;
  onUpdateOrderProgress?: (orderId: string, progress: number, stage: string) => void;
  onCreateProduct?: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (id: string, product: Omit<Product, 'id'>) => void;
  onDeleteProduct?: (id: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error', title?: string) => void;
}

interface ToppingItem { id: number; productId: number; name: string; optionGroup: string; price: number; isRequired: boolean; isActive: boolean; displayOrder: number; productName?: string; }
interface MaterialItem { id: number; name: string; unit: string; stock: number; min: number; price: number; }
interface TableItem { id: number; number: string; capacity: number; position: string; }
interface PromoItem { id: number; code: string; name: string; description?: string; discount_type: string; discount_value: number; min_order_amount: number; max_discount?: number; usage_limit?: number; used_count?: number; start_date?: string; end_date?: string; isActive?: boolean; }
interface ReviewItem { id: number; customer: string; product: string; rating: number; comment: string; isApproved?: boolean; adminReply?: string; imageUrl?: string; createdAt?: string; }
interface RoleItem { id: number; name: string; display: string; desc: string; }

const PERMISSION_MODULES = [
  { module: 'product', label: 'Sản phẩm', permissions: [{ code: 'product:create', name: 'Tạo' }, { code: 'product:read', name: 'Xem' }, { code: 'product:update', name: 'Sửa' }, { code: 'product:delete', name: 'Xóa' }] },
  { module: 'order', label: 'Đơn hàng', permissions: [{ code: 'order:create', name: 'Tạo' }, { code: 'order:read', name: 'Xem' }, { code: 'order:update', name: 'Cập nhật' }, { code: 'order:delete', name: 'Xóa' }] },
  { module: 'driver', label: 'Tài xế', permissions: [{ code: 'driver:create', name: 'Tạo' }, { code: 'driver:read', name: 'Xem' }, { code: 'driver:update', name: 'Sửa' }, { code: 'driver:delete', name: 'Xóa' }] },
  { module: 'category', label: 'Danh mục', permissions: [{ code: 'category:create', name: 'Tạo' }, { code: 'category:read', name: 'Xem' }, { code: 'category:update', name: 'Sửa' }, { code: 'category:delete', name: 'Xóa' }] },
  { module: 'user', label: 'Người dùng', permissions: [{ code: 'user:read', name: 'Xem' }, { code: 'user:update', name: 'Sửa' }, { code: 'user:delete', name: 'Xóa' }] },
  { module: 'role', label: 'Vai trò', permissions: [{ code: 'role:read', name: 'Xem' }, { code: 'role:assign', name: 'Phân quyền' }] },
  { module: 'stats', label: 'Thống kê', permissions: [{ code: 'stats:view', name: 'Xem' }] },
];

function getUserOnlineStatus(): 'online' | 'away' | 'offline' {
  const stored = localStorage.getItem('user_last_active');
  if (!stored) return 'offline';
  const lastActive = parseInt(stored, 10);
  if (isNaN(lastActive)) return 'offline';
  const now = Date.now();
  const diffMs = now - lastActive;
  const diffMinutes = diffMs / 60000;
  if (diffMinutes <= 5) return 'online';
  if (diffMinutes <= 30) return 'away';
  return 'offline';
}

const statusLabel: Record<string, { icon: string; label: string }> = {
  online: { icon: '🟢', label: 'Online' },
  away: { icon: '🟡', label: 'Away' },
  offline: { icon: '⚫', label: 'Offline' }
};

export function AdminDashboard({
  orders,
  drivers,
  products,
  isBackendConnected,
  userRole,
  onUpdateOrderStatus,
  onAssignDriver,
  onCreateDriver,
  onUpdateDriverStatus,
  onUpdateOrderProgress,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onShowToast
}: AdminDashboardProps) {
  const isSuperAdmin = userRole === 'super_admin';
  const isAdminOrSuper = userRole === 'admin' || userRole === 'super_admin';
  const [adminTab, setAdminTab] = useState<'stats' | 'orders' | 'products' | 'categories' | 'toppings' | 'promotions' | 'reviews' | 'invoices' | 'drivers' | 'users' | 'permissions' | 'delivery-areas' | 'membership-tiers' | 'delivery-trips' | 'payment-transactions' | 'order-history'>('stats');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [selectedFEFile, setSelectedFEFile] = useState(0);

  useEffect(() => {
    if (adminTab === 'invoices') {
      loadInvoices();
    }
    if (adminTab === 'delivery-areas') {
      loadDeliveryAreas();
    }
    if (adminTab === 'membership-tiers') {
      loadMembershipTiers();
      loadAllMemberships();
      loadAllVouchers();
    }
    if (adminTab === 'permissions') {
      loadRoles();
    }
    if (adminTab === 'toppings') {
      loadProductOptions();
    }
    if (adminTab === 'delivery-trips') {
      loadDeliveryTrips();
    }
    if (adminTab === 'payment-transactions') {
      loadPaymentTransactions();
    }
  }, [adminTab]);

  // Online status refresh
  const [onlineStatus, setOnlineStatus] = useState<string>(getUserOnlineStatus());
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineStatus(getUserOnlineStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // API Users state (fetched from backend)
  const [apiUsers, setApiUsers] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Real registered users in localStorage for tracking
  const [localUsers, setLocalUsers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('banhcanh_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleRefreshUsers = async () => {
    try {
      const saved = localStorage.getItem('banhcanh_registered_users');
      setLocalUsers(saved ? JSON.parse(saved) : []);
    } catch {
      setLocalUsers([]);
    }
    if (isBackendConnected) {
      setLoadingUsers(true);
      try {
        const [users, stats] = await Promise.all([
          ApiService.getUsers(),
          ApiService.getStats()
        ]);
        setApiUsers(users);
        setApiStats(stats);
      } catch (err) {
        console.error('Failed to fetch users/stats from API:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleResetSimulatedUsers = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hết danh sách Tài khoản Khách hàng đã huấn luyện trong bộ nhớ tạm LocalStorage không?")) {
      localStorage.removeItem('banhcanh_registered_users');
      setLocalUsers([]);
    }
  };

  // Selected user for operations
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserEditForm, setShowUserEditForm] = useState(false);
  const [showUserRoleForm, setShowUserRoleForm] = useState(false);
  const [showUserPasswordForm, setShowUserPasswordForm] = useState(false);
  const [userEditForm, setUserEditForm] = useState({ fullName: '', phone: '', address: '', email: '' });
  const [userNewRole, setUserNewRole] = useState('customer');
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  const handleSelectUser = (u: any) => {
    setSelectedUser(prev => prev?.id === u.id ? null : u);
    setShowUserEditForm(false);
    setShowUserRoleForm(false);
    setShowUserPasswordForm(false);
    setUserActionMsg(null);
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    setUserActionLoading(true);
    setUserActionMsg(null);
    try {
      const updated = await ApiService.updateUser(String(selectedUser.id), userEditForm);
      setApiUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updated } : u));
      setSelectedUser((prev: any) => ({ ...prev, ...updated }));
      setUserActionMsg({ type: 'success', text: 'Đã cập nhật thông tin!' });
      setShowUserEditForm(false);
      onShowToast?.('Đã cập nhật thông tin người dùng', 'success', 'Người dùng');
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message || 'Lỗi cập nhật' });
      onShowToast?.(err.message || 'Lỗi cập nhật', 'error', 'Người dùng');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleChangeUserRole = async () => {
    if (!selectedUser) return;
    setUserActionLoading(true);
    setUserActionMsg(null);
    try {
      await ApiService.adminChangeUserRole(selectedUser.id, userNewRole);
      setApiUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: userNewRole } : u));
      setSelectedUser((prev: any) => ({ ...prev, role: userNewRole }));
      setUserActionMsg({ type: 'success', text: `Đã đổi vai trò thành "${userNewRole}"` });
      setShowUserRoleForm(false);
      onShowToast?.(`Đã đổi vai trò thành "${userNewRole}"`, 'success', 'Phân quyền');
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message || 'Lỗi đổi vai trò' });
      onShowToast?.(err.message || 'Lỗi đổi vai trò', 'error', 'Phân quyền');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleToggleUserActive = async () => {
    if (!selectedUser) return;
    setUserActionLoading(true);
    setUserActionMsg(null);
    try {
      const res = await ApiService.adminToggleUserActive(selectedUser.id);
      setApiUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: res.isActive } : u));
      setSelectedUser((prev: any) => ({ ...prev, isActive: res.isActive }));
      setUserActionMsg({ type: 'success', text: res.isActive ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản' });
      onShowToast?.(res.isActive ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản', 'success', 'Tài khoản');
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message || 'Lỗi thay đổi trạng thái' });
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleResetUserPassword = async () => {
    if (!selectedUser || userNewPassword.length < 6) return;
    setUserActionLoading(true);
    setUserActionMsg(null);
    try {
      await ApiService.adminResetUserPassword(selectedUser.id, userNewPassword);
      setUserActionMsg({ type: 'success', text: 'Đã đặt lại mật khẩu!' });
      setShowUserPasswordForm(false);
      setUserNewPassword('');
      onShowToast?.('Đã đặt lại mật khẩu', 'success', 'Tài khoản');
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message || 'Lỗi đặt lại mật khẩu' });
      onShowToast?.(err.message || 'Lỗi đặt lại mật khẩu', 'error', 'Tài khoản');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Bạn có chắc muốn xoá tài khoản "${selectedUser.username}"?`)) return;
    setUserActionLoading(true);
    setUserActionMsg(null);
    try {
      await ApiService.adminDeleteUser(selectedUser.id);
      setApiUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setUserActionMsg({ type: 'success', text: `Đã xoá tài khoản "${selectedUser.username}"` });
      setSelectedUser(null);
      onShowToast?.(`Đã xoá tài khoản "${selectedUser.username}"`, 'success', 'Tài khoản');
    } catch (err: any) {
      setUserActionMsg({ type: 'error', text: err.message || 'Lỗi xoá tài khoản' });
      onShowToast?.(err.message || 'Lỗi xoá tài khoản', 'error', 'Tài khoản');
    } finally {
      setUserActionLoading(false);
    }
  };

  const [productForm, setProductForm] = useState<{ name: string; description: string; price: number; categoryName: string; isBestSeller: boolean; isAvailable: boolean; imageUrl: string; preparationTime: number }>({ name: '', description: '', price: 0, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: false, isAvailable: true, imageUrl: '', preparationTime: 10 });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState('');
  const [productError, setProductError] = useState('');
  const [pendingNewCategory, setPendingNewCategory] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Driver Form State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverUsername, setDriverUsername] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('');
  const [driverVehicleType, setDriverVehicleType] = useState('Xe máy');
  const [driverVehiclePlate, setDriverVehiclePlate] = useState('');
  const [driverVehicleColor, setDriverVehicleColor] = useState('');
  const [driverAvatarUrl, setDriverAvatarUrl] = useState('');
  const [uploadingDriverAvatar, setUploadingDriverAvatar] = useState(false);
  const [driverSuccess, setDriverSuccess] = useState('');
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverEditModal, setDriverEditModal] = useState<any | null>(null);
  const [driverEditForm, setDriverEditForm] = useState({ name: '', phone: '', vehicle: '', vehicleType: 'Xe máy', vehiclePlate: '', vehicleColor: '', avatarUrl: '', password: '' });

  // Source code state
  const [selectedJavaFile, setSelectedJavaFile] = useState(0);
  const [copiedText, setCopiedText] = useState(false);

  // Order cancellation confirmation state
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null);

  // Categories CRUD (persisted to localStorage)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; description?: string; imageUrl?: string; displayOrder?: number; isActive?: boolean; count: number }[]>(() => {
    try {
      const saved = localStorage.getItem('banhcanh_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [categoryForm, setCategoryForm] = useState<{ name: string; slug: string; description?: string; imageUrl?: string; displayOrder?: number; isActive?: boolean }>({ name: '', slug: '', description: '', imageUrl: '', displayOrder: 0, isActive: true });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Toppings / Product Options CRUD
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [toppingForm, setToppingForm] = useState({ productId: 1, name: '', optionGroup: 'topping', price: 0, isRequired: false, displayOrder: 1, isActive: true });
  const [editingToppingId, setEditingToppingId] = useState<number | null>(null);

  const loadProductOptions = async () => {
    try {
      const opts = await ApiService.getProductOptions();
      const mapped = opts.map(o => ({
        id: o.id,
        productId: o.productId,
        name: o.name,
        optionGroup: o.optionGroup,
        price: o.price,
        isRequired: o.isRequired,
        isActive: o.isActive,
        displayOrder: o.displayOrder,
        productName: products.find(p => Number(p.id) === o.productId)?.name || `Sản phẩm #${o.productId}`
      }));
      setToppings(mapped);
    } catch (err) {
      console.error('Failed to load product options:', err);
    }
  };

  // Materials CRUD
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialForm, setMaterialForm] = useState({ name: '', unit: 'kg', stock: 0, min: 0, price: 0 });
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);

  // Tables CRUD
  const [tables, setTables] = useState<TableItem[]>([]);
  const [tableForm, setTableForm] = useState({ number: '', capacity: 2, position: '' });
  const [editingTableId, setEditingTableId] = useState<number | null>(null);

  // Promotions CRUD
  const [promotions, setPromotions] = useState<PromoItem[]>([]);
  const defaultPromoDate = () => {
    const now = new Date();
    const start = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 365 * 86400000).toISOString().slice(0, 16);
    return { start, end };
  };
  const [promoForm, setPromoForm] = useState({ code: '', name: '', description: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0, max_discount: 0, usage_limit: 100, start_date: defaultPromoDate().start, end_date: defaultPromoDate().end, isActive: true });
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);

  // Reviews CRUD
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewForm, setReviewForm] = useState({ customer: '', product: '', rating: 5, comment: '' });
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  // Invoices CRUD
  const [invoices, setInvoices] = useState<any[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const loadInvoices = async () => {
    if (!isBackendConnected) return;
    setInvoiceLoading(true);
    try {
      const data = await ApiService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.warn('Failed to load invoices:', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCreateInvoice = async (orderId: number) => {
    try {
      const inv = await ApiService.createInvoice(orderId);
      setInvoices(prev => [...prev, inv]);
      setInvoiceSuccess(`Đã xuất hóa đơn ${inv.invoiceNumber}`);
      setTimeout(() => setInvoiceSuccess(''), 3000);
    } catch (err) {
      setInvoiceError('Không thể tạo hóa đơn');
      setTimeout(() => setInvoiceError(''), 3000);
    }
  };

  const handleCancelInvoice = async (id: number) => {
    try {
      const inv = await ApiService.cancelInvoice(id);
      setInvoices(prev => prev.map(i => i.id === id ? inv : i));
      setInvoiceSuccess('Đã hủy hóa đơn');
      setTimeout(() => setInvoiceSuccess(''), 3000);
    } catch (err) {
      setInvoiceError('Không thể hủy hóa đơn');
      setTimeout(() => setInvoiceError(''), 3000);
    }
  };

  const handleViewInvoice = (inv: any) => {
    setViewingInvoice(inv);
  };

  const [invoiceSuccess, setInvoiceSuccess] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

  // Delivery Trips
  const [deliveryTrips, setDeliveryTrips] = useState<DeliveryTrip[]>([]);

  const loadDeliveryTrips = async () => {
    try {
      if (isBackendConnected) {
        const data = await ApiService.getDeliveryTrips();
        setDeliveryTrips(data);
      }
    } catch (err) {
      console.warn('Failed to load delivery trips:', err);
      setDeliveryTrips([]);
    }
  };

  // Payment Transactions
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);

  const loadPaymentTransactions = async () => {
    try {
      if (isBackendConnected) {
        const data = await ApiService.getPaymentTransactions(0);
        setPaymentTransactions(data || []);
      }
    } catch (err) {
      console.warn('Failed to load payment transactions:', err);
      setPaymentTransactions([]);
    }
  };

  // Delivery Areas CRUD
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [deliveryAreaForm, setDeliveryAreaForm] = useState({ name: '', centerLat: 10.8231, centerLng: 106.6297, radiusKm: 5, baseFee: 15000, feePerKm: 5000, maxDistanceKm: 15 });
  const [editingDeliveryAreaId, setEditingDeliveryAreaId] = useState<number | null>(null);
  const [deliveryAreaError, setDeliveryAreaError] = useState('');

  const loadDeliveryAreas = async () => {
    try {
      const data = await ApiService.getDeliveryAreas();
      setDeliveryAreas(data);
    } catch { setDeliveryAreas([]); }
  };

  const handleSaveDeliveryArea = async () => {
    try {
      if (editingDeliveryAreaId) {
        const updated = await ApiService.updateDeliveryArea(editingDeliveryAreaId, deliveryAreaForm);
        setDeliveryAreas(prev => prev.map(a => a.id === editingDeliveryAreaId ? updated : a));
      } else {
        const created = await ApiService.createDeliveryArea(deliveryAreaForm);
        setDeliveryAreas(prev => [...prev, created]);
      }
      setDeliveryAreaForm({ name: '', centerLat: 10.8231, centerLng: 106.6297, radiusKm: 5, baseFee: 15000, feePerKm: 5000, maxDistanceKm: 15 });
      setEditingDeliveryAreaId(null);
      setDeliveryAreaError('');
    } catch { setDeliveryAreaError('Lỗi lưu khu vực giao hàng'); }
  };

  const handleEditDeliveryArea = (area: any) => {
    setDeliveryAreaForm({ name: area.name, centerLat: area.centerLat, centerLng: area.centerLng, radiusKm: area.radiusKm, baseFee: area.baseFee, feePerKm: area.feePerKm, maxDistanceKm: area.maxDistanceKm });
    setEditingDeliveryAreaId(area.id);
  };

  const handleDeleteDeliveryArea = async (id: number) => {
    try {
      await ApiService.deleteDeliveryArea(id);
      setDeliveryAreas(prev => prev.filter(a => a.id !== id));
    } catch { setDeliveryAreaError('Lỗi xóa khu vực'); }
  };

  // Membership Tiers CRUD
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [membershipTierForm, setMembershipTierForm] = useState({ name: '', displayName: '', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 });
  const [editingMembershipTierId, setEditingMembershipTierId] = useState<number | null>(null);
  const [membershipTierError, setMembershipTierError] = useState('');

  const loadMembershipTiers = async () => {
    try {
      if (isBackendConnected) {
        const data = await ApiService.getMembershipTiers();
        setMembershipTiers(data);
      }
    } catch { }
  };

  const handleSaveMembershipTier = async () => {
    try {
      if (isBackendConnected) {
        if (editingMembershipTierId) {
          const updated = await ApiService.updateMembershipTier(editingMembershipTierId, { ...membershipTierForm, isActive: true });
          setMembershipTiers(prev => prev.map(t => t.id === editingMembershipTierId ? updated : t));
        } else {
          const created = await ApiService.createMembershipTier({ ...membershipTierForm, isActive: true });
          setMembershipTiers(prev => [...prev, created]);
        }
      }
      setMembershipTierForm({ name: '', displayName: '', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 });
      setEditingMembershipTierId(null);
      onShowToast?.(editingMembershipTierId ? 'Đã cập nhật hạng thành viên' : 'Đã tạo hạng thành viên mới', 'success', 'Hạng TV');
    } catch { setMembershipTierError('Lỗi lưu hạng thành viên'); onShowToast?.('Lỗi lưu hạng thành viên', 'error', 'Hạng TV'); }
  };

  const handleEditMembershipTier = (t: MembershipTier) => {
    setMembershipTierForm({ name: t.name, displayName: t.displayName, minTotalSpent: t.minTotalSpent, minTotalOrders: t.minTotalOrders, autoDiscountPercent: t.autoDiscountPercent, voucherCount: t.voucherCount, voucherDiscountPercent: t.voucherDiscountPercent });
    setEditingMembershipTierId(t.id);
  };

  const handleDeleteMembershipTier = async (id: number) => {
    try {
      if (isBackendConnected) await ApiService.deleteMembershipTier(id);
      setMembershipTiers(prev => prev.filter(t => t.id !== id));
      onShowToast?.('Đã xoá hạng thành viên', 'success', 'Hạng TV');
    } catch { setMembershipTierError('Lỗi xóa hạng'); onShowToast?.('Lỗi xóa hạng thành viên', 'error', 'Hạng TV'); }
  };

  // Membership sub-tab
  const [membershipSubTab, setMembershipSubTab] = useState<'tiers' | 'members' | 'vouchers'>('tiers');
  const [allMemberships, setAllMemberships] = useState<UserMembership[]>([]);
  const [allVouchers, setAllVouchers] = useState<MembershipVoucher[]>([]);
  const [newVoucherForm, setNewVoucherForm] = useState({ tierId: 1, discountPercent: 10, maxDiscount: 50000, minOrderAmount: 0, code: '', status: 'available', expiresAt: '' });
  const [assignToAll, setAssignToAll] = useState(false);
  const [selectedVoucherUserIds, setSelectedVoucherUserIds] = useState<Set<number>>(new Set());
  const [membershipMsg, setMembershipMsg] = useState('');

  const loadAllMemberships = async () => {
    try { const d = await ApiService.getAllMemberships(); setAllMemberships(d); } catch {}
  };
  const loadAllVouchers = async (tierId?: number) => {
    try { const d = await ApiService.getAllVouchers(tierId); setAllVouchers(d); } catch {}
  };

  const getTierName = (tierId: number | null | undefined): string => {
    if (!tierId) return 'Chưa xếp hạng';
    const t = membershipTiers.find(t => t.id === tierId);
    return t ? t.displayName : 'Hạng #' + tierId;
  };

  const usersByTier = useMemo(() => {
    const grouped: Record<number, any[]> = { 0: [] };
    membershipTiers.forEach(t => { grouped[t.id] = []; });
    apiUsers.forEach((u: any) => {
      const tid = u.membershipTierId || 0;
      if (!grouped[tid]) grouped[tid] = [];
      grouped[tid].push(u);
    });
    return grouped;
  }, [apiUsers, membershipTiers]);

  // Role Manager
  const [roleList, setRoleList] = useState<RoleItem[]>([]);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleItem | null>(null);

  // Account creation state
  const [accountForm, setAccountForm] = useState<{ username: string; password: string; email: string; fullName: string; roleId: number }>({ username: '', password: '', email: '', fullName: '', roleId: 0 });
  const [accountUsers, setAccountUsers] = useState<{ id: number; username: string; email: string; fullName: string; roleName: string }[]>([]);
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountError, setAccountError] = useState('');

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');
    if (!accountForm.username || !accountForm.password || !accountForm.email || !accountForm.roleId) {
      setAccountError('Vui lòng điền đầy đủ thông tin và chọn vai trò');
      return;
    }
    const usernameExists = accountUsers.some(u => u.username === accountForm.username);
    if (usernameExists) {
      setAccountError('Tên đăng nhập đã tồn tại');
      return;
    }
    const role = roleList.find(r => r.id === accountForm.roleId);
    const newUser = {
      id: Date.now(),
      username: accountForm.username,
      email: accountForm.email,
      fullName: accountForm.fullName,
      roleName: role?.display || role?.name || '',
    };
    setAccountUsers([...accountUsers, newUser]);
    setAccountForm({ username: '', password: '', email: '', fullName: '', roleId: 0 });
    setAccountSuccess(`Đã tạo tài khoản "${newUser.username}" với vai trò ${newUser.roleName}`);
    setTimeout(() => setAccountSuccess(''), 3000);
  };
  const [checkPermissions, setCheckPermissions] = useState<Record<string, boolean>>({});
  const [roleForm, setRoleForm] = useState({ name: '', display: '', desc: '' });
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [allDbPermissions, setAllDbPermissions] = useState<any[]>([]);

  const handleCopySource = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: 0, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: false, isAvailable: true, imageUrl: '', preparationTime: 10 });
    setEditingProductId(null);
    setProductError('');
  };

  const handleEditProduct = (p: Product) => {
    setProductForm({ name: p.name, description: p.description, price: p.price, categoryName: p.categoryName || '', isBestSeller: p.isBestSeller, isAvailable: p.isAvailable, imageUrl: p.imageUrl || '', preparationTime: p.preparationTime });
    setEditingProductId(p.id);
    setProductError('');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    if (!productForm.name || !productForm.price) {
      setProductError('Tên và giá sản phẩm là bắt buộc');
      return;
    }
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      categoryName: productForm.categoryName,
      isBestSeller: productForm.isBestSeller,
      isAvailable: productForm.isAvailable,
      preparationTime: Number(productForm.preparationTime),
      imageUrl: productForm.imageUrl || undefined
    };
    const productData: Omit<Product, 'id'> = { ...productForm, price: Number(productForm.price), isAvailable: productForm.isAvailable, preparationTime: Number(productForm.preparationTime) };
    const isNumeric = (v: string) => /^\d+$/.test(v);
    try {
      if (editingProductId) {
        if (isBackendConnected) {
          if (isNumeric(editingProductId)) {
            await ApiService.updateProduct(editingProductId, payload);
          } else {
            const created = await ApiService.createProduct(payload);
            await ApiService.updateProduct(created.id, payload);
          }
        }
        if (onUpdateProduct) onUpdateProduct(editingProductId, productData);
      } else {
        if (isBackendConnected) {
          await ApiService.createProduct(payload);
        }
        if (onCreateProduct) onCreateProduct(productData);
      }
      resetProductForm();
      setProductSuccess(editingProductId ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm sản phẩm mới thành công!');
      setTimeout(() => setProductSuccess(''), 3000);
    } catch (err: any) {
      setProductError(err.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      if (isBackendConnected && /^\d+$/.test(id)) {
        await ApiService.deleteProduct(id);
      }
      if (onDeleteProduct) onDeleteProduct(id);
      setProductSuccess('Đã xóa sản phẩm!');
      setTimeout(() => setProductSuccess(''), 3000);
    } catch (err: any) {
      setProductError(err.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone || !driverUsername || !driverPassword || !driverEmail) return;
    const driverData = {
      username: driverUsername,
      password: driverPassword,
      email: driverEmail,
      fullName: driverName,
      name: driverName,
      phone: driverPhone,
      vehicle: driverVehicle || `${driverVehicleType} - ${driverVehiclePlate}`,
      vehicleType: driverVehicleType,
      vehiclePlate: driverVehiclePlate,
      vehicleColor: driverVehicleColor,
      avatarUrl: driverAvatarUrl || undefined,
    };
    if (isBackendConnected) {
      try {
        await ApiService.registerDriver(driverData);
      } catch (err) {
        console.error('API register driver failed:', err);
        alert('Lỗi đăng ký tài xế: ' + err);
        return;
      }
    }
    onCreateDriver(driverName, driverPhone, driverVehicle || `${driverVehicleType} - ${driverVehiclePlate}`);
    setDriverName(''); setDriverPhone(''); setDriverUsername(''); setDriverPassword(''); setDriverEmail('');
    setDriverVehicle(''); setDriverVehicleType('Xe máy'); setDriverVehiclePlate(''); setDriverVehicleColor(''); setDriverAvatarUrl('');
    setDriverSuccess('Đã đăng ký shipper mới thành công!');
    setTimeout(() => setDriverSuccess(''), 3000);
  };

  const handleEditDriverOpen = (d: any) => {
    setDriverEditForm({
      name: d.name || '',
      phone: d.phone || '',
      vehicle: d.vehicle || '',
      vehicleType: d.vehicleType || 'Xe máy',
      vehiclePlate: d.vehiclePlate || '',
      vehicleColor: d.vehicleColor || '',
      avatarUrl: d.avatarUrl || '',
      password: '',
    });
    setEditingDriverId(d.id);
    setDriverEditModal(d);
  };

  const handleEditDriverSave = async () => {
    if (!editingDriverId) return;
    const payload: any = { ...driverEditForm };
    if (!payload.password) delete payload.password;
    if (isBackendConnected) {
      try {
        await ApiService.updateDriver(Number(editingDriverId), payload);
      } catch (err) { console.error(err); }
    }
    setEditingDriverId(null);
    setDriverEditModal(null);
    setDriverSuccess('Đã cập nhật thông tin tài xế!');
    setTimeout(() => setDriverSuccess(''), 3000);
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá tài xế này?')) return;
    if (isBackendConnected) {
      try {
        await ApiService.deleteDriver(Number(id));
      } catch (err) { console.error(err); }
    }
    setDriverSuccess('Đã xoá tài xế!');
    setTimeout(() => setDriverSuccess(''), 3000);
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
      case 'picked_up':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
      case 'shipping':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
    }
  };

  // Category handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    const finalSlug = categoryForm.slug || toSlug(categoryForm.name);
    const slugExists = categories.some(c =>
      c.slug === finalSlug && (editingCategoryId === null || c.id !== editingCategoryId)
    );
    if (slugExists) {
      alert(`Slug "${finalSlug}" đã tồn tại! Vui lòng đặt tên khác.`);
      return;
    }
    const catPayload = {
      name: categoryForm.name,
      slug: finalSlug,
      description: categoryForm.description || undefined,
      imageUrl: categoryForm.imageUrl || undefined,
      displayOrder: categoryForm.displayOrder ?? 0,
      isActive: categoryForm.isActive !== false,
    };
    try {
      if (editingCategoryId !== null) {
        if (isBackendConnected) {
          await ApiService.updateCategory(editingCategoryId, catPayload);
        }
        setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, name: categoryForm.name, slug: finalSlug, description: categoryForm.description, imageUrl: categoryForm.imageUrl, displayOrder: categoryForm.displayOrder, isActive: categoryForm.isActive } : c));
      } else {
        if (isBackendConnected) {
          const created = await ApiService.createCategory(catPayload);
          setCategories([...categories, { id: Number(created.id), name: created.name, slug: created.slug, description: created.description, imageUrl: created.imageUrl, displayOrder: created.displayOrder, isActive: created.isActive, count: 0 }]);
        } else {
          const newId = Math.max(...categories.map(c => c.id), 0) + 1;
          setCategories([...categories, { id: newId, name: categoryForm.name, slug: finalSlug, description: categoryForm.description, imageUrl: categoryForm.imageUrl, displayOrder: categoryForm.displayOrder, isActive: categoryForm.isActive, count: 0 }]);
        }
      }
      setCategoryForm({ name: '', slug: '', description: '', imageUrl: '', displayOrder: 0, isActive: true });
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      alert('Lỗi khi lưu danh mục!');
    }
  };

  const handleEditCategory = (cat: { id: number; name: string; slug: string; description?: string; imageUrl?: string; displayOrder?: number; isActive?: boolean }) => {
    setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', imageUrl: cat.imageUrl || '', displayOrder: cat.displayOrder ?? 0, isActive: cat.isActive !== false });
    setEditingCategoryId(cat.id);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      if (isBackendConnected) {
        await ApiService.deleteCategory(id);
      }
      setCategories(categories.filter(c => c.id !== id));
      if (editingCategoryId === id) {
        setEditingCategoryId(null);
        setCategoryForm({ name: '', slug: '', description: '', imageUrl: '', displayOrder: 0, isActive: true });
      }
    } catch (err) {
      console.error('Lỗi khi xóa danh mục:', err);
      alert('Lỗi khi xóa danh mục!');
    }
  };

  // Topping handlers
  const handleToppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingForm.name) return;
    const payload = {
      productId: toppingForm.productId,
      name: toppingForm.name,
      optionGroup: toppingForm.optionGroup,
      price: toppingForm.price,
      isRequired: toppingForm.isRequired,
      displayOrder: toppingForm.displayOrder,
      isActive: toppingForm.isActive
    };
    if (isBackendConnected) {
      try {
        if (editingToppingId !== null) {
          const updated = await ApiService.updateProductOption(editingToppingId, payload);
          setToppings(toppings.map(t => t.id === editingToppingId ? { ...t, ...updated, productName: products.find(p => Number(p.id) === updated.productId)?.name || `Sản phẩm #${updated.productId}` } : t));
        } else {
          const created = await ApiService.createProductOption(payload);
          const newItem: ToppingItem = { id: created.id, productId: created.productId, name: created.name, optionGroup: created.optionGroup, price: created.price, isRequired: created.isRequired, isActive: created.isActive, displayOrder: created.displayOrder, productName: products.find(p => Number(p.id) === created.productId)?.name || `Sản phẩm #${created.productId}` };
          setToppings([...toppings, newItem]);
        }
      } catch (err) { console.error(err); }
    } else {
      if (editingToppingId !== null) {
        setToppings(toppings.map(t => t.id === editingToppingId ? { ...t, ...payload, productName: products.find(p => Number(p.id) === payload.productId)?.name } : t));
      } else {
        const newId = Math.max(...toppings.map(t => t.id), 0) + 1;
        setToppings([...toppings, { id: newId, ...payload, productName: products.find(p => Number(p.id) === payload.productId)?.name }]);
      }
    }
    setToppingForm({ productId: 1, name: '', optionGroup: 'topping', price: 0, isRequired: false, displayOrder: 1, isActive: true });
    setEditingToppingId(null);
  };

  const handleEditTopping = (t: ToppingItem) => {
    setToppingForm({ productId: t.productId, name: t.name, optionGroup: t.optionGroup, price: t.price, isRequired: t.isRequired, displayOrder: t.displayOrder, isActive: t.isActive });
    setEditingToppingId(t.id);
  };

  const handleDeleteTopping = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tuỳ chọn này?')) return;
    if (isBackendConnected) {
      try { await ApiService.deleteProductOption(id); } catch (err) { console.error(err); }
    }
    setToppings(toppings.filter(t => t.id !== id));
    if (editingToppingId === id) {
      setEditingToppingId(null);
      setToppingForm({ productId: 1, name: '', optionGroup: 'topping', price: 0, isRequired: false, displayOrder: 1, isActive: true });
    }
  };

  const [customOptionGroups, setCustomOptionGroups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('custom_option_groups') || '[]'); }
    catch { return []; }
  });
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const dbOptionGroups = useMemo(() =>
    [...new Set(toppings.map(t => t.optionGroup).filter(Boolean))],
    [toppings]
  );
  const allOptionGroups = useMemo(() =>
    [...new Set([...customOptionGroups, ...dbOptionGroups])],
    [customOptionGroups, dbOptionGroups]
  );

  const addCustomGroup = (name: string) => {
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key || allOptionGroups.includes(key)) return;
    const updated = [...customOptionGroups, key];
    setCustomOptionGroups(updated);
    localStorage.setItem('custom_option_groups', JSON.stringify(updated));
    setToppingForm(prev => ({ ...prev, optionGroup: key }));
    setShowNewGroupInput(false);
    setNewGroupName('');
  };

  const optionGroupLabels: Record<string, string> = {
    topping: 'Topping',
    size: 'Size',
    sugar: 'Đường',
    ice: 'Đá',
    coffee_type: 'Loại Cà Phê',
    noodle: 'Loại Sợi'
  };

  const optionGroupColors: Record<string, string> = {
    topping: 'bg-orange-100 text-orange-700',
    size: 'bg-blue-100 text-blue-700',
    sugar: 'bg-pink-100 text-pink-700',
    ice: 'bg-cyan-100 text-cyan-700',
    coffee_type: 'bg-purple-100 text-purple-700',
    noodle: 'bg-yellow-100 text-yellow-700'
  };

  // Material handlers
  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.name) return;
    if (editingMaterialId !== null) {
      setMaterials(materials.map(m => m.id === editingMaterialId ? { ...m, ...materialForm } : m));
    } else {
      const newId = Math.max(...materials.map(m => m.id), 0) + 1;
      setMaterials([...materials, { id: newId, ...materialForm }]);
    }
    setMaterialForm({ name: '', unit: 'kg', stock: 0, min: 0, price: 0 });
    setEditingMaterialId(null);
  };

  const handleEditMaterial = (m: MaterialItem) => {
    setMaterialForm({ name: m.name, unit: m.unit, stock: m.stock, min: m.min, price: m.price });
    setEditingMaterialId(m.id);
  };

  const handleDeleteMaterial = (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) return;
    setMaterials(materials.filter(m => m.id !== id));
    if (editingMaterialId === id) {
      setEditingMaterialId(null);
      setMaterialForm({ name: '', unit: 'kg', stock: 0, min: 0, price: 0 });
    }
  };

  // Table handlers
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.number) return;
    if (editingTableId !== null) {
      setTables(tables.map(t => t.id === editingTableId ? { ...t, ...tableForm } : t));
    } else {
      const newId = Math.max(...tables.map(t => t.id), 0) + 1;
      setTables([...tables, { id: newId, ...tableForm }]);
    }
    setTableForm({ number: '', capacity: 2, position: '' });
    setEditingTableId(null);
  };

  const handleEditTable = (t: TableItem) => {
    setTableForm({ number: t.number, capacity: t.capacity, position: t.position });
    setEditingTableId(t.id);
  };

  const handleDeleteTable = (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
    setTables(tables.filter(t => t.id !== id));
    if (editingTableId === id) {
      setEditingTableId(null);
      setTableForm({ number: '', capacity: 2, position: '' });
    }
  };

  // Promo handlers
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.name) return;
    if (!promoForm.start_date || !promoForm.end_date) { alert('Vui lòng chọn ngày bắt đầu và kết thúc'); return; }
    const promoPayload = {
      code: promoForm.code,
      name: promoForm.name,
      description: promoForm.description || undefined,
      discountType: promoForm.discount_type === 'fixed' ? 'fixed_amount' : 'percentage',
      discountValue: promoForm.discount_value,
      minOrderAmount: promoForm.min_order_amount,
      maxDiscount: promoForm.discount_type === 'percentage' ? promoForm.max_discount : 0,
      usageLimit: promoForm.usage_limit,
      startDate: promoForm.start_date.includes('T') ? promoForm.start_date + ':00' : promoForm.start_date + 'T00:00:00',
      endDate: promoForm.end_date.includes('T') ? promoForm.end_date + ':00' : promoForm.end_date + 'T00:00:00',
      isActive: promoForm.isActive,
    };
    if (isBackendConnected) {
      try {
        if (editingPromoId !== null) {
          const updated = await ApiService.updatePromotion(editingPromoId, promoPayload);
          setPromotions(promotions.map(p => p.id === editingPromoId ? { ...p, code: updated.code, name: updated.name, description: updated.description, discount_type: updated.discountType === 'fixed_amount' ? 'fixed' : 'percentage', discount_value: updated.discountValue, min_order_amount: updated.minOrderAmount, max_discount: updated.maxDiscount, usage_limit: updated.usageLimit, start_date: updated.startDate, end_date: updated.endDate, isActive: updated.isActive } : p));
        } else {
          const created = await ApiService.createPromotion(promoPayload);
          setPromotions([...promotions, { id: created.id, code: created.code, name: created.name, description: created.description, discount_type: created.discountType === 'fixed_amount' ? 'fixed' : 'percentage', discount_value: created.discountValue, min_order_amount: created.minOrderAmount, max_discount: created.maxDiscount, usage_limit: created.usageLimit, start_date: created.startDate, end_date: created.endDate, isActive: created.isActive }]);
        }
      } catch (err) { console.error(err); }
    } else {
      if (editingPromoId !== null) {
        setPromotions(promotions.map(p => p.id === editingPromoId ? { ...p, ...promoForm } : p));
      } else {
        const newId = Math.max(...promotions.map(p => p.id), 0) + 1;
        setPromotions([...promotions, { id: newId, ...promoForm }]);
      }
    }
    setPromoForm({ code: '', name: '', description: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0, max_discount: 0, usage_limit: 100, start_date: defaultPromoDate().start, end_date: defaultPromoDate().end, isActive: true });
    setEditingPromoId(null);
  };

  const handleEditPromo = (p: PromoItem) => {
    const toDatetimeLocal = (d: string | undefined) => d ? d.slice(0, 16) : defaultPromoDate().start;
    setPromoForm({ code: p.code, name: p.name, description: p.description || '', discount_type: p.discount_type, discount_value: p.discount_value, min_order_amount: p.min_order_amount, max_discount: p.max_discount || 0, usage_limit: p.usage_limit || 100, start_date: toDatetimeLocal(p.start_date), end_date: toDatetimeLocal(p.end_date) || defaultPromoDate().end, isActive: p.isActive !== false });
    setEditingPromoId(p.id);
  };

  const handleDeletePromo = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    if (isBackendConnected) {
      try { await ApiService.deletePromotion(id); } catch (err) { console.error(err); }
    }
    setPromotions(promotions.filter(p => p.id !== id));
    if (editingPromoId === id) {
      setEditingPromoId(null);
      setPromoForm({ code: '', name: '', description: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0, max_discount: 0, usage_limit: 100, start_date: defaultPromoDate().start, end_date: defaultPromoDate().end, isActive: true });
    }
  };

  // Fetch reviews from backend on mount
  // Persist categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('banhcanh_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (isBackendConnected) {
      ApiService.getCategories().then(apiCats => {
        setCategories(apiCats.map(c => ({ id: Number(c.id), name: c.name, slug: c.slug, count: 0 })));
      }).catch(() => {});
      ApiService.getReviews().then(apiReviews => {
        setReviews(apiReviews.map(r => ({ id: Number(r.id), customer: r.customerName || '', product: r.productName || '', rating: r.rating, comment: r.comment, isApproved: r.isApproved, adminReply: r.adminReply, imageUrl: r.imageUrl || undefined, createdAt: r.createdAt || undefined })));
      }).catch(() => {});
    }
  }, [isBackendConnected]);

  // Review handlers
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customer || !reviewForm.product) return;
    const payload = {
      customerName: reviewForm.customer,
      productName: reviewForm.product,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      isApproved: false
    };
    try {
      if (editingReviewId !== null) {
        if (isBackendConnected) {
          await ApiService.updateReview(String(editingReviewId), payload);
        }
        setReviews(reviews.map(r => r.id === editingReviewId ? { ...r, ...payload, customer: payload.customerName, product: payload.productName } : r));
      } else {
        if (isBackendConnected) {
          const created = await ApiService.createReview(payload);
          setReviews([...reviews, { id: Number(created.id), customer: created.customerName || '', product: created.productName || '', rating: created.rating, comment: created.comment }]);
        } else {
          const newId = Math.max(...reviews.map(r => r.id), 0) + 1;
          setReviews([...reviews, { id: newId, customer: payload.customerName, product: payload.productName, rating: payload.rating, comment: payload.comment }]);
        }
      }
      setReviewForm({ customer: '', product: '', rating: 5, comment: '' });
      setEditingReviewId(null);
    } catch (err) {
      console.error('Lỗi khi lưu đánh giá:', err);
    }
  };

  const handleApproveReview = async (id: number) => {
    try {
      if (isBackendConnected) {
        await ApiService.updateReview(String(id), { isApproved: true });
      }
      setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } catch (err) {
      console.error('Lỗi khi duyệt đánh giá:', err);
    }
  };

  const handleEditReview = (r: ReviewItem) => {
    setReviewForm({ customer: r.customer, product: r.product, rating: r.rating, comment: r.comment });
    setEditingReviewId(r.id);
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      if (isBackendConnected) {
        await ApiService.deleteReview(String(id));
      }
      setReviews(reviews.filter(r => r.id !== id));
      if (editingReviewId === id) {
        setEditingReviewId(null);
        setReviewForm({ customer: '', product: '', rating: 5, comment: '' });
      }
    } catch (err) {
      console.error('Lỗi khi xóa đánh giá:', err);
    }
  };

  // Role Manager handlers
  const [roleManagerLoading, setRoleManagerLoading] = useState(false);
  const [roleManagerMsg, setRoleManagerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRoles = async () => {
    if (!isBackendConnected) return;
    setRoleManagerLoading(true);
    try {
      const [roles, permissions] = await Promise.all([
        ApiService.getRoles(),
        ApiService.getPermissions()
      ]);
      setRoleList(roles.map((r: any) => ({ id: r.id, name: r.name, display: r.displayName || r.name, desc: r.description || '' })));
      // Also store all permission codes from DB
      const dbPermCodes = new Set(permissions.map((p: any) => p.code));
      setAllDbPermissions(permissions);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setRoleManagerLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    if (!isBackendConnected) return;
    try {
      return await ApiService.getRolePermissions(roleId);
    } catch {
      return [];
    }
  };

  const handleRoleSelect = async (role: RoleItem) => {
    setSelectedRoleForPerms(role);
    const perms: Record<string, boolean> = {};
    PERMISSION_MODULES.forEach(mod => {
      mod.permissions.forEach(p => {
        perms[p.code] = false;
      });
    });
    if (isBackendConnected) {
      const rolePerms = await loadRolePermissions(role.id);
      rolePerms.forEach((p: any) => {
        if (perms[p.code] !== undefined) perms[p.code] = true;
      });
    } else {
      if (role.name === 'ROLE_SUPER_ADMIN') {
        Object.keys(perms).forEach(c => { perms[c] = true; });
      }
      if (role.name === 'ROLE_ADMIN') {
        ['product:create', 'product:read', 'product:update', 'product:delete', 'order:create', 'order:read', 'order:update', 'order:delete', 'driver:create', 'driver:read', 'driver:update', 'driver:delete', 'category:create', 'category:read', 'category:update', 'category:delete', 'user:read', 'stats:view'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
      }
      if (role.name === 'ROLE_STAFF') {
        ['order:read', 'order:update'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
      }
      if (role.name === 'ROLE_CUSTOMER') {
        ['order:create', 'order:read'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
      }
    }
    setCheckPermissions(perms);
  };

  const handlePermissionToggle = (code: string) => {
    setCheckPermissions(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleForPerms) return;
    setRoleManagerLoading(true);
    setRoleManagerMsg(null);
    try {
      // Get currently assigned permissions from API
      if (isBackendConnected) {
        const currentPerms = await loadRolePermissions(selectedRoleForPerms.id);
        const currentCodes = new Set(currentPerms.map((p: any) => p.code));
        const allPerms = allDbPermissions;

        for (const mod of PERMISSION_MODULES) {
          for (const perm of mod.permissions) {
            const isChecked = !!checkPermissions[perm.code];
            const isCurrentlyAssigned = currentCodes.has(perm.code);
            if (isChecked && !isCurrentlyAssigned) {
              const dbPerm = allPerms.find((p: any) => p.code === perm.code);
              if (dbPerm) {
                await ApiService.assignPermissionToRole(selectedRoleForPerms.id, dbPerm.id);
              }
            } else if (!isChecked && isCurrentlyAssigned) {
              const dbPerm = allPerms.find((p: any) => p.code === perm.code);
              if (dbPerm) {
                await ApiService.removePermissionFromRole(selectedRoleForPerms.id, dbPerm.id);
              }
            }
          }
        }
      }
      setRoleManagerMsg({ type: 'success', text: 'Đã lưu phân quyền!' });
      setTimeout(() => setRoleManagerMsg(null), 3000);
      onShowToast?.('Đã lưu phân quyền!', 'success', 'Phân quyền');
    } catch (err: any) {
      setRoleManagerMsg({ type: 'error', text: err.message || 'Lỗi lưu phân quyền' });
      onShowToast?.(err.message || 'Lỗi lưu phân quyền', 'error', 'Phân quyền');
    } finally {
      setRoleManagerLoading(false);
    }
  };

  const handleRoleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name || !roleForm.display) return;
    setRoleManagerMsg(null);
    try {
      if (editingRoleId !== null) {
        if (isBackendConnected) {
          const updated = await ApiService.updateRole(editingRoleId, { name: roleForm.name, displayName: roleForm.display, description: roleForm.desc });
          setRoleList(roleList.map(r => r.id === editingRoleId ? { id: updated.id, name: updated.name, display: updated.displayName, desc: updated.description || '' } : r));
        } else {
          setRoleList(roleList.map(r => r.id === editingRoleId ? { ...r, ...roleForm } : r));
        }
        setRoleManagerMsg({ type: 'success', text: 'Đã cập nhật vai trò!' });
        onShowToast?.('Đã cập nhật vai trò!', 'success', 'Vai trò');
      } else {
        let newRole: any;
        if (isBackendConnected) {
          newRole = await ApiService.createRole({ name: roleForm.name, displayName: roleForm.display, description: roleForm.desc });
          newRole = { id: newRole.id, name: newRole.name, display: newRole.displayName, desc: newRole.description || '' };
        } else {
          const newId = Math.max(...roleList.map(r => r.id), 0) + 1;
          newRole = { id: newId, ...roleForm };
        }
        setRoleList([...roleList, newRole]);
        setRoleManagerMsg({ type: 'success', text: `Đã tạo vai trò "${roleForm.name}"! Vai trò mới chưa có quyền, hãy chọn để phân quyền.` });
        onShowToast?.(`Đã tạo vai trò "${roleForm.name}"`, 'success', 'Vai trò');
      }
      setTimeout(() => setRoleManagerMsg(null), 3000);
      setRoleForm({ name: '', display: '', desc: '' });
      setEditingRoleId(null);
    } catch (err: any) {
      setRoleManagerMsg({ type: 'error', text: err.message || 'Lỗi khi lưu vai trò' });
      onShowToast?.(err.message || 'Lỗi khi lưu vai trò', 'error', 'Vai trò');
    }
  };

  const handleEditRole = (r: RoleItem) => {
    setRoleForm({ name: r.name, display: r.display, desc: r.desc });
    setEditingRoleId(r.id);
  };

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return;
    try {
      if (isBackendConnected) {
        await ApiService.deleteRole(id);
      }
      setRoleList(roleList.filter(r => r.id !== id));
      if (selectedRoleForPerms?.id === id) {
        setSelectedRoleForPerms(null);
        setCheckPermissions({});
      }
      if (editingRoleId === id) {
        setEditingRoleId(null);
        setRoleForm({ name: '', display: '', desc: '' });
      }
      setRoleManagerMsg({ type: 'success', text: 'Đã xoá vai trò!' });
      setTimeout(() => setRoleManagerMsg(null), 3000);
      onShowToast?.('Đã xoá vai trò!', 'success', 'Vai trò');
    } catch (err: any) {
      setRoleManagerMsg({ type: 'error', text: err.message || 'Lỗi xoá vai trò' });
      onShowToast?.(err.message || 'Lỗi xoá vai trò', 'error', 'Vai trò');
    }
  };

   const tabClass = (tab: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      adminTab === tab
        ? tab === 'stats' || tab === 'users' || tab === 'permissions'
          ? 'bg-[#E74C3C] text-white shadow-xs'
          : 'bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white shadow-xs'
        : 'text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8]'
    }`;
  return (
    <div className="bg-white dark:bg-[#FFF8F0] rounded-3xl border border-[#E5E1D8] dark:border-[#E0D8D0] shadow-sm select-none text-[#3E2F26] dark:text-[#3E2F26] overflow-hidden">

      {/* HEADER SECTION */}
      <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-6 border-b border-[#E5E1D8] dark:border-[#E0D8D0] flex flex-wrap gap-4 items-center justify-between">
        <div>
          <span className="bg-[#E74C3C] text-white text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-xs">
            Hệ quản trị quán ăn
          </span>
          <h2 className="text-xl font-serif font-bold text-[#2D241E] dark:text-[#2D241E] mt-1.5 flex items-center gap-2">
            ⚙️ Quản Lý Đơn Hàng & Tài Xế
          </h2>
          <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74] mt-0.5">Xử lý món ăn, phân công shipper vận chuyển và tích hợp backend Java Spring Boot kết nối MySQL XAMPP.</p>
        </div>

        {/* Outer Tabs Controls — Horizontal Scroll with Arrows */}
        <div className="relative flex items-center gap-1 max-w-full">
          <button onClick={() => { const el = document.getElementById('admin-tabs-scroll'); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#E74C3C] text-white text-xs font-bold hover:bg-[#C0392B] transition shadow-sm">‹</button>
          <div id="admin-tabs-scroll" ref={tabsRef} className="flex gap-1 overflow-x-auto scroll-smooth bg-[#F3F0E9] dark:bg-[#FFF0E0] p-1 rounded-xl border border-[#E5E1D8] dark:border-[#D0C8C0] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => setAdminTab('stats')} className={`shrink-0 ${tabClass('stats')}`}>📊 Thống Kê</button>
            <button onClick={() => setAdminTab('orders')} className={`shrink-0 ${tabClass('orders')}`}>📋 Đơn Hàng ({orders.length})</button>
            <button onClick={() => setAdminTab('products')} className={`shrink-0 ${tabClass('products')}`}>🍲 Sản Phẩm ({products.length})</button>
            <button onClick={() => setAdminTab('categories')} className={`shrink-0 ${tabClass('categories')}`}>📂 Danh Mục</button>
            <button onClick={() => setAdminTab('toppings')} className={`shrink-0 ${tabClass('toppings')}`}>🧂 Lựa Chọn</button>
            <button onClick={() => setAdminTab('promotions')} className={`shrink-0 ${tabClass('promotions')}`}>🏷️ Khuyến Mãi</button>
            <button onClick={() => setAdminTab('reviews')} className={`shrink-0 ${tabClass('reviews')}`}>⭐ Đánh Giá</button>
            <button onClick={() => setAdminTab('invoices')} className={`shrink-0 ${tabClass('invoices')}`}>🧾 Hóa Đơn</button>
            <button onClick={() => setAdminTab('drivers')} className={`shrink-0 ${tabClass('drivers')}`}>🛵 Shipper / Tài xế</button>
            <button onClick={() => setAdminTab('delivery-areas')} className={`shrink-0 ${tabClass('delivery-areas')}`}>🗺️ Khu Vực GH</button>
            <button onClick={() => { handleRefreshUsers(); setAdminTab('users'); }} className={`shrink-0 ${tabClass('users')}`}>👥 Người dùng</button>
            {isSuperAdmin && <button onClick={() => setAdminTab('permissions')} className={`shrink-0 ${tabClass('permissions')}`}>🔐 Phân quyền & Vai trò</button>}
            {isAdminOrSuper && <button onClick={() => setAdminTab('membership-tiers')} className={`shrink-0 ${tabClass('membership-tiers')}`}>🏅 Hạng TV</button>}
            <button onClick={() => setAdminTab('delivery-trips')} className={`shrink-0 ${tabClass('delivery-trips')}`}>🚚 Chuyến GH</button>
            <button onClick={() => setAdminTab('payment-transactions')} className={`shrink-0 ${tabClass('payment-transactions')}`}>💳 GD Thanh Toán</button>
            <button onClick={() => setAdminTab('order-history')} className={`shrink-0 ${tabClass('order-history')}`}>📜 Lịch Sử ĐH</button>
          </div>
          <button onClick={() => { const el = document.getElementById('admin-tabs-scroll'); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-[#E74C3C] text-white text-xs font-bold hover:bg-[#C0392B] transition shadow-sm">›</button>
        </div>
      </div>

      <div className="p-6">

        {/* TAB 1: LIVE ORDER PROCESSOR */}
        {adminTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">Theo Dõi Đơn Hàng Gần Đây</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Trực quan hóa chuyển giao hành động</span>
            </div>

            {orders.length === 0 ? (
              <p className="text-center py-12 text-xs text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có đơn hàng nào tồn tại.</p>
            ) : (
              <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
                <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                  <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                    <tr>
                      <th className="p-3.5">Mã Đơn</th>
                      <th className="p-3.5">Thông tin Khách</th>
                      <th className="p-3.5">Chi Tiết Bát Canh</th>
                      <th className="p-3.5">Loại Đơn</th>
                      <th className="p-3.5 text-right">Tạm tính</th>
                      <th className="p-3.5 text-right">Giảm giá</th>
                      <th className="p-3.5 text-right">Phí GH</th>
                      <th className="p-3.5 text-right">Tổng Tiền</th>
                      <th className="p-3.5">Ghi chú</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5">Thanh toán</th>
                      <th className="p-3.5">Ngày đặt</th>
                      <th className="p-3.5">Phân Tài Xế</th>
                      <th className="p-3.5 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                        <td className="p-3.5 font-mono font-black text-[#2D241E] dark:text-[#2D241E]">{order.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{order.customerName}</p>
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74]">{order.phone}</p>
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74] max-w-[150px] truncate" title={order.address}>{order.address}</p>
                        </td>
                        <td className="p-3.5 space-y-1">
                          {order.items.map((it, i) => (
                            <p key={i} className="text-[10px] text-[#2D241E] dark:text-[#2D241E]">
                              • <span className="font-bold">{it.quantity}x</span> {it.productName}
                              {it.noodleType && <span className="text-red-700 dark:text-red-400"> [{it.noodleType}]</span>}
                            </p>
                          ))}
                        </td>
                        <td className="p-3.5 text-[10px]">
                          {order.orderType === 'dine-in' ? '🍽️ Tại quán' :
                            order.orderType === 'takeaway' ? '🛍️ Mang đi' :
                            order.orderType === 'delivery' ? '🛵 Giao hàng' :
                            order.orderType || '🛵 Giao hàng'}
                          {order.tableNumber && <span className="block text-[9px] text-[#8B7E74]">Bàn {order.tableNumber}</span>}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[10px] text-[#8B7E74]">
                          {order.subtotal ? order.subtotal.toLocaleString('vi-VN') + 'đ' : '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[10px] text-emerald-600">
                          {order.discountAmount > 0 ? '-' + order.discountAmount.toLocaleString('vi-VN') + 'đ' : '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[10px] text-[#8B7E74]">
                          {order.shippingFee > 0 ? order.shippingFee.toLocaleString('vi-VN') + 'đ' : '—'}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-[#E74C3C] dark:text-red-400 whitespace-nowrap">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3.5 text-[10px] text-[#8B7E74] max-w-[120px] truncate" title={order.notes || ''}>
                          {order.notes || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getOrderStatusBadge(order.status)}`}>
                            {order.status === 'pending' ? 'Chờ xác nhận' :
                             order.status === 'preparing' ? 'Đang chế biến' :
                             order.status === 'picked_up' ? 'Đã lấy hàng' :
                             order.status === 'shipping' ? 'Đang giao hàng' :
                             order.status === 'completed' ? 'Thành công' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px]">
                          <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {order.paymentStatus === 'paid' ? '✅ Đã TT' : '⏳ Chưa TT'}
                          </span>
                          <span className="block text-[9px] text-[#8B7E74] mt-0.5">
                            {order.paymentMethod === 'momo' ? '🎀 MoMo' :
                             order.paymentMethod === 'cod' ? '💵 Tiền mặt (COD)' :
                             order.paymentMethod || '-'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px] text-[#8B7E74] font-mono">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3.5">
                          {order.status === 'cancelled' || order.status === 'completed' ? (
                            <span className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74]">-</span>
                          ) : (
                            <select
                              value={order.driverId || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignDriver(order.id, e.target.value);
                                }
                              }}
                              className="text-[10px] p-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-[#FAF8F5] dark:bg-[#FFF5EB] text-[#2D241E] dark:text-[#2D241E] focus:outline-none"
                            >
                              <option value="" className="dark:bg-[#FFF5EB]">-- Chọn tài xế --</option>
                              {drivers.length === 0 ? (
                                <option disabled className="dark:bg-[#FFF5EB] text-[#8B7E74]">⏳ Đang tải danh sách tài xế...</option>
                              ) : drivers.filter((d) => d.status === 'available').length === 0 ? (
                                <option disabled className="dark:bg-[#FFF5EB] text-[#8B7E74]">Không có tài xế khả dụng</option>
                              ) : (
                                drivers
                                  .filter((d) => d.status === 'available')
                                  .map((d) => (
                                    <option key={d.id} value={d.id} className="dark:bg-[#FFF5EB]">
                                      {d.name} ({d.vehicle.split('-')[0]})
                                    </option>
                                  ))
                              )}
                            </select>
                          )}
                          {order.driverId && (
                            <p className="text-[9px] text-[#E74C3C] dark:text-red-400 font-bold mt-1">🏍️ Đã chỉ định tài xế (ID: {order.driverId})</p>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 items-center justify-center">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full cursor-pointer"
                              >
                                Xác Nhận / Nấu Bánh
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => order.driverId ? onUpdateOrderStatus(order.id, 'shipping') : null}
                                className={`${order.driverId ? 'bg-sky-600 hover:bg-sky-700 cursor-pointer' : 'bg-sky-600/40 cursor-not-allowed'} text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full`}
                                title={!order.driverId ? 'Vui lòng chọn tài xế trước khi lên xe' : ''}
                              >
                                {order.driverId ? 'Xác Nhận Hoàn Tất Lên Xe' : '⚠️ Chọn tài xế trước'}
                              </button>
                            )}
                            {order.status === 'picked_up' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'shipping')}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full cursor-pointer"
                              >
                                Bắt Đầu Giao Hàng
                              </button>
                            )}
                            {order.status === 'shipping' && (
                              <>
                                <button
                                  onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full cursor-pointer"
                                >
                                  Xác Nhận Giao Xong ✅
                                </button>
                                {onUpdateOrderProgress && (
                                  <button
                                    onClick={() => {
                                      const routeMilestones = [
                                        { progress: 10, stage: 'Đang xếp cẩn thận thố bánh canh cá lóc nóng hổi lót lá chuối vào thùng giữ nhiệt.' },
                                        { progress: 25, stage: 'Xe đã lăn bánh ra đại lộ. Gió mát sầm sập, nước dùng củ nén sực nức thơm lừng.' },
                                        { progress: 45, stage: 'Đang chạy bon bon qua nhịp Cầu Trường Tiền bắc qua dòng sông Hương lững lờ.' },
                                        { progress: 65, stage: 'Đã bọc rẽ sang đoạn ngã năm tấp nập. Shipper ôm cua điệu nghệ.' },
                                        { progress: 85, stage: 'Đã đi vào ngõ hẻm tìm số nhà. Đang nhìn bảng chỉ đường chi tiết.' },
                                        { progress: 100, stage: 'Đang bấm chuông trước hiên nhà khách. Thố bánh khói tỏa nghi ngút đã cập bến.' }
                                      ];
                                      const currentProgress = order.deliveryProgress || 0;
                                      const nextMilestone = routeMilestones.find(m => m.progress > currentProgress);
                                      if (nextMilestone) {
                                        onUpdateOrderProgress(order.id, nextMilestone.progress, nextMilestone.stage);
                                      }
                                    }}
                                    className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full mt-1 flex items-center justify-center gap-0.5 cursor-pointer"
                                    title="Tăng nhanh tiến trình giao hàng theo từng mốc bản đồ định vị"
                                  >
                                    ⚡ Ship Nhanh ({
                                      (() => {
                                        const currentProgress = order.deliveryProgress || 0;
                                        const routeMilestones = [10, 25, 45, 65, 85, 100];
                                        const next = routeMilestones.find(p => p > currentProgress);
                                        return next ? `lên ${next}%` : '100%';
                                      })()
                                    })
                                  </button>
                                )}
                              </>
                            )}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => setOrderIdToCancel(order.id)}
                                className="text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-600 border border-red-200 dark:border-red-900/60 font-bold px-2 py-0.5 rounded text-[9px] text-center w-full cursor-pointer"
                              >
                                Hủy Đơn
                              </button>
                            )}
                            {(order.status === 'completed' || order.status === 'cancelled') && (
                              <span className="text-[9px] text-[#8B7E74] dark:text-[#8B7E74] italic">Giao dịch hoàn tất</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCT MANAGEMENT */}
        {adminTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">Quản Lý Sản Phẩm</h3>
                <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74] mt-0.5">Thêm, sửa, xóa món ăn trong thực đơn</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-[9px] px-2 py-1 rounded font-mono font-bold ${isBackendConnected ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                  {isBackendConnected ? '🟢 API Live' : '🟡 Local Only'}
                </span>
              </div>
            </div>

            {productSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl text-center font-bold">
                {productSuccess}
              </div>
            )}

            {productError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 text-xs rounded-xl text-center font-bold">
                {productError}
              </div>
            )}

            {/* Product Form */}
            <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">
                {editingProductId ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#E74C3C]" /> Sửa Sản Phẩm</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Sản Phẩm Mới</>}
              </h4>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên Món</label>
                  <input type="text" required placeholder="Bánh Canh Cá Lóc..."
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Giá (VNĐ)</label>
                  <input type="number" required min={0} step={1000} placeholder="45000"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Danh Mục</label>
                  <select value={productForm.categoryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__new__') {
                        setPendingNewCategory(true);
                        setAdminTab('categories');
                      } else {
                        setProductForm(prev => ({ ...prev, categoryName: val }));
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__new__">➕ Tạo danh mục mới...</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mô Tả</label>
                  <input type="text" placeholder="Mô tả món ăn..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Hình Ảnh</label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[180px]">
                      <input type="text" placeholder="https://... hoặc upload file bên cạnh"
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="file" accept="image/*" id="productImageUpload" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImage(true);
                          try {
                            const url = await ApiService.uploadImage(file, 'product_Image');
                            setProductForm(prev => ({ ...prev, imageUrl: url }));
                          } catch (err: any) {
                            setProductError(err.message || 'Lỗi upload ảnh');
                          } finally {
                            setUploadingImage(false);
                            e.target.value = '';
                          }
                        }} />
                      <label htmlFor="productImageUpload"
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap border ${uploadingImage ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed' : 'bg-[#E74C3C] text-white border-[#E74C3C] hover:bg-[#E74C3C]/90'}`}>
                        {uploadingImage ? '⏳ Đang tải...' : '📁 Upload'}
                      </label>
                      {productForm.imageUrl && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#E5E1D8] dark:border-[#D0C8C0] bg-[#FAF8F5] dark:bg-[#FFFBF5] shrink-0 flex items-center justify-center">
                          <img src={productForm.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '🍲'; }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                      className="w-4 h-4 accent-[#E74C3C]" />
                    <span className="text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26]">🔥 Bán chạy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isAvailable}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-4 h-4 accent-[#E74C3C]" />
                    <span className="text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26]">🟢 Còn hàng</span>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Thời Gian Chuẩn Bị (phút)</label>
                  <input type="number" min={1} placeholder="10"
                    value={productForm.preparationTime || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="flex gap-2 items-end justify-end md:col-span-3">
                  {editingProductId && (
                    <button type="button" onClick={resetProductForm}
                      className="px-4 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#D0C8C0] text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2 rounded-xl bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingProductId ? 'Cập Nhật' : 'Thêm Món'}
                  </button>
                </div>
              </form>
            </div>

            {/* Product List */}
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3">Ảnh</th>
                    <th className="p-3">Tên Món</th>
                    <th className="p-3">Danh Mục</th>
                    <th className="p-3 text-right">Giá</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-center">Bán Chạy</th>
                    <th className="p-3 text-right">TG CB</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {products.length === 0 ? (
                    <tr><td colSpan={8} className="p-6 text-center text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có sản phẩm nào.</td></tr>
                  ) : (products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3">
                        <span className="text-2xl">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerText = '🍲'; }} /> : '🍲'}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">{p.name}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-100 border-gray-200 dark:border-gray-200">
                          {p.categoryName || 'Khác'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#E74C3C]">{p.price.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-center">
                        {p.isAvailable
                          ? <span className="text-emerald-500 font-bold text-[10px]">✅ Còn hàng</span>
                          : <span className="text-red-400 font-bold text-[10px]">⛔ Hết hàng</span>}
                      </td>
                      <td className="p-3 text-center">{p.isBestSeller ? <span className="text-emerald-500 font-bold">🔥 Bán chạy</span> : '-'}</td>
                      <td className="p-3 text-right text-[#8B7E74] font-mono">{p.preparationTime || '-'} ph</td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleEditProduct(p)}
                            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer"
                            title="Sửa sản phẩm">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer"
                            title="Xóa sản phẩm">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DRIVER MANAGEMENT */}
        {adminTab === 'drivers' && (
          <><div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* List drivers */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">Danh Sách Tài Xế Nội Bộ</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((d) => (
                  <div key={d.id} className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] flex gap-3.5 items-start">
                    <div className="w-11 h-11 rounded-xl bg-[#E74C3C]/10 border border-[#E5E1D8] dark:border-[#E0D8D0] flex items-center justify-center text-xl shrink-0">
                      🛵
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">{d.name}</p>
                      <p className="text-[9px] text-[#E74C3C] font-mono">ID: {d.id}</p>
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74]">📞 {d.phone}</p>
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74] font-mono mt-0.5">{d.vehicle}</p>
                      <p className="text-[9px] text-[#8B7E74] dark:text-[#8B7E74] font-mono">{d.vehicleType || 'Xe máy'} | {d.vehiclePlate || 'Chưa có BS'}</p>

                      <div className="mt-3 flex gap-1.5 items-center flex-wrap">
                        <span className="text-[9px] text-[#8B7E74] dark:text-[#8B7E74]">Trạng thái:</span>
                        <select
                          value={d.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as Driver['status'];
                            if (isBackendConnected) {
                              try { await ApiService.updateDriverStatus(d.id, newStatus); } catch (err) { console.error(err); }
                            }
                            onUpdateDriverStatus(d.id, newStatus);
                          }}
                          className="text-[9px] p-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-none"
                        >
                          <option value="available" className="dark:bg-[#FFF8F0]">🟢 Rảnh rỗi</option>
                          <option value="busy" className="dark:bg-[#FFF8F0]">🔴 Bận chở bánh</option>
                          <option value="offline" className="dark:bg-[#FFF8F0]">⚫ Nghỉ phép/Offline</option>
                        </select>
                        <button onClick={() => handleEditDriverOpen(d)}
                          className="ml-1 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer"
                          title="Sửa tài xế"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteDriver(d.id)}
                          className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer"
                          title="Xoá tài xế"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create new driver */}
            <div className="lg:col-span-5 bg-[#F3F0E9] dark:bg-[#FFF0E0] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
              <h3 className="font-serif text-base font-bold text-[#2D241E] dark:text-[#2D241E] mb-3">🖊️ Đăng ký Shipper Mới</h3>
              <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74] mb-4">Thêm tài xế mới vào danh mục nội bộ của Bánh canh cá lóc miền Trung.</p>

              {driverSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl mb-4 text-center font-bold">
                  {driverSuccess}
                </div>
              )}

              <form onSubmit={handleAddDriverSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên Tài Xế:</label>
                  <input type="text" required placeholder="Nguyễn Văn A"
                    value={driverName} onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Số Điện Thoại:</label>
                  <input type="tel" required placeholder="0912xxxxx"
                    value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>

                <div className="border-t border-[#E5E1D8] dark:border-[#D0C8C0] pt-3 mt-1">
                  <p className="text-[10px] font-bold text-[#E74C3C] uppercase mb-2">🔑 Thông tin tài khoản đăng nhập</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên đăng nhập:</label>
                      <input type="text" required placeholder="driver_nguyenvanA"
                        value={driverUsername} onChange={(e) => setDriverUsername(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mật khẩu:</label>
                      <input type="password" required placeholder="••••••••"
                        value={driverPassword} onChange={(e) => setDriverPassword(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Email:</label>
                      <input type="email" required placeholder="driver@banhcanh.com"
                        value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Loại Xe:</label>
                    <select value={driverVehicleType} onChange={(e) => setDriverVehicleType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]">
                      <option value="Xe máy">Xe máy</option>
                      <option value="Xe tay ga">Xe tay ga</option>
                      <option value="Xe số">Xe số</option>
                      <option value="Ô tô">Ô tô</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Biển Số Xe:</label>
                    <input type="text" placeholder="59-X1 123.45"
                      value={driverVehiclePlate} onChange={(e) => setDriverVehiclePlate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Màu Xe:</label>
                  <input type="text" placeholder="Đen - Trắng"
                    value={driverVehicleColor} onChange={(e) => setDriverVehicleColor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Ảnh Đại Diện:</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="https://... hoặc upload file"
                      value={driverAvatarUrl} onChange={(e) => setDriverAvatarUrl(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    <input type="file" accept="image/*" id="driverAvatarUpload" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingDriverAvatar(true);
                        try {
                          const url = await ApiService.uploadImage(file, 'avatar_Image');
                          setDriverAvatarUrl(url);
                          onShowToast?.('Tải ảnh lên S3 thành công', 'success', 'Avatar');
                        } catch (err: any) {
                          onShowToast?.(err.message || 'Không thể tải ảnh lên S3', 'error', 'Avatar');
                        } finally {
                          setUploadingDriverAvatar(false);
                          e.target.value = '';
                        }
                      }} />
                    <label htmlFor="driverAvatarUpload" className="px-3 py-2.5 rounded-lg border border-[#E5E1D8] text-xs font-bold cursor-pointer hover:bg-gray-50">
                      {uploadingDriverAvatar ? '⏳' : '📁'}
                    </label>
                    {driverAvatarUrl && <img src={driverAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border" />}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Phương Tiện (mô tả):</label>
                  <input type="text" placeholder="Dream lùn - 43C1-999.99"
                    value={driverVehicle} onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>

                <button type="submit"
                  className="w-full bg-[#E74C3C] hover:bg-[#C0392B] dark:bg-[#E74C3C] dark:hover:bg-[#C0392B] text-white dark:text-white text-center py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer">
                  🚀 Thêm Shipper Vào Hệ Thống
                </button>
              </form>
            </div>

          </div>

          {driverEditModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#E74C3C]/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white dark:bg-[#FFF5EB] rounded-2xl max-w-md w-full p-6 border border-[#E5E1D8] dark:border-[#E0D8D0] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 border-b border-[#E5E1D8] pb-3">
                  {driverEditForm.avatarUrl ? (
                    <img src={driverEditForm.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#E74C3C]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F3F0E9] flex items-center justify-center text-lg">🛵</div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E]">✏️ Sửa Thông Tin Tài Xế</h4>
                    <p className="text-[10px] text-[#8B7E74]">{driverEditForm.name || driverEditModal.name}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Tên</label>
                      <input type="text" value={driverEditForm.name} onChange={e => setDriverEditForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">SĐT</label>
                      <input type="text" value={driverEditForm.phone} onChange={e => setDriverEditForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Loại xe</label>
                      <select value={driverEditForm.vehicleType} onChange={e => setDriverEditForm(p => ({ ...p, vehicleType: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]">
                        <option value="Xe máy">Xe máy</option>
                        <option value="Xe tay ga">Xe tay ga</option>
                        <option value="Xe số">Xe số</option>
                        <option value="Ô tô">Ô tô</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Biển số</label>
                      <input type="text" value={driverEditForm.vehiclePlate} onChange={e => setDriverEditForm(p => ({ ...p, vehiclePlate: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Màu xe</label>
                      <input type="text" value={driverEditForm.vehicleColor} onChange={e => setDriverEditForm(p => ({ ...p, vehicleColor: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Mô tả</label>
                      <input type="text" value={driverEditForm.vehicle} onChange={e => setDriverEditForm(p => ({ ...p, vehicle: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                  </div>
                  <div className="border-t border-[#E5E1D8] pt-3">
                    <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Ảnh đại diện</label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="text" placeholder="URL ảnh..."
                        value={driverEditForm.avatarUrl} onChange={e => setDriverEditForm(p => ({ ...p, avatarUrl: e.target.value }))}
                        className="flex-1 text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                      <input type="file" accept="image/*" id="driverEditAvatarUpload" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await ApiService.uploadImage(file, 'avatar_Image');
                            setDriverEditForm(p => ({ ...p, avatarUrl: url }));
                            onShowToast?.('Tải ảnh lên S3 thành công', 'success', 'Avatar');
                          } catch (err: any) {
                            onShowToast?.(err.message || 'Không thể tải ảnh lên S3', 'error', 'Avatar');
                          }
                          e.target.value = '';
                        }} />
                      <label htmlFor="driverEditAvatarUpload" className="px-3 py-2.5 rounded-lg border border-[#E5E1D8] text-xs font-bold cursor-pointer hover:bg-gray-50">📁</label>
                    </div>
                  </div>
                  <div className="border-t border-[#E5E1D8] pt-3">
                    <label className="text-[10px] font-bold text-[#E74C3C] uppercase">🔑 Đổi mật khẩu</label>
                    <p className="text-[8px] text-[#8B7E74] mb-1">Để trống nếu không muốn đổi</p>
                    <input type="password" placeholder="Mật khẩu mới..."
                      value={driverEditForm.password} onChange={e => setDriverEditForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] bg-white text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setEditingDriverId(null); setDriverEditModal(null); }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer">Hủy</button>
                  <button onClick={handleEditDriverSave}
                    className="flex-1 bg-[#E74C3C] hover:bg-[#C0392B] text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm">Lưu thay đổi</button>
                </div>
              </div>
            </div>
          )}
          </>)}
        {/* TAB: CATEGORIES - Full CRUD */}
        {adminTab === 'categories' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">📂 Quản Lý Danh Mục</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Các danh mục món ăn trong thực đơn</p>

            <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">
                {editingCategoryId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#E74C3C]" /> Sửa Danh Mục</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Danh Mục Mới</>}
              </h4>
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên Danh Mục</label>
                    <input type="text" required placeholder="Ví dụ: Món Mới"
                      value={categoryForm.name}
                      onChange={(e) => {
                        const n = e.target.value;
                        setCategoryForm(prev => ({ ...prev, name: n, slug: toSlug(n) }));
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Slug</label>
                    <input type="text" placeholder="mon-moi"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mô tả</label>
                  <input type="text" placeholder="Danh mục các món mới"
                    value={categoryForm.description || ''}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Thứ tự</label>
                    <input type="number" min={0} placeholder="0"
                      value={categoryForm.displayOrder ?? 0}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Ảnh URL</label>
                    <input type="text" placeholder="https://..."
                      value={categoryForm.imageUrl || ''}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={categoryForm.isActive !== false}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-[#E74C3C]" />
                      <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26]">Kích hoạt</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {editingCategoryId !== null && (
                    <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', slug: '', description: '', imageUrl: '', displayOrder: 0, isActive: true }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#D0C8C0] text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingCategoryId !== null ? 'Cập Nhật' : 'Thêm Danh Mục'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3">Tên Danh Mục</th>
                    <th className="p-3">Mô tả</th>
                    <th className="p-3 text-center">Thứ tự</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-center">Số SP</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">{cat.name}</td>
                      <td className="p-3 text-[10px] text-[#8B7E74] max-w-[200px] truncate">{cat.description || '—'}</td>
                      <td className="p-3 text-center text-[#8B7E74]">{cat.displayOrder ?? 0}</td>
                      <td className="p-3 text-center">{cat.isActive !== false
                        ? <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Đang chạy</span>
                        : <span className="text-[9px] bg-gray-100 dark:bg-gray-100/30 text-gray-500 px-2 py-0.5 rounded-full font-bold">Ẩn</span>}</td>
                      <td className="p-3 text-center text-[#E74C3C] font-bold">{cat.count}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleEditCategory(cat)}
                            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: TOPPINGS - Full CRUD */}
        {adminTab === 'toppings' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🧂 Quản Lý Các Lựa Chọn</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Topping, Size, Đường, Đá, Loại Cà Phê, Loại Sợi — gắn với từng sản phẩm</p>

            <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">
                {editingToppingId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#E74C3C]" /> Sửa Tuỳ Chọn</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Tuỳ Chọn Mới</>}
              </h4>
              <form onSubmit={handleToppingSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Sản Phẩm</label>
                  <select value={toppingForm.productId}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, productId: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]">
                    {products.map(p => <option key={p.id} value={Number(p.id)}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Nhóm</label>
                  {showNewGroupInput ? (
                    <div className="flex gap-1">
                      <input type="text" placeholder="Nhập tên nhóm mới..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                      <button type="button" onClick={() => addCustomGroup(newGroupName)}
                        className="px-2.5 py-2 rounded-lg bg-[#E74C3C] text-white text-xs font-bold hover:opacity-90 cursor-pointer">+</button>
                      <button type="button" onClick={() => { setShowNewGroupInput(false); setNewGroupName(''); }}
                        className="px-2 py-2 rounded-lg border border-[#E5E1D8] text-xs font-bold cursor-pointer hover:bg-gray-100">✕</button>
                    </div>
                  ) : (
                    <select value={toppingForm.optionGroup}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') { setShowNewGroupInput(true); return; }
                        setToppingForm(prev => ({ ...prev, optionGroup: e.target.value }));
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]">
                      <option value="topping">Topping</option>
                      <option value="size">Size</option>
                      <option value="sugar">Đường</option>
                      <option value="ice">Đá</option>
                      <option value="coffee_type">Loại Cà Phê</option>
                      <option value="noodle">Loại Sợi</option>
                      {customOptionGroups.map(g => (
                        <option key={g} value={g}>{optionGroupLabels[g] || g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                      <option value="__add_new__" className="text-[#E74C3C] font-bold">+ Thêm nhóm mới...</option>
                    </select>
                  )}
                </div>
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên Tuỳ Chọn</label>
                  <input type="text" required placeholder="Thêm Trứng Cút"
                    value={toppingForm.name}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1 min-w-[100px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Giá <span className="text-gray-400 font-normal">(0 = miễn phí)</span></label>
                  <input type="number" min={0} placeholder="15000"
                    value={toppingForm.price ?? ''}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1 min-w-[80px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Thứ Tự</label>
                  <input type="number" min={0} placeholder="1"
                    value={toppingForm.displayOrder}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="flex items-center gap-3 pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={toppingForm.isRequired}
                      onChange={(e) => setToppingForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="w-4 h-4 accent-[#E74C3C]" />
                    <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26]">Bắt buộc</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={toppingForm.isActive}
                      onChange={(e) => setToppingForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-[#E74C3C]" />
                    <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26]">Hoạt động</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  {editingToppingId !== null && (
                    <button type="button" onClick={() => { setEditingToppingId(null); setToppingForm({ productId: 1, name: '', optionGroup: 'topping', price: 0, isRequired: false, displayOrder: 1, isActive: true }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#D0C8C0] text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingToppingId !== null ? 'Cập Nhật' : 'Thêm Tuỳ Chọn'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3">Sản Phẩm</th>
                    <th className="p-3">Tên</th>
                    <th className="p-3">Nhóm</th>
                    <th className="p-3 text-right">Giá</th>
                    <th className="p-3 text-center">Thứ Tự</th>
                    <th className="p-3 text-center">Bắt Buộc</th>
                    <th className="p-3 text-center">Kích Hoạt</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {toppings.map(t => (
                    <tr key={t.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3 text-[#2D241E] dark:text-[#2D241E] font-medium">{t.productName}</td>
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">{t.name}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${optionGroupColors[t.optionGroup] || 'bg-gray-100 text-gray-700'}`}>
                          {optionGroupLabels[t.optionGroup] || t.optionGroup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#E74C3C]">{t.price.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3 text-center text-[#3E2F26]">{t.displayOrder}</td>
                      <td className="p-3 text-center">{t.isRequired ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-gray-400">—</span>}</td>
                      <td className="p-3 text-center">{t.isActive ? <span className="text-emerald-500 font-bold text-[11px]">✓</span> : <span className="text-red-400">✗</span>}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleEditTopping(t)}
                            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTopping(t.id)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PROMOTIONS - Full CRUD */}
        {adminTab === 'promotions' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🏷️ Quản Lý Khuyến Mãi</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Mã giảm giá và chương trình ưu đãi</p>

            <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">
                {editingPromoId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#E74C3C]" /> Sửa Khuyến Mãi</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Khuyến Mãi</>}
              </h4>
              <form onSubmit={handlePromoSubmit} className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mã</label>
                    <input type="text" required placeholder="WELCOME10"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên</label>
                    <input type="text" required placeholder="Giảm 10% khách mới"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Loại</label>
                    <select value={promoForm.discount_type}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, discount_type: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]">
                      <option value="percentage">%</option>
                      <option value="fixed">VNĐ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Giá Trị</label>
                    <input type="number" required min={0} placeholder="10"
                      value={promoForm.discount_value || ''}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Đơn Tối Thiểu</label>
                    <input type="number" min={0} placeholder="100000"
                      value={promoForm.min_order_amount || ''}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Giảm Tối Đa</label>
                    <input type="number" min={0} placeholder="50000"
                      value={promoForm.max_discount || ''}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, max_discount: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Số Lượt</label>
                    <input type="number" min={1} placeholder="100"
                      value={promoForm.usage_limit || ''}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, usage_limit: Number(e.target.value) }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={promoForm.isActive}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-[#E74C3C]" />
                      <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26]">Kích hoạt</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mô tả</label>
                    <textarea placeholder="Giảm giá cho khách hàng mới..."
                      value={promoForm.description}
                      onChange={(e) => setPromoForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C] resize-none" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Từ ngày (giờ)</label>
                      <input type="datetime-local" value={promoForm.start_date}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Đến ngày (giờ)</label>
                      <input type="datetime-local" value={promoForm.end_date}
                        onChange={(e) => setPromoForm(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {editingPromoId !== null && (
                    <button type="button" onClick={() => { setEditingPromoId(null); setPromoForm({ code: '', name: '', description: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0, max_discount: 0, usage_limit: 100, start_date: defaultPromoDate().start, end_date: defaultPromoDate().end, isActive: true }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#D0C8C0] text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingPromoId !== null ? 'Cập Nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map(p => (
                <div key={p.id} className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] gap-3 relative">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">🏷️</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">{p.name}</h4>
                        {p.isActive !== false
                          ? <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Đang chạy</span>
                          : <span className="text-[8px] bg-gray-100 dark:bg-gray-100/30 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Tạm dừng</span>}
                      </div>
                      <p className="text-[10px] font-mono text-[#E74C3C] font-bold">{p.code}</p>
                      {p.description && <p className="text-[9px] text-[#8B7E74] mt-0.5">{p.description}</p>}
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74] mt-1">
                        {p.discount_type === 'percentage' ? `Giảm ${p.discount_value}%` : `Giảm ${p.discount_value.toLocaleString('vi-VN')}đ`}
                        {p.max_discount ? ` (tối đa ${p.max_discount.toLocaleString('vi-VN')}đ)` : ''} • Đơn từ {p.min_order_amount.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-[8px] text-[#8B7E74] mt-1">
                        {p.start_date ? `📅 ${new Date(p.start_date).toLocaleString('vi-VN')}` : ''}
                        {p.end_date ? ` → ${new Date(p.end_date).toLocaleString('vi-VN')}` : ''}
                        {p.usage_limit ? ` • Đã dùng ${p.used_count || 0}/${p.usage_limit}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleEditPromo(p)}
                        className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeletePromo(p.id)}
                        className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3">Mã</th>
                    <th className="p-3">Tên</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Đã Dùng</th>
                    <th className="p-3 text-center">Hiệu Lực</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {promotions.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-[#8B7E74] italic">Chưa có khuyến mãi nào.</td></tr>
                  ) : (promotions.map(p => {
                    const now = new Date();
                    const end = p.end_date ? new Date(p.end_date) : null;
                    const expired = end && end < now;
                    const full = p.usage_limit ? (p.used_count || 0) >= p.usage_limit : false;
                    let statusLabel: string, statusColor: string;
                    if (expired) { statusLabel = 'Hết hạn'; statusColor = 'bg-gray-200 text-gray-600'; }
                    else if (full) { statusLabel = 'Hết lượt'; statusColor = 'bg-red-100 text-red-700'; }
                    else if (p.isActive === false) { statusLabel = 'Tạm dừng'; statusColor = 'bg-yellow-100 text-yellow-700'; }
                    else { statusLabel = 'Đang chạy'; statusColor = 'bg-emerald-100 text-emerald-700'; }
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#E74C3C]">{p.code}</td>
                        <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">{p.name}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor}`}>{statusLabel}</span>
                        </td>
                        <td className="p-3 text-center text-[#3E2F26]">
                          {p.usage_limit
                            ? `${p.used_count || 0} / ${p.usage_limit}`
                            : `${p.used_count || 0}`}
                        </td>
                        <td className="p-3 text-center text-[#8B7E74] text-[10px]">
                          {p.start_date ? new Date(p.start_date).toLocaleString('vi-VN') : '—'}
                          {p.end_date ? ` → ${new Date(p.end_date).toLocaleString('vi-VN')}` : ''}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button onClick={() => handleEditPromo(p)}
                              className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePromo(p.id)}
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: REVIEWS - Full CRUD */}
        {adminTab === 'reviews' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">⭐ Đánh Giá Khách Hàng</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Phản hồi từ thực khách</p>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26] min-w-[900px]">
                  <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3 text-center">Đánh Giá</th>
                      <th className="p-3">Nhận Xét</th>
                      <th className="p-3 text-center">Hình</th>
                      <th className="p-3 text-center">Duyệt</th>
                      <th className="p-3">Phản hồi</th>
                      <th className="p-3">Ngày</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                    {reviews.length === 0 ? (
                      <tr><td colSpan={9} className="p-6 text-center text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có đánh giá nào.</td></tr>
                    ) : (reviews.map(r => (
                      <tr key={r.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                        <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">{r.customer}</td>
                        <td className="p-3">{r.product}</td>
                        <td className="p-3 text-center text-red-500">{'⭐'.repeat(r.rating)}</td>
                        <td className="p-3 text-[#8B7E74] max-w-[180px] truncate" title={r.comment}>{r.comment}</td>
                        <td className="p-3 text-center">
                          {r.imageUrl
                            ? <img src={r.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#E5E1D8] dark:border-[#E0D8D0]" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            : <span className="text-[#8B7E74]">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {r.isApproved
                            ? <span className="text-emerald-500 font-bold text-[10px]">✅ Đã duyệt</span>
                            : <button onClick={() => handleApproveReview(r.id)} className="text-[10px] bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">Duyệt</button>}
                        </td>
                        <td className="p-3 max-w-[150px]">
                          {r.adminReply ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 line-clamp-2" title={r.adminReply}>
                              💬 {r.adminReply}
                            </span>
                          ) : (
                            <button onClick={() => {
                              const reply = window.prompt('Nhập phản hồi cho đánh giá này:', '');
                              if (reply) {
                                const updated = reviews.map(rv => rv.id === r.id ? { ...rv, adminReply: reply } : rv);
                                setReviews(updated);
                                if (isBackendConnected) {
                                  ApiService.updateReview(String(r.id), { adminReply: reply }).catch(() => {});
                                }
                              }
                            }} className="text-[10px] text-[#E74C3C] hover:underline cursor-pointer font-bold">Trả lời</button>
                          )}
                        </td>
                        <td className="p-3 text-[10px] text-[#8B7E74] font-mono">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5 justify-center">
                            <button onClick={() => handleEditReview(r)}
                              className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteReview(r.id)}
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
              </table>
            </div>
          </div>
        )}
        {/* TAB: INVOICES */}
        {adminTab === 'invoices' && (
          <div className="space-y-6">
            {invoiceSuccess && <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl text-center font-bold">{invoiceSuccess}</div>}
            {invoiceError && <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 text-xs rounded-xl text-center font-bold">{invoiceError}</div>}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🧾 Hóa Đơn</h3>
                <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Xuất hóa đơn cho đơn hàng đã hoàn thành</p>
              </div>
              <div className="text-xs text-[#8B7E74] dark:text-[#8B7E74] bg-[#F3F0E9] dark:bg-[#FFF0E0] px-3 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#E0D8D0]">
                Tổng: {invoices.length} hóa đơn
              </div>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3">Số HĐ</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Mã số thuế</th>
                    <th className="p-3">Tiền thuế</th>
                    <th className="p-3">Thành Tiền</th>
                    <th className="p-3">Thanh Toán</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3">Ngày Xuất</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={9} className="p-6 text-center text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có hóa đơn nào.</td></tr>
                  ) : (invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#E74C3C] text-[11px]">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#2D241E]">
                        {inv.customerName}
                        <span className="block text-[9px] text-[#8B7E74] font-normal">{inv.customerPhone}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-[#8B7E74]">{inv.customerTaxCode || '—'}</td>
                      <td className="p-3 font-mono text-[10px] text-[#8B7E74]">{inv.taxAmount > 0 ? inv.taxAmount.toLocaleString('vi-VN') + 'đ' : '—'}</td>
                      <td className="p-3 font-mono font-bold text-[#2D241E] dark:text-[#2D241E]">{inv.totalAmount.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 capitalize">
                          {inv.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : inv.paymentMethod === 'banking' ? 'Chuyển khoản' : inv.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          inv.status === 'issued' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' :
                          inv.status === 'cancelled' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' :
                          'bg-gray-50 dark:bg-gray-100/30 text-gray-700 dark:text-gray-600 border-gray-200 dark:border-gray-200/50'
                        }`}>
                          {inv.status === 'issued' ? 'Đã xuất' : inv.status === 'cancelled' ? 'Đã hủy' : 'Chờ'}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-[#8B7E74] font-mono">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleViewInvoice(inv)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer"
                            title="Xem chi tiết">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {inv.status === 'issued' && (
                            <button onClick={() => handleCancelInvoice(inv.id)}
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer"
                              title="Hủy hóa đơn">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">📋 Xuất Hóa Đơn Cho Đơn Hàng</h4>
              <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74] mb-3">Chọn đơn hàng đã hoàn thành để xuất hóa đơn</p>
              <div className="flex gap-2 flex-wrap">
                {orders.filter(o => o.status === 'completed' && !invoices.some(inv => inv.orderId === Number(o.id))).slice(0, 10).map(o => (
                  <button key={o.id} onClick={() => handleCreateInvoice(Number(o.id))}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer">
                    #{o.id} - {o.customerName} ({o.totalAmount.toLocaleString('vi-VN')}đ)
                  </button>
                ))}
                {orders.filter(o => o.status === 'completed').length === 0 && (
                  <p className="text-xs text-[#8B7E74] italic">Chưa có đơn hàng hoàn thành nào để xuất hóa đơn</p>
                )}
                {orders.filter(o => o.status === 'completed').length > 0 && invoices.some(inv => orders.filter(o => o.status === 'completed').some(o => inv.orderId === Number(o.id))) && (
                  <p className="text-xs text-[#8B7E74] italic">Tất cả đơn hoàn thành đã có hóa đơn</p>
                )}
              </div>
            </div>

            {/* Invoice Detail Modal */}
            {viewingInvoice && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#E74C3C]/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white dark:bg-[#FFF5EB] rounded-2xl max-w-lg w-full p-6 border border-[#E5E1D8] dark:border-[#E0D8D0] shadow-2xl space-y-4 transform scale-100 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2D241E] dark:text-[#2D241E]">🧾 Hóa Đơn</h4>
                      <p className="text-[10px] text-[#8B7E74] font-mono">{viewingInvoice.invoiceNumber}</p>
                    </div>
                    <button onClick={() => setViewingInvoice(null)}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0E9] dark:hover:bg-[#E5DDD5] cursor-pointer">
                      <X className="w-4 h-4 text-[#8B7E74]" />
                    </button>
                  </div>

                  <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] rounded-xl p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Khách hàng</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{viewingInvoice.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Số điện thoại</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{viewingInvoice.customerPhone || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-[#8B7E74]">Địa chỉ</p>
                        <p className="text-[#2D241E] dark:text-[#2D241E]">{viewingInvoice.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Số series</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{viewingInvoice.invoiceSeries || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Mã số thuế</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{viewingInvoice.customerTaxCode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Thanh toán</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E] capitalize">
                          {viewingInvoice.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : viewingInvoice.paymentMethod === 'banking' ? 'Chuyển khoản' : viewingInvoice.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#8B7E74]">Ngày xuất</p>
                        <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">
                          {viewingInvoice.issuedAt ? new Date(viewingInvoice.issuedAt).toLocaleDateString('vi-VN') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#8B7E74]">
                      <span>Tạm tính</span>
                      <span>{viewingInvoice.subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {viewingInvoice.discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span>Giảm giá</span>
                        <span>-{viewingInvoice.discountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {viewingInvoice.shippingFee > 0 && (
                      <div className="flex justify-between text-xs text-[#8B7E74]">
                        <span>Phí giao hàng</span>
                        <span>{viewingInvoice.shippingFee.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {viewingInvoice.taxRate > 0 && (
                      <div className="flex justify-between text-xs text-[#8B7E74]">
                        <span>Thuế ({viewingInvoice.taxRate}%)</span>
                        <span>{viewingInvoice.taxAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="border-t border-[#E5E1D8] dark:border-[#E0D8D0] pt-2 flex justify-between text-sm font-bold text-[#2D241E] dark:text-[#2D241E]">
                      <span>Tổng cộng</span>
                      <span className="text-[#E74C3C]">{viewingInvoice.totalAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { window.print(); }}
                      className="flex-1 bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      🖨️ In hóa đơn
                    </button>
                    <button onClick={() => setViewingInvoice(null)}
                      className="flex-1 border border-[#E5E1D8] dark:border-[#D0C8C0] text-[#3E2F26] dark:text-[#3E2F26] py-2 rounded-xl text-xs font-bold transition-all hover:bg-[#F3F0E9] dark:hover:bg-[#E8E0D8] cursor-pointer">
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: STATISTICS */}
        {adminTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">📊 Thống Kê Kinh Doanh</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Tổng quan tình hình bán hàng</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng Đơn Hàng', value: orders.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' },
                { label: 'Đã Hoàn Thành', value: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' },
                { label: 'Đang Xử Lý', value: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' },
                { label: 'Đã Hủy', value: orders.filter(o => o.status === 'cancelled').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' },
              ].map((s, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${s.bg}`}>
                  <p className="text-[10px] font-bold text-[#8B7E74] dark:text-[#8B7E74] uppercase">{s.label}</p>
                  <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">💰 Doanh Thu</h4>
                <p className="text-2xl font-black text-[#E74C3C]">
                  {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[10px] text-[#8B7E74] mt-1">Tổng doanh thu từ các đơn hoàn thành</p>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">🛵 Tài Xế</h4>
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-black text-emerald-500">{drivers.filter(d => d.status === 'available').length}</p>
                    <p className="text-[10px] text-[#8B7E74]">Rảnh</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-500">{drivers.filter(d => d.status === 'busy').length}</p>
                    <p className="text-[10px] text-[#8B7E74]">Bận</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-[#8B7E74]">{drivers.filter(d => d.status === 'offline').length}</p>
                    <p className="text-[10px] text-[#8B7E74]">Offline</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">🔥 Sản Phẩm Bán Chạy</h4>
              <div className="space-y-2">
                {products.filter(p => p.isBestSeller).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-[#FFF8F0] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-[#E74C3C]">#{i + 1}</span>
                      <span className="text-xs font-bold text-[#2D241E] dark:text-[#2D241E]">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#E74C3C]">{p.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                {products.filter(p => p.isBestSeller).length === 0 && (
                  <p className="text-xs text-[#8B7E74] italic text-center py-4">Chưa có sản phẩm bán chạy nào</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PERMISSIONS & ROLE MANAGER (Super Admin only) */}
        {/* TAB: DELIVERY AREAS */}
        {adminTab === 'delivery-areas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🗺️ Khu Vực Giao Hàng</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">{deliveryAreas.length} khu vực</span>
            </div>

            {deliveryAreaError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs p-3 rounded-xl">{deliveryAreaError}</div>
            )}

            <div className="bg-[#F3F0E9] dark:bg-[#FFF9F2] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] space-y-3">
              <h4 className="text-sm font-bold text-[#2D241E] dark:text-[#2D241E]">{editingDeliveryAreaId ? 'Sửa Khu Vực' : 'Thêm Khu Vực Mới'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Tên khu vực</label>
                  <input type="text" value={deliveryAreaForm.name} onChange={e => setDeliveryAreaForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Nội thành Q1" className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Vĩ độ (centerLat)</label>
                  <input type="number" step="0.0001" value={deliveryAreaForm.centerLat} onChange={e => setDeliveryAreaForm(p => ({ ...p, centerLat: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Kinh độ (centerLng)</label>
                  <input type="number" step="0.0001" value={deliveryAreaForm.centerLng} onChange={e => setDeliveryAreaForm(p => ({ ...p, centerLng: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Bán kính (km)</label>
                  <input type="number" step="0.5" value={deliveryAreaForm.radiusKm} onChange={e => setDeliveryAreaForm(p => ({ ...p, radiusKm: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Phí cơ bản (đ)</label>
                  <input type="number" value={deliveryAreaForm.baseFee} onChange={e => setDeliveryAreaForm(p => ({ ...p, baseFee: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Phí/km thêm (đ)</label>
                  <input type="number" value={deliveryAreaForm.feePerKm} onChange={e => setDeliveryAreaForm(p => ({ ...p, feePerKm: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Khoảng cách tối đa (km)</label>
                  <input type="number" step="0.5" value={deliveryAreaForm.maxDistanceKm} onChange={e => setDeliveryAreaForm(p => ({ ...p, maxDistanceKm: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveDeliveryArea} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                  {editingDeliveryAreaId ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editingDeliveryAreaId && (
                  <button onClick={() => { setEditingDeliveryAreaId(null); setDeliveryAreaForm({ name: '', centerLat: 10.8231, centerLng: 106.6297, radiusKm: 5, baseFee: 15000, feePerKm: 5000, maxDistanceKm: 15 }); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                    Hủy
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {deliveryAreas.length === 0 ? (
                <p className="text-center py-8 text-xs text-[#8B7E74] italic">Chưa có khu vực giao hàng nào.</p>
              ) : (
                deliveryAreas.map(area => (
                  <div key={area.id} className="p-3 bg-[#FAF8F5] dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-xl flex items-center justify-between">
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">{area.name}</p>
                      <p className="text-[#8B7E74]">Bán kính {area.radiusKm}km | Phí CB: {area.baseFee.toLocaleString('vi-VN')}đ | Phí/km: {area.feePerKm.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditDeliveryArea(area)} className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteDeliveryArea(area.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: MEMBERSHIP TIERS */}
        {adminTab === 'membership-tiers' && isAdminOrSuper && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🏅 Hạng Thành Viên</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">{membershipTiers.length} hạng · {apiUsers.length} thành viên</span>
            </div>

            {membershipTierError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs p-3 rounded-xl">{membershipTierError}</div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1 border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-2">
              {(['tiers', 'members', 'vouchers'] as const).map(st => {
                const labels: Record<string, string> = { tiers: '📋 Hạng', members: '👥 Thành viên', vouchers: '🎫 Voucher' };
                return (
                  <button key={st} onClick={() => setMembershipSubTab(st)}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-bold cursor-pointer transition-all ${membershipSubTab === st ? 'bg-[#E74C3C] text-white' : 'bg-[#F3F0E9] dark:bg-[#FFF0E0] text-[#3E2F26] hover:bg-[#E5E1D8]'}`}>
                    {labels[st]}
                  </button>
                );
              })}
            </div>

            {/* TAB: Hạng */}
            {membershipSubTab === 'tiers' && (
              <div className="space-y-3">
                <div className="bg-[#F3F0E9] dark:bg-[#FFF9F2] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] space-y-3">
                  <h4 className="text-sm font-bold text-[#2D241E] dark:text-[#2D241E]">{editingMembershipTierId ? 'Sửa Hạng' : 'Thêm Hạng Mới'}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Mã hạng</label>
                      <input type="text" value={membershipTierForm.name} onChange={e => setMembershipTierForm(p => ({ ...p, name: e.target.value }))} placeholder="vip" className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Tên hiển thị</label>
                      <input type="text" value={membershipTierForm.displayName} onChange={e => setMembershipTierForm(p => ({ ...p, displayName: e.target.value }))} placeholder="VIP" className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Chi tiêu tối thiểu</label>
                      <input type="number" value={membershipTierForm.minTotalSpent} onChange={e => setMembershipTierForm(p => ({ ...p, minTotalSpent: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Số đơn tối thiểu</label>
                      <input type="number" value={membershipTierForm.minTotalOrders} onChange={e => setMembershipTierForm(p => ({ ...p, minTotalOrders: parseInt(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Giảm tự động (%)</label>
                      <input type="number" step="0.1" value={membershipTierForm.autoDiscountPercent} onChange={e => setMembershipTierForm(p => ({ ...p, autoDiscountPercent: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Số voucher</label>
                      <input type="number" value={membershipTierForm.voucherCount} onChange={e => setMembershipTierForm(p => ({ ...p, voucherCount: parseInt(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Giảm voucher (%)</label>
                      <input type="number" step="0.1" value={membershipTierForm.voucherDiscountPercent} onChange={e => setMembershipTierForm(p => ({ ...p, voucherDiscountPercent: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveMembershipTier} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                      {editingMembershipTierId ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                    {editingMembershipTierId && (
                      <button onClick={() => { setEditingMembershipTierId(null); setMembershipTierForm({ name: '', displayName: '', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 }); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                        Hủy
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {membershipTiers.length === 0 ? (
                    <p className="text-center py-8 text-xs text-[#8B7E74] italic">Chưa có hạng thành viên nào.</p>
                  ) : (
                    membershipTiers.map(tier => (
                      <div key={tier.id} className="p-3 bg-[#FAF8F5] dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-xl flex items-center justify-between">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">{tier.displayName} <span className="text-[#8B7E74] font-mono">({tier.name})</span></p>
                          <p className="text-[#8B7E74]">Giảm {tier.autoDiscountPercent}% | {tier.voucherCount} voucher {tier.voucherDiscountPercent}% | Chi tiêu {tier.minTotalSpent.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEditMembershipTier(tier)} className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteMembershipTier(tier.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: Thành viên */}
            {membershipSubTab === 'members' && (
              <div className="space-y-2">
                {membershipTiers.map(tier => {
                  const tierUsers = usersByTier[tier.id] || [];
                  return (
                    <details key={tier.id} className="bg-[#FAF8F5] dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-xl overflow-hidden">
                      <summary className="px-4 py-3 font-bold text-sm text-[#2D241E] dark:text-[#2D241E] cursor-pointer hover:bg-[#F3F0E9] flex items-center gap-2">
                        {tier.displayName} <span className="text-[10px] font-normal text-[#8B7E74]">({tierUsers.length} thành viên)</span>
                      </summary>
                      {tierUsers.length === 0 ? (
                        <p className="px-4 pb-3 text-xs text-[#8B7E74] italic">Chưa có thành viên nào.</p>
                      ) : (
                        <div className="px-4 pb-3 space-y-1.5">
                          {tierUsers.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-[#F3F0E9] last:border-0">
                              <div className="text-xs">
                                <p className="font-semibold text-[#2D241E]">{u.fullName || u.username || u.email}</p>
                                <p className="text-[10px] text-[#8B7E74]">{u.phone || u.email} · {u.total_orders || 0} đơn · {((u.total_spent || 0)).toLocaleString('vi-VN')}đ</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">{(u.isActive ? 'Hoạt động' : 'Không hoạt động')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  );
                })}
                {membershipTiers.length === 0 && (
                  <p className="text-center py-8 text-xs text-[#8B7E74] italic">Chưa có hạng thành viên nào.</p>
                )}
              </div>
            )}

            {/* TAB: Voucher */}
            {membershipSubTab === 'vouchers' && (
              <div className="space-y-3">
                {/* Create voucher form */}
                <div className="bg-[#F3F0E9] dark:bg-[#FFF9F2] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] space-y-3">
                  <h4 className="text-sm font-bold text-[#2D241E] dark:text-[#2D241E]">🎫 Cấp Voucher</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Hạng</label>
                      <select value={newVoucherForm.tierId} onChange={e => { setNewVoucherForm(p => ({ ...p, tierId: parseInt(e.target.value) })); setSelectedVoucherUserIds(new Set()); }} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500">
                        {membershipTiers.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Mã (để trống tự sinh)</label>
                      <input type="text" value={newVoucherForm.code} onChange={e => setNewVoucherForm(p => ({ ...p, code: e.target.value }))} placeholder="VD: SUMMER2026" className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Giảm (%)</label>
                      <input type="number" value={newVoucherForm.discountPercent} onChange={e => setNewVoucherForm(p => ({ ...p, discountPercent: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Giảm tối đa (₫)</label>
                      <input type="number" value={newVoucherForm.maxDiscount} onChange={e => setNewVoucherForm(p => ({ ...p, maxDiscount: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Đơn tối thiểu (₫)</label>
                      <input type="number" value={newVoucherForm.minOrderAmount} onChange={e => setNewVoucherForm(p => ({ ...p, minOrderAmount: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Trạng thái</label>
                      <select value={newVoucherForm.status} onChange={e => setNewVoucherForm(p => ({ ...p, status: e.target.value }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500">
                        <option value="available">🟢 Khả dụng</option>
                        <option value="expired">⚫ Hết hạn</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8B7E74] uppercase">Hết hạn ngày</label>
                      <input type="date" value={newVoucherForm.expiresAt} onChange={e => setNewVoucherForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full mt-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500" />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={assignToAll} onChange={e => { setAssignToAll(e.target.checked); setSelectedVoucherUserIds(new Set()); }} className="w-4 h-4 accent-[#E74C3C]" />
                        <span className="text-[10px] font-bold text-[#2D241E]">Cấp cho tất cả <span className="text-[#E74C3C]">({(usersByTier[newVoucherForm.tierId] || []).length} TV)</span></span>
                      </label>
                    </div>
                  </div>

                  {/* User selector */}
                  {!assignToAll && (
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-[#E5E1D8] rounded-xl p-2 bg-white dark:bg-[#FFF8F0]">
                      {(usersByTier[newVoucherForm.tierId] || []).length === 0 ? (
                        <p className="text-[10px] text-[#8B7E74] italic text-center py-2">Không có thành viên nào trong hạng này.</p>
                      ) : (
                        (usersByTier[newVoucherForm.tierId] || []).map((u: any) => (
                          <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F3F0E9] cursor-pointer">
                            <input type="checkbox" checked={selectedVoucherUserIds.has(u.id)}
                              onChange={() => {
                                const next = new Set(selectedVoucherUserIds);
                                if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                                setSelectedVoucherUserIds(next);
                              }}
                              className="w-4 h-4 accent-[#E74C3C]" />
                            <span className="text-xs text-[#2D241E]">{u.fullName || u.username || u.email} <span className="text-[#8B7E74]">#{u.id}</span></span>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  <button onClick={async () => {
                    const tierUsers = usersByTier[newVoucherForm.tierId] || [];
                    let userIds: number[];
                    if (assignToAll) {
                      userIds = tierUsers.map((u: any) => u.id);
                    } else {
                      userIds = Array.from(selectedVoucherUserIds);
                    }
                    if (userIds.length === 0) return setMembershipMsg('Vui lòng chọn ít nhất một người dùng');
                    try {
                      const payload: any = {
                        tierId: newVoucherForm.tierId,
                        userIds,
                        discountPercent: newVoucherForm.discountPercent,
                        maxDiscount: newVoucherForm.maxDiscount,
                        minOrderAmount: newVoucherForm.minOrderAmount,
                        status: newVoucherForm.status,
                      };
                      if (newVoucherForm.code) payload.code = newVoucherForm.code;
                      if (newVoucherForm.expiresAt) payload.expiresAt = newVoucherForm.expiresAt;
                      const res = await ApiService.adminCreateVouchersBatch(payload);
                      setMembershipMsg(`Đã tạo ${res.created} voucher thành công`);
                      onShowToast?.(`Đã tạo ${res.created} voucher thành công`, 'success', 'Voucher');
                      loadAllVouchers();
                      setSelectedVoucherUserIds(new Set());
                      setAssignToAll(false);
                      setNewVoucherForm(p => ({ ...p, code: '', status: 'available', expiresAt: '' }));
                    } catch { setMembershipMsg('Lỗi tạo voucher'); onShowToast?.('Lỗi tạo voucher', 'error', 'Voucher'); }
                  }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Cấp voucher</button>
                  {membershipMsg && <p className={`text-xs ${membershipMsg.startsWith('Đã') ? 'text-emerald-600' : 'text-red-500'}`}>{membershipMsg}</p>}
                </div>

                {/* Voucher list */}
                <div className="bg-[#F3F0E9] dark:bg-[#FFF9F2] rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] overflow-hidden">
                  <div className="p-3 border-b border-[#E5E1D8] dark:border-[#E0D8D0] flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#2D241E]">Danh sách Voucher ({allVouchers.length})</h4>
                    <div className="flex gap-1">
                      <button onClick={() => loadAllVouchers()} className="px-2 py-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] rounded-lg text-[10px] text-[#8B7E74] hover:text-[#2D241E] cursor-pointer"><RefreshCw className="w-3 h-3 inline" /></button>
                    </div>
                  </div>
                  {allVouchers.length === 0 ? (
                    <p className="p-6 text-center text-xs text-[#8B7E74] italic">Chưa có voucher nào.</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {allVouchers.map(v => (
                        <div key={v.id} className="px-4 py-2.5 border-b border-[#F3F0E9] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-[#2D241E]">{v.code} <span className="text-[#E74C3C]">-{v.discountPercent}%</span></p>
                            <p className="text-[10px] text-[#8B7E74]">User #{v.userId} · {getTierName(v.tierId)} · {v.status === 'available' ? '🟢 Khả dụng' : v.status === 'used' ? '🔴 Đã dùng' : '⚫ Hết hạn'}</p>
                          </div>
                          <div className="text-right text-[10px] text-[#8B7E74]">
                            <p>{v.issuedAt ? new Date(v.issuedAt).toLocaleDateString('vi-VN') : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'permissions' && isSuperAdmin && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🔐 Phân quyền & Vai trò</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Quản lý vai trò và phân quyền chi tiết theo module</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel: Role List + CRUD */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#F3F0E9] dark:bg-[#FFF0E0] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#D0C8C0]">
                  <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">
                    {editingRoleId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#E74C3C]" /> Sửa Vai Trò</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Vai Trò</>}
                  </h4>
                  <form onSubmit={handleRoleFormSubmit} className="space-y-2">
                    <input type="text" required placeholder="ROLE_NAME"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    <input type="text" required placeholder="Tên hiển thị"
                      value={roleForm.display}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, display: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    <input type="text" placeholder="Mô tả"
                      value={roleForm.desc}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, desc: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                    <div className="flex gap-2">
                      {editingRoleId !== null && (
                        <button type="button" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', display: '', desc: '' }); }}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] text-xs font-bold text-[#3E2F26] dark:text-[#3E2F26] hover:bg-[#E5E1D8] dark:hover:bg-[#E8E0D8] cursor-pointer">
                          <X className="w-3 h-3 inline mr-1" />Hủy
                        </button>
                      )}
                      <button type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#E74C3C] dark:bg-[#E74C3C] text-white dark:text-white text-xs font-bold hover:opacity-90 cursor-pointer">
                        {editingRoleId !== null ? 'Cập Nhật' : 'Thêm'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {roleList.map(r => (
                    <div
                      key={r.id}
                      onClick={() => handleRoleSelect(r)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRoleForPerms?.id === r.id
                          ? 'bg-red-50 dark:bg-red-950/20 border-[#E74C3C] dark:border-red-700'
                          : 'bg-[#FAF8F5] dark:bg-[#FFFAF3] border-[#E5E1D8] dark:border-[#E0D8D0] hover:border-red-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-[#E74C3C] font-mono">{r.name}</p>
                          <p className="text-xs text-[#2D241E] dark:text-[#2D241E]">{r.display}</p>
                          <p className="text-[9px] text-[#8B7E74]">{r.desc}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditRole(r); }}
                            className="p-1 rounded bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id); }}
                            className="p-1 rounded bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Permission checkboxes */}
              <div className="lg:col-span-8">
                {selectedRoleForPerms ? (
                  <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">
                        Quyền hạn cho <span className="text-[#E74C3C] font-mono">{selectedRoleForPerms.name}</span>
                      </h4>
                      <button
                        onClick={handleSavePermissions}
                        className="px-4 py-1.5 rounded-lg bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white text-xs font-bold cursor-pointer"
                      >
                        Lưu Phân Quyền
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {PERMISSION_MODULES.map(mod => (
                        <div key={mod.module} className="bg-white dark:bg-[#FFF8F0] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
                          <h5 className="font-bold text-xs text-[#E74C3C] uppercase mb-2">{mod.label}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {mod.permissions.map(perm => (
                              <label key={perm.code} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F3F0E9] dark:hover:bg-[#E5DDD5] cursor-pointer">
                                <input type="checkbox" checked={!!checkPermissions[perm.code]}
                                  onChange={() => handlePermissionToggle(perm.code)}
                                  className="w-4 h-4 accent-[#E74C3C] cursor-pointer" />
                                <span className="text-[10px] text-[#3E2F26] dark:text-[#3E2F26]">{perm.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-8 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0] flex items-center justify-center">
                    <p className="text-xs text-[#8B7E74] italic">Chọn một vai trò ở bên trái để xem và chỉnh sửa quyền hạn</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Creation Section */}
            <div className="bg-[#FAF8F5] dark:bg-[#FFFAF3] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#E0D8D0]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E] mb-3">👤 Tạo Tài Khoản Người Dùng</h4>
              {accountSuccess && <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl text-center font-bold">{accountSuccess}</div>}
              {accountError && <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 text-xs rounded-xl text-center font-bold">{accountError}</div>}
              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Tên ĐN</label>
                  <input type="text" required placeholder="username" value={accountForm.username}
                    onChange={e => setAccountForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Mật khẩu</label>
                  <input type="password" required placeholder="••••••" value={accountForm.password}
                    onChange={e => setAccountForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Email</label>
                  <input type="email" required placeholder="user@email.com" value={accountForm.email}
                    onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Họ tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" value={accountForm.fullName}
                    onChange={e => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:text-[#2D241E] focus:outline-[#E74C3C]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#3E2F26] uppercase">Vai trò</label>
                    <select value={accountForm.roleId} onChange={e => setAccountForm(prev => ({ ...prev, roleId: Number(e.target.value) }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#D0C8C0] bg-white dark:bg-[#FFF8F0] text-[#2D241E] dark:[#2D241E] focus:outline-[#E74C3C]">
                      <option value={0}>-- Chọn role --</option>
                      {roleList.filter(r => isSuperAdmin || r.name !== 'super_admin').map(r => <option key={r.id} value={r.id}>{r.display} ({r.name})</option>)}
                    </select>
                </div>
                <button type="submit" className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                  Tạo TK
                </button>
              </form>

              {/* Existing Users Table */}
              {accountUsers.length > 0 && (
                <div className="mt-4 overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] text-[#2D241E] dark:text-[#2D241E] uppercase font-bold border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                      <tr><th className="p-2">Username</th><th className="p-2">Họ tên</th><th className="p-2">Email</th><th className="p-2">Vai trò</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                      {accountUsers.map(u => (
                        <tr key={u.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50">
                          <td className="p-2 font-bold text-[#2D241E] dark:text-[#2D241E]">{u.username}</td>
                          <td className="p-2">{u.fullName || '-'}</td>
                          <td className="p-2 text-[#8B7E74]">{u.email}</td>
                          <td className="p-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50">{u.roleName}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: USER MANAGEMENT */}
        {adminTab === 'users' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-2">

            <div className="xl:col-span-7 space-y-6">

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
                <span className="text-xl shrink-0">🤝</span>
                <div className="text-xs text-[#FAF8F5]/80 space-y-1">
                  <p className="font-bold text-[#E74C3C] text-sm">Chính Sách Tài Khoản: Chỉ Người Dùng (Khách Hàng) Đăng Ký</p>
                  <p className="leading-relaxed text-[#B2A496]">
                    Theo nghiệp vụ của quán bánh canh, hệ thống chỉ cho phép khách hàng vãng lai đăng ký tài khoản thành viên để mua sắm, nhận mã giảm giá và tích điểm. <strong className="text-red-400">Tài xế (Shipper)</strong> và <strong className="text-red-400">Chủ quán (Admin)</strong> được coi là nhân sự nội bộ của quán, do đó sẽ được khởi tạo thủ công (Seeding) trực tiếp trong MySQL Database để đảm bảo tính bảo mật, tránh giả mạo tài xế hoặc chiếm đoạt cổng quản trị.
                  </p>
                </div>
              </div>

              {/* Function Panel */}
              <div className={`rounded-2xl border p-5 space-y-4 transition-all duration-300 ${
                selectedUser
                  ? 'bg-[#1C1311] border-amber-500/40 shadow-lg shadow-amber-900/20'
                  : 'bg-[#140D0C] border-[#2D2321] opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-[#FAF8F5]">
                    {selectedUser ? (
                      <span>🔧 Thao Tác: <span className="text-amber-400">{selectedUser.username}</span></span>
                    ) : '🔧 Bảng Chức Năng'}
                  </h4>
                  {selectedUser && (
                    <button onClick={() => setSelectedUser(null)}
                      className="text-[10px] text-[#8B7E74] hover:text-red-400 cursor-pointer transition-colors">
                      ✕ Bỏ chọn
                    </button>
                  )}
                </div>

                {!selectedUser && (
                  <p className="text-[10px] text-[#8B7E74] italic">Nhấp vào một người dùng ở bảng bên phải để kích hoạt các thao tác.</p>
                )}

                {userActionMsg && (
                  <div className={`text-[10px] font-bold px-3 py-2 rounded-lg ${
                    userActionMsg.type === 'success'
                      ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40'
                      : 'bg-red-950/30 text-red-400 border border-red-900/40'
                  }`}>
                    {userActionMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button disabled={!selectedUser}
                    onClick={() => { setShowUserEditForm(true); setShowUserRoleForm(false); setShowUserPasswordForm(false); }}
                    className={`p-3 rounded-xl text-[10px] font-bold text-left transition-all border ${
                      selectedUser
                        ? 'bg-[#241A18] border-amber-700/40 text-[#FAF8F5] hover:bg-amber-900/30 hover:border-amber-500/60 cursor-pointer'
                        : 'bg-[#1A1412] border-[#2D2321] text-[#5A4A40] cursor-not-allowed'
                    }`}>
                    <div className="text-lg mb-1">✏️</div>
                    <div>Chỉnh sửa thông tin</div>
                    <div className="text-[8px] text-[#8B7E74] mt-0.5">Họ tên, SĐT, địa chỉ, email</div>
                  </button>

                  <button disabled={!selectedUser}
                    onClick={() => { setShowUserRoleForm(true); setShowUserEditForm(false); setShowUserPasswordForm(false); }}
                    className={`p-3 rounded-xl text-[10px] font-bold text-left transition-all border ${
                      selectedUser
                        ? 'bg-[#241A18] border-amber-700/40 text-[#FAF8F5] hover:bg-amber-900/30 hover:border-amber-500/60 cursor-pointer'
                        : 'bg-[#1A1412] border-[#2D2321] text-[#5A4A40] cursor-not-allowed'
                    }`}>
                    <div className="text-lg mb-1">🔄</div>
                    <div>Đổi vai trò</div>
                    <div className="text-[8px] text-[#8B7E74] mt-0.5">customer / driver / admin</div>
                  </button>

                  <button disabled={!selectedUser}
                    onClick={handleToggleUserActive}
                    className={`p-3 rounded-xl text-[10px] font-bold text-left transition-all border ${
                      selectedUser
                        ? 'bg-[#241A18] border-amber-700/40 text-[#FAF8F5] hover:bg-amber-900/30 hover:border-amber-500/60 cursor-pointer'
                        : 'bg-[#1A1412] border-[#2D2321] text-[#5A4A40] cursor-not-allowed'
                    }`}>
                    <div className="text-lg mb-1">{selectedUser?.isActive === false ? '🔓' : '🔒'}</div>
                    <div>{selectedUser?.isActive === false ? 'Mở khoá' : 'Khoá tài khoản'}</div>
                    <div className="text-[8px] text-[#8B7E74] mt-0.5">{selectedUser?.isActive === false ? 'Đang bị khoá' : 'Đang hoạt động'}</div>
                  </button>

                  <button disabled={!selectedUser}
                    onClick={() => { setShowUserPasswordForm(true); setShowUserEditForm(false); setShowUserRoleForm(false); }}
                    className={`p-3 rounded-xl text-[10px] font-bold text-left transition-all border ${
                      selectedUser
                        ? 'bg-[#241A18] border-amber-700/40 text-[#FAF8F5] hover:bg-amber-900/30 hover:border-amber-500/60 cursor-pointer'
                        : 'bg-[#1A1412] border-[#2D2321] text-[#5A4A40] cursor-not-allowed'
                    }`}>
                    <div className="text-lg mb-1">🔑</div>
                    <div>Đặt lại mật khẩu</div>
                    <div className="text-[8px] text-[#8B7E74] mt-0.5">Admin cấp mật khẩu mới</div>
                  </button>
                </div>

                <button disabled={!selectedUser}
                  onClick={handleDeleteUser}
                  className={`w-full p-3 rounded-xl text-[10px] font-bold text-center transition-all border ${
                    selectedUser
                      ? 'bg-red-950/30 border-red-800/50 text-red-400 hover:bg-red-950/50 hover:border-red-600 cursor-pointer'
                      : 'bg-[#1A1412] border-[#2D2321] text-[#5A4A40] cursor-not-allowed'
                  }`}>
                  🗑️ Xoá tài khoản "{selectedUser?.username || '...'}"
                </button>

                {/* Edit Info Form */}
                {showUserEditForm && selectedUser && (
                  <div className="p-4 bg-[#241A18] rounded-xl border border-amber-700/40 space-y-3">
                    <h5 className="text-xs font-bold text-amber-400">✏️ Chỉnh sửa thông tin</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-[#8B7E74] font-bold uppercase">Họ tên</label>
                        <input type="text" value={userEditForm.fullName} onChange={e => setUserEditForm(p => ({ ...p, fullName: e.target.value }))}
                          className="w-full mt-1 p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8B7E74] font-bold uppercase">Email</label>
                        <input type="email" value={userEditForm.email} onChange={e => setUserEditForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full mt-1 p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8B7E74] font-bold uppercase">SĐT</label>
                        <input type="text" value={userEditForm.phone} onChange={e => setUserEditForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full mt-1 p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#8B7E74] font-bold uppercase">Địa chỉ</label>
                        <input type="text" value={userEditForm.address} onChange={e => setUserEditForm(p => ({ ...p, address: e.target.value }))}
                          className="w-full mt-1 p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setShowUserEditForm(false)}
                        className="px-4 py-2 rounded-lg border border-[#2D2321] text-[10px] font-bold text-[#8B7E74] hover:text-[#FAF8F5] cursor-pointer transition-all">Huỷ</button>
                      <button onClick={handleSaveUserEdit} disabled={userActionLoading}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-500 disabled:opacity-50 cursor-pointer transition-all">
                        {userActionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Change Role Form */}
                {showUserRoleForm && selectedUser && (
                  <div className="p-4 bg-[#241A18] rounded-xl border border-amber-700/40 space-y-3">
                    <h5 className="text-xs font-bold text-amber-400">🔄 Đổi vai trò</h5>
                    <select value={userNewRole} onChange={e => setUserNewRole(e.target.value)}
                      className="w-full p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500">
                      <option value="customer">Khách hàng</option>
                      <option value="driver">Tài xế</option>
                      <option value="admin">Quản trị</option>
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setShowUserRoleForm(false)}
                        className="px-4 py-2 rounded-lg border border-[#2D2321] text-[10px] font-bold text-[#8B7E74] hover:text-[#FAF8F5] cursor-pointer transition-all">Huỷ</button>
                      <button onClick={handleChangeUserRole} disabled={userActionLoading}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-500 disabled:opacity-50 cursor-pointer transition-all">
                        {userActionLoading ? 'Đang xử lý...' : 'Xác nhận đổi'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reset Password Form */}
                {showUserPasswordForm && selectedUser && (
                  <div className="p-4 bg-[#241A18] rounded-xl border border-amber-700/40 space-y-3">
                    <h5 className="text-xs font-bold text-amber-400">🔑 Đặt lại mật khẩu</h5>
                    <input type="text" value={userNewPassword} onChange={e => setUserNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      className="w-full p-2 rounded-lg bg-[#1C1311] border border-[#2D2321] text-[11px] text-[#FAF8F5] focus:outline-none focus:border-amber-500 placeholder:text-[#5A4A40]" />
                    {userNewPassword.length > 0 && userNewPassword.length < 6 && (
                      <p className="text-[9px] text-red-400">Mật khẩu phải có ít nhất 6 ký tự</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setShowUserPasswordForm(false); setUserNewPassword(''); }}
                        className="px-4 py-2 rounded-lg border border-[#2D2321] text-[10px] font-bold text-[#8B7E74] hover:text-[#FAF8F5] cursor-pointer transition-all">Huỷ</button>
                      <button onClick={handleResetUserPassword} disabled={userActionLoading || userNewPassword.length < 6}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-500 disabled:opacity-50 cursor-pointer transition-all">
                        {userActionLoading ? 'Đang xử lý...' : 'Đặt lại'}
                      </button>
                    </div>
                  </div>
                )}

                {userActionLoading && (
                  <div className="text-center text-[10px] text-amber-400 animate-pulse py-2">⏳ Đang xử lý...</div>
                )}
              </div>

            </div>

            <div className="xl:col-span-5 space-y-4">

              {isBackendConnected && (
                <div className="p-4.5 bg-[#1C1311] border border-[#2D2321] rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#FAF8F5]">
                        👥 Người Dùng Từ Database {loadingUsers && <span className="text-[9px] text-[#B2A496] font-sans">(đang tải...)</span>}
                      </h4>
                      <p className="text-[10px] text-[#8B7E74]">Spring Boot + MySQL — {apiUsers.length} tài khoản</p>
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-1 rounded border bg-[#241A18] border-[#2D2321] text-[#B2A496]">
                      {statusLabel[onlineStatus]?.icon} {statusLabel[onlineStatus]?.label}
                    </span>
                    <p className="text-[8px] text-[#B2A496] mt-1">Trạng thái hoạt động cập nhật mỗi 30s</p>
                      {apiStats && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40">
                          {apiStats.totalUsers} users
                        </span>
                      )}
                    </div>
                  </div>

                  {apiUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8B7E74] italic border border-dashed border-[#2D2321] rounded-xl">
                      {loadingUsers ? 'Đang kết nối đến MySQL...' : 'Chưa có người dùng nào trong database. Hãy đăng ký tài khoản mới.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#2D2321] rounded-xl">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-[#241A18] text-[#B2A496] uppercase font-bold border-b border-[#2D2321]">
                          <tr>
                            <th className="p-2">Username</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Vai trò</th>
                            <th className="p-2">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D2321]">
                          {apiUsers.map((u: any) => (
                            <tr key={u.id}
                              onClick={() => {
                                setUserEditForm({ fullName: u.fullName || '', phone: u.phone || '', address: u.address || '', email: u.email || '' });
                                setUserNewRole(u.role);
                                handleSelectUser(u);
                              }}
                              className={`cursor-pointer transition-all ${
                                selectedUser?.id === u.id
                                  ? 'bg-amber-900/20 outline outline-1 outline-amber-500/50'
                                  : 'hover:bg-[#241A18]/50'
                              }`}>
                              <td className="p-2 font-bold text-red-500">{u.username}</td>
                              <td className="p-2 text-[#B2A496]">{u.email}</td>
                              <td className="p-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  u.role === 'admin' ? 'bg-red-950/30 text-red-400 border-red-900/40' :
                                  u.role === 'driver' ? 'bg-blue-950/30 text-blue-400 border-blue-900/40' :
                                  'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                                }`}>
                                  {u.role === 'admin' ? 'Quản trị' : u.role === 'driver' ? 'Tài xế' : 'Khách hàng'}
                                </span>
                                {u.isActive === false && (
                                  <span className="ml-1 text-[8px] bg-red-950/50 text-red-300 px-1 rounded">khoá</span>
                                )}
                              </td>
                              <td className="p-2 text-center text-[10px]">
                                <span title={statusLabel[onlineStatus]?.label}>
                                  {statusLabel[onlineStatus]?.icon}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}



              <div className="p-4.5 bg-[#1C1311] border border-[#2D2321] rounded-2xl shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-serif font-bold text-sm text-[#FAF8F5]">
                    👥 Người Dùng Đã Đăng Ký (LocalStorage)
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-1 rounded border bg-[#241A18] border-[#2D2321] text-[#B2A496]">
                      {statusLabel[onlineStatus]?.icon} {statusLabel[onlineStatus]?.label}
                    </span>
                    <button onClick={handleRefreshUsers} className="text-[9px] text-amber-400 hover:underline cursor-pointer">⟳ Làm mới</button>
                    <button onClick={handleResetSimulatedUsers} className="text-[9px] text-red-400 hover:underline cursor-pointer">🗑️ Xoá tất cả</button>
                  </div>
                </div>
                {localUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8B7E74] italic border border-dashed border-[#2D2321] rounded-xl">
                    Chưa có người dùng nào đăng ký trên trình duyệt này.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#2D2321] rounded-xl">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-[#241A18] text-[#B2A496] uppercase font-bold border-b border-[#2D2321]">
                        <tr>
                          <th className="p-2">Username</th>
                          <th className="p-2">Họ tên</th>
                          <th className="p-2">Vai trò</th>
                          <th className="p-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2D2321]">
                        {localUsers.map((u: any) => (
                          <tr key={u.id}
                            onClick={() => {
                              setUserEditForm({ fullName: u.fullName || u.name || '', phone: u.phone || '', address: u.address || '', email: u.email || '' });
                              setUserNewRole(u.role || 'customer');
                              handleSelectUser(u);
                            }}
                            className={`cursor-pointer transition-all ${
                              selectedUser?.id === u.id
                                ? 'bg-amber-900/20 outline outline-1 outline-amber-500/50'
                                : 'hover:bg-[#241A18]/50'
                            }`}>
                            <td className="p-2 font-bold text-red-500">{u.username || u.email}</td>
                            <td className="p-2 text-[#B2A496]">{u.fullName || u.name || '—'}</td>
                            <td className="p-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                u.role === 'admin' ? 'bg-red-950/30 text-red-400 border-red-900/40' :
                                u.role === 'driver' ? 'bg-blue-950/30 text-blue-400 border-blue-900/40' :
                                'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                              }`}>
                                {u.role === 'admin' ? 'Quản trị' : u.role === 'driver' ? 'Tài xế' : 'Khách hàng'}
                              </span>
                            </td>
                            <td className="p-2 text-center text-[10px]">
                              <span title={statusLabel[onlineStatus]?.label}>
                                {statusLabel[onlineStatus]?.icon}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-2 text-[8px] text-[#5A4A40] text-center border-t border-[#2D2321]">
                      Tổng số: {localUsers.length} tài khoản
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB: DELIVERY TRIPS */}
        {adminTab === 'delivery-trips' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">🚚 Chuyến Giao Hàng</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Theo dõi các chuyến giao hàng</span>
            </div>
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3.5">Mã Chuyến</th>
                    <th className="p-3.5">Mã Đơn Hàng</th>
                    <th className="p-3.5">Mã Tài Xế</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5">Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {deliveryTrips.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có chuyến giao hàng nào.</td></tr>
                  ) : (deliveryTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3.5 font-mono font-black text-[#2D241E] dark:text-[#2D241E]">{trip.id}</td>
                      <td className="p-3.5 font-mono font-bold text-[#E74C3C] dark:text-red-400">{trip.orderId}</td>
                      <td className="p-3.5 font-mono text-[#2D241E] dark:text-[#2D241E]">{trip.driverId}</td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          trip.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' :
                          trip.status === 'cancelled' ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50' :
                          trip.status === 'accepted' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' :
                          'bg-purple-100 dark:bg-purple-950/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-900/50'
                        }`}>
                          {trip.status === 'assigned' ? 'Đã phân công' :
                           trip.status === 'accepted' ? 'Đã nhận' :
                           trip.status === 'picked_up' ? 'Đã lấy hàng' :
                           trip.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="p-3.5 text-[10px] text-[#8B7E74] dark:text-[#8B7E74] font-mono">
                        {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PAYMENT TRANSACTIONS */}
        {adminTab === 'payment-transactions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">💳 Giao Dịch Thanh Toán</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Lịch sử giao dịch thanh toán</span>
            </div>
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                  <tr>
                    <th className="p-3.5">Mã GD</th>
                    <th className="p-3.5">Mã Đơn Hàng</th>
                    <th className="p-3.5">Mã Giao Dịch</th>
                    <th className="p-3.5 text-right">Số Tiền</th>
                    <th className="p-3.5">Phương Thức</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5">Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                  {paymentTransactions.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có giao dịch thanh toán nào.</td></tr>
                  ) : (paymentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                      <td className="p-3.5 font-mono font-black text-[#2D241E] dark:text-[#2D241E]">{tx.id}</td>
                      <td className="p-3.5 font-mono font-bold text-[#E74C3C] dark:text-red-400">{tx.orderId}</td>
                      <td className="p-3.5 font-mono text-[10px] text-[#8B7E74] dark:text-[#8B7E74]">{tx.transactionCode || '—'}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#2D241E] dark:text-[#2D241E]">{tx.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 capitalize">
                          {tx.paymentMethod === 'momo' ? 'MoMo' :
                           tx.paymentMethod === 'cash' ? 'Tiền mặt' :
                           tx.paymentMethod === 'banking' ? 'Chuyển khoản' :
                           tx.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          tx.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' :
                          tx.status === 'failed' ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50' :
                          tx.status === 'refunded' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-900/50' :
                          'bg-gray-100 dark:bg-gray-100/30 text-gray-700 dark:text-gray-600 border-gray-200 dark:border-gray-200/50'
                        }`}>
                          {tx.status === 'success' ? 'Thành công' :
                           tx.status === 'failed' ? 'Thất bại' :
                           tx.status === 'refunded' ? 'Hoàn tiền' : 'Chờ'}
                        </span>
                      </td>
                      <td className="p-3.5 text-[10px] text-[#8B7E74] dark:text-[#8B7E74] font-mono">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ORDER HISTORY */}
        {adminTab === 'order-history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#E0D8D0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#2D241E]">📜 Lịch Sử Đơn Hàng</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#8B7E74]">Tra cứu lịch sử đơn hàng</span>
            </div>
            {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
              <p className="text-center py-12 text-xs text-[#8B7E74] dark:text-[#8B7E74] italic">Chưa có đơn hàng hoàn thành hoặc đã hủy.</p>
            ) : (
              <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#E0D8D0] rounded-2xl bg-[#FAF8F5] dark:bg-[#FFF5EB]">
                <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#3E2F26]">
                  <thead className="bg-[#F3F0E9] dark:bg-[#FFF0E0] uppercase font-bold text-[#2D241E] dark:text-[#2D241E] border-b border-[#E5E1D8] dark:border-[#E0D8D0]">
                    <tr>
                      <th className="p-3.5">Mã Đơn</th>
                      <th className="p-3.5">Khách Hàng</th>
                      <th className="p-3.5 text-right">Tổng Tiền</th>
                      <th className="p-3.5">Trạng Thái</th>
                      <th className="p-3.5">Thanh Toán</th>
                      <th className="p-3.5">Ngày Đặt</th>
                      <th className="p-3.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#E0D8D0] bg-white dark:bg-[#FFF8F0]">
                    {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').map(order => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#E5DDD5]/50 transition-colors">
                        <td className="p-3.5 font-mono font-black text-[#2D241E] dark:text-[#2D241E]">{order.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-[#2D241E] dark:text-[#2D241E]">{order.customerName}</p>
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#8B7E74]">{order.phone}</p>
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-[#E74C3C] dark:text-red-400 whitespace-nowrap">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getOrderStatusBadge(order.status)}`}>
                            {order.status === 'completed' ? 'Thành công' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px]">
                          <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {order.paymentStatus === 'paid' ? '✅ Đã TT' : '⏳ Chưa TT'}
                          </span>
                          <span className="block text-[9px] text-[#8B7E74] dark:text-[#8B7E74] mt-0.5">
                            {order.paymentMethod === 'momo' ? '🎀 MoMo' :
                             order.paymentMethod === 'cod' ? '💵 Tiền mặt (COD)' :
                             order.paymentMethod || '-'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px] text-[#8B7E74] dark:text-[#8B7E74] font-mono">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3.5 text-[10px] text-[#8B7E74] dark:text-[#8B7E74] max-w-[120px] truncate" title={order.notes || ''}>
                          {order.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
      {/* Confirmation Dialog for Order Cancellation */}
      {orderIdToCancel !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#E74C3C]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#FFF5EB] rounded-2xl max-w-sm w-full p-6 border border-[#E5E1D8] dark:border-[#E0D8D0] shadow-2xl space-y-4 transform scale-100 transition-all select-none">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#2D241E]">Hủy đơn hàng đang chờ?</h4>
                <p className="text-[11px] text-[#8B7E74] dark:text-[#8B7E74]">Hành động này sẽ cập nhật trạng thái đơn thành "Đã Hủy"!</p>
              </div>
            </div>

            <p className="text-xs text-[#3E2F26] dark:text-[#3E2F26] leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng mã <strong className="font-mono text-[#2D241E] dark:text-[#2D241E] bg-[#F3F0E9] dark:bg-[#FFF0E0] px-1.5 py-0.5 rounded font-black">{orderIdToCancel}</strong> này không?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderIdToCancel(null)}
                className="flex-1 bg-white dark:bg-[#FFF8F0] border border-[#E5E1D8] dark:border-[#D0C8C0] hover:bg-[#F3F0E9] dark:hover:bg-[#E8E0D8] text-[#3E2F26] dark:text-[#3E2F26] py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
              >
                Giữ đơn hàng
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateOrderStatus(orderIdToCancel, 'cancelled');
                  setOrderIdToCancel(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all text-center shadow-md cursor-pointer"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

