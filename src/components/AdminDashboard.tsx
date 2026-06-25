import React, { useState, useEffect } from 'react';
import { Order, Driver, OrderStatus, Product } from '../types';
import { JAVA_BACKEND_FILES, MYSQL_DATABASE_SQL, FRONTEND_INTEGRATION_FILES } from '../data';
import { FileCode, Check, Copy, AlertTriangle, Plus, Edit3, Trash2, X } from 'lucide-react';
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
}

interface ToppingItem { id: string; name: string; price: number; category: string; isAvailable: boolean; }
interface MaterialItem { id: number; name: string; unit: string; stock: number; min: number; price: number; }
interface TableItem { id: number; number: string; capacity: number; position: string; }
interface PromoItem { id: number; code: string; name: string; discount_type: string; discount_value: number; min_order_amount: number; }
interface ReviewItem { id: number; customer: string; product: string; rating: number; comment: string; isApproved?: boolean; adminReply?: string; }
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
  onDeleteProduct
}: AdminDashboardProps) {
  const isSuperAdmin = userRole === 'super_admin';
  const [adminTab, setAdminTab] = useState<'stats' | 'orders' | 'products' | 'categories' | 'toppings' | 'materials' | 'tables' | 'promotions' | 'reviews' | 'drivers' | 'users' | 'java' | 'sql' | 'frontend' | 'permissions'>('stats');
  const [selectedFEFile, setSelectedFEFile] = useState(0);

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

  const [productForm, setProductForm] = useState<{ name: string; description: string; price: number; categoryName: string; isBestSeller: boolean; isAvailable: boolean; imageUrl: string; preparationTime: number }>({ name: '', description: '', price: 0, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: false, isAvailable: true, imageUrl: '', preparationTime: 10 });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState('');
  const [productError, setProductError] = useState('');
  const [pendingNewCategory, setPendingNewCategory] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Driver Form State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('');
  const [driverSuccess, setDriverSuccess] = useState('');

  // Source code state
  const [selectedJavaFile, setSelectedJavaFile] = useState(0);
  const [copiedText, setCopiedText] = useState(false);

  // Order cancellation confirmation state
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null);

  // Categories CRUD (persisted to localStorage)
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; count: number }[]>(() => {
    try {
      const saved = localStorage.getItem('banhcanh_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [categoryForm, setCategoryForm] = useState<{ name: string; slug: string }>({ name: '', slug: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Toppings CRUD
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [toppingForm, setToppingForm] = useState({ name: '', price: 0, category: 'Đồ Ăn Kèm', isAvailable: true });
  const [editingToppingId, setEditingToppingId] = useState<string | null>(null);

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
  const [promoForm, setPromoForm] = useState({ code: '', name: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0 });
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);

  // Reviews CRUD
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewForm, setReviewForm] = useState({ customer: '', product: '', rating: 5, comment: '' });
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

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
    if (!driverName || !driverPhone || !driverVehicle) return;
    if (isBackendConnected) {
      try {
        await ApiService.createDriver({ name: driverName, phone: driverPhone, vehicle: driverVehicle });
      } catch (err) {
        console.error('API create driver failed, falling back to local:', err);
      }
    }
    onCreateDriver(driverName, driverPhone, driverVehicle);
    setDriverName('');
    setDriverPhone('');
    setDriverVehicle('');
    setDriverSuccess('Đã đăng ký shipper mới thành công!');
    setTimeout(() => setDriverSuccess(''), 3000);
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
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
    try {
      if (editingCategoryId !== null) {
        if (isBackendConnected) {
          await ApiService.updateCategory(editingCategoryId, { name: categoryForm.name, slug: finalSlug });
        }
        setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, name: categoryForm.name, slug: finalSlug } : c));
      } else {
        if (isBackendConnected) {
          const created = await ApiService.createCategory({ name: categoryForm.name, slug: finalSlug });
          setCategories([...categories, { id: Number(created.id), name: created.name, slug: created.slug, count: 0 }]);
        } else {
          const newId = Math.max(...categories.map(c => c.id), 0) + 1;
          setCategories([...categories, { id: newId, name: categoryForm.name, slug: finalSlug, count: 0 }]);
        }
      }
      setCategoryForm({ name: '', slug: '' });
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      alert('Lỗi khi lưu danh mục!');
    }
  };

  const handleEditCategory = (cat: { id: number; name: string; slug: string }) => {
    setCategoryForm({ name: cat.name, slug: cat.slug });
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
        setCategoryForm({ name: '', slug: '' });
      }
    } catch (err) {
      console.error('Lỗi khi xóa danh mục:', err);
      alert('Lỗi khi xóa danh mục!');
    }
  };

  // Topping handlers
  const handleToppingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingForm.name || !toppingForm.price) return;
    if (editingToppingId !== null) {
      setToppings(toppings.map(t => t.id === editingToppingId ? { ...t, ...toppingForm } : t));
    } else {
      const newId = String(Math.max(...toppings.map(t => Number(t.id)), 0) + 1);
      setToppings([...toppings, { id: newId, ...toppingForm }]);
    }
    setToppingForm({ name: '', price: 0, category: 'Đồ Ăn Kèm', isAvailable: true });
    setEditingToppingId(null);
  };

  const handleEditTopping = (t: ToppingItem) => {
    setToppingForm({ name: t.name, price: t.price, category: t.category, isAvailable: t.isAvailable });
    setEditingToppingId(t.id);
  };

  const handleDeleteTopping = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa topping này?')) return;
    setToppings(toppings.filter(t => t.id !== id));
    if (editingToppingId === id) {
      setEditingToppingId(null);
      setToppingForm({ name: '', price: 0, category: 'Đồ Ăn Kèm', isAvailable: true });
    }
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
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.name) return;
    if (editingPromoId !== null) {
      setPromotions(promotions.map(p => p.id === editingPromoId ? { ...p, ...promoForm } : p));
    } else {
      const newId = Math.max(...promotions.map(p => p.id), 0) + 1;
      setPromotions([...promotions, { id: newId, ...promoForm }]);
    }
    setPromoForm({ code: '', name: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0 });
    setEditingPromoId(null);
  };

  const handleEditPromo = (p: PromoItem) => {
    setPromoForm({ code: p.code, name: p.name, discount_type: p.discount_type, discount_value: p.discount_value, min_order_amount: p.min_order_amount });
    setEditingPromoId(p.id);
  };

  const handleDeletePromo = (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    setPromotions(promotions.filter(p => p.id !== id));
    if (editingPromoId === id) {
      setEditingPromoId(null);
      setPromoForm({ code: '', name: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0 });
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
        setReviews(apiReviews.map(r => ({ id: Number(r.id), customer: r.customerName || '', product: r.productName || '', rating: r.rating, comment: r.comment, isApproved: r.isApproved, adminReply: r.adminReply })));
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
  const handleRoleSelect = (role: RoleItem) => {
    setSelectedRoleForPerms(role);
    const perms: Record<string, boolean> = {};
    PERMISSION_MODULES.forEach(mod => {
      mod.permissions.forEach(p => {
        perms[p.code] = role.name === 'ROLE_SUPER_ADMIN';
      });
    });
    if (role.name === 'ROLE_ADMIN') {
      ['product:create', 'product:read', 'product:update', 'product:delete', 'order:create', 'order:read', 'order:update', 'order:delete', 'driver:create', 'driver:read', 'driver:update', 'driver:delete', 'category:create', 'category:read', 'category:update', 'category:delete', 'user:read', 'stats:view'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
    }
    if (role.name === 'ROLE_STAFF') {
      ['order:read', 'order:update'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
    }
    if (role.name === 'ROLE_CUSTOMER') {
      ['order:create', 'order:read'].forEach(c => { if (perms[c] !== undefined) perms[c] = true; });
    }
    setCheckPermissions(perms);
  };

  const handlePermissionToggle = (code: string) => {
    setCheckPermissions(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleSavePermissions = () => {
    alert('Đã lưu phân quyền cho vai trò ' + selectedRoleForPerms?.name);
  };

  const handleRoleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name || !roleForm.display) return;
    if (editingRoleId !== null) {
      setRoleList(roleList.map(r => r.id === editingRoleId ? { ...r, ...roleForm } : r));
    } else {
      const newId = Math.max(...roleList.map(r => r.id), 0) + 1;
      setRoleList([...roleList, { id: newId, ...roleForm }]);
    }
    setRoleForm({ name: '', display: '', desc: '' });
    setEditingRoleId(null);
  };

  const handleEditRole = (r: RoleItem) => {
    setRoleForm({ name: r.name, display: r.display, desc: r.desc });
    setEditingRoleId(r.id);
  };

  const handleDeleteRole = (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return;
    setRoleList(roleList.filter(r => r.id !== id));
    if (selectedRoleForPerms?.id === id) {
      setSelectedRoleForPerms(null);
      setCheckPermissions({});
    }
    if (editingRoleId === id) {
      setEditingRoleId(null);
      setRoleForm({ name: '', display: '', desc: '' });
    }
  };

  const tabClass = (tab: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      adminTab === tab
        ? tab === 'stats' || tab === 'users' || tab === 'permissions'
          ? 'bg-[#D97706] text-white shadow-xs'
          : 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs'
        : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
    }`;
  return (
    <div className="bg-white dark:bg-[#1C1311] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm select-none text-[#3E2F26] dark:text-[#EAE3D2] overflow-hidden">

      {/* HEADER SECTION */}
      <div className="bg-[#FAF8F5] dark:bg-[#211715] p-6 border-b border-[#E5E1D8] dark:border-[#2D2321] flex flex-wrap gap-4 items-center justify-between">
        <div>
          <span className="bg-[#D97706] text-white text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-xs">
            Hệ quản trị quán ăn
          </span>
          <h2 className="text-xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-1.5 flex items-center gap-2">
            ⚙️ Quản Lý Đơn Hàng & Tài Xế
          </h2>
          <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-0.5">Xử lý món ăn, phân công shipper vận chuyển và tích hợp backend Java Spring Boot kết nối MySQL XAMPP.</p>
        </div>

        {/* Outer Tabs Controls */}
        <div className="flex flex-wrap bg-[#F3F0E9] dark:bg-[#2D2321] p-1 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] gap-1">
          <button onClick={() => setAdminTab('stats')} className={tabClass('stats')}>📊 Thống Kê</button>
          <button onClick={() => setAdminTab('orders')} className={tabClass('orders')}>📋 Đơn Hàng ({orders.length})</button>
          <button onClick={() => setAdminTab('products')} className={tabClass('products')}>🍲 Sản Phẩm ({products.length})</button>
          <button onClick={() => setAdminTab('categories')} className={tabClass('categories')}>📂 Danh Mục</button>
          <button onClick={() => setAdminTab('toppings')} className={tabClass('toppings')}>🧂 Topping</button>
          <button onClick={() => setAdminTab('materials')} className={tabClass('materials')}>📦 Nguyên Liệu</button>
          <button onClick={() => setAdminTab('tables')} className={tabClass('tables')}>🪑 Bàn Ăn</button>
          <button onClick={() => setAdminTab('promotions')} className={tabClass('promotions')}>🏷️ Khuyến Mãi</button>
          <button onClick={() => setAdminTab('reviews')} className={tabClass('reviews')}>⭐ Đánh Giá</button>
          <button onClick={() => setAdminTab('drivers')} className={tabClass('drivers')}>🛵 Shipper</button>
          <button onClick={() => { handleRefreshUsers(); setAdminTab('users'); }} className={tabClass('users')}>👥 Users ({localUsers.length})</button>
          <button onClick={() => setAdminTab('java')} className={`${tabClass('java')} flex items-center gap-1`}><span>☕ Java</span><span className="bg-red-200 dark:bg-red-950/40 text-red-900 dark:text-red-400 text-[8px] font-black px-1 rounded-sm">XAMPP</span></button>
          <button onClick={() => setAdminTab('sql')} className={tabClass('sql')}>🗄️ SQL</button>
          <button onClick={() => setAdminTab('frontend')} className={tabClass('frontend')}>🔌 FE</button>
          {isSuperAdmin && <button onClick={() => setAdminTab('permissions')} className={tabClass('permissions')}>🔐 Phân quyền & Vai trò</button>}
        </div>
      </div>

      <div className="p-6">

        {/* TAB 1: LIVE ORDER PROCESSOR */}
        {adminTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F3F0E9] dark:border-[#2D2321] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">Theo Dõi Đơn Hàng Gần Đây</h3>
              <span className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Trực quan hóa chuyển giao hành động</span>
            </div>

            {orders.length === 0 ? (
              <p className="text-center py-12 text-xs text-[#8B7E74] dark:text-[#B2A496] italic">Chưa có đơn hàng nào tồn tại.</p>
            ) : (
              <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
                <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                  <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                    <tr>
                      <th className="p-3.5">Mã Đơn</th>
                      <th className="p-3.5">Thông tin Khách</th>
                      <th className="p-3.5">Chi Tiết Bát Canh</th>
                      <th className="p-3.5">Loại Đơn</th>
                      <th className="p-3.5 text-right">Tổng Tiền</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5">Thanh toán</th>
                      <th className="p-3.5">Ngày đặt</th>
                      <th className="p-3.5">Phân Tài Xế</th>
                      <th className="p-3.5 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                        <td className="p-3.5 font-mono font-black text-[#2D241E] dark:text-[#FAF8F5]">{order.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{order.customerName}</p>
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">{order.phone}</p>
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] max-w-[150px] truncate" title={order.address}>{order.address}</p>
                        </td>
                        <td className="p-3.5 space-y-1">
                          {order.items.map((it, i) => (
                            <p key={i} className="text-[10px] text-[#2D241E] dark:text-[#FAF8F5]">
                              • <span className="font-bold">{it.quantity}x</span> {it.productName}
                              {it.noodleType && <span className="text-amber-700 dark:text-amber-400"> [{it.noodleType}]</span>}
                            </p>
                          ))}
                        </td>
                        <td className="p-3.5 text-[10px]">
                          {order.orderType === 'dine-in' ? '🍽️ Tại quán' :
                            order.orderType === 'takeaway' ? '🛍️ Mang đi' :
                            order.orderType === 'delivery' ? '🛵 Giao hàng' :
                            order.orderType || '🛵 Giao hàng'}
                          {(order as any).tableNumber && <span className="block text-[9px] text-[#8B7E74]">Bàn {(order as any).tableNumber}</span>}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-[#D97706] dark:text-amber-500 whitespace-nowrap">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getOrderStatusBadge(order.status)}`}>
                            {order.status === 'pending' ? 'Chờ xác nhận' :
                             order.status === 'preparing' ? 'Đang chế biến' :
                             order.status === 'shipping' ? 'Đang giao hàng' :
                             order.status === 'completed' ? 'Thành công' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px]">
                          <span className={`font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {order.paymentStatus === 'paid' ? '✅ Đã TT' : '⏳ Chưa TT'}
                          </span>
                          <span className="block text-[9px] text-[#8B7E74] mt-0.5">
                            {order.paymentMethod === 'momo' ? '🎀 MoMo' :
                             order.paymentMethod === 'cash' ? '💵 Tiền mặt' :
                             order.paymentMethod || '-'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10px] text-[#8B7E74] font-mono">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3.5">
                          {order.status === 'cancelled' || order.status === 'completed' ? (
                            <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">-</span>
                          ) : (
                            <select
                              value={order.driverId || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignDriver(order.id, e.target.value);
                                }
                              }}
                              className="text-[10px] p-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D302D] bg-[#FAF8F5] dark:bg-[#1E1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-none"
                            >
                              <option value="" className="dark:bg-[#1E1311]">-- Chọn tài xế --</option>
                              {drivers.length === 0 ? (
                                <option disabled className="dark:bg-[#1E1311] text-[#8B7E74]">⏳ Đang tải danh sách tài xế...</option>
                              ) : drivers.filter((d) => d.status === 'available').length === 0 ? (
                                <option disabled className="dark:bg-[#1E1311] text-[#8B7E74]">Không có tài xế khả dụng</option>
                              ) : (
                                drivers
                                  .filter((d) => d.status === 'available')
                                  .map((d) => (
                                    <option key={d.id} value={d.id} className="dark:bg-[#1E1311]">
                                      {d.name} ({d.vehicle.split('-')[0]})
                                    </option>
                                  ))
                              )}
                            </select>
                          )}
                          {order.driverId && (
                            <p className="text-[9px] text-[#D97706] dark:text-amber-500 font-bold mt-1">🏍️ Đã chỉ định tài xế (ID: {order.driverId})</p>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 items-center justify-center">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full cursor-pointer"
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
                                    className="bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full mt-1 flex items-center justify-center gap-0.5 cursor-pointer"
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
                              <span className="text-[9px] text-[#8B7E74] dark:text-[#B2A496] italic">Giao dịch hoàn tất</span>
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
            <div className="flex flex-wrap justify-between items-center border-b border-[#F3F0E9] dark:border-[#2D2321] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">Quản Lý Sản Phẩm</h3>
                <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-0.5">Thêm, sửa, xóa món ăn trong thực đơn</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-[9px] px-2 py-1 rounded font-mono font-bold ${isBackendConnected ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
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
            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingProductId ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Sản Phẩm</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Sản Phẩm Mới</>}
              </h4>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên Món</label>
                  <input type="text" required placeholder="Bánh Canh Cá Lóc..."
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Giá (VNĐ)</label>
                  <input type="number" required min={0} step={1000} placeholder="45000"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Danh Mục</label>
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
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__new__">➕ Tạo danh mục mới...</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Mô Tả</label>
                  <input type="text" placeholder="Mô tả món ăn..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Hình Ảnh</label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[180px]">
                      <input type="text" placeholder="https://... hoặc upload file bên cạnh"
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
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
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap border ${uploadingImage ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed' : 'bg-[#D97706] text-white border-[#D97706] hover:bg-[#D97706]/90'}`}>
                        {uploadingImage ? '⏳ Đang tải...' : '📁 Upload'}
                      </label>
                      {productForm.imageUrl && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#E5E1D8] dark:border-[#3D302D] bg-[#FAF8F5] dark:bg-[#150F0D] shrink-0 flex items-center justify-center">
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
                      className="w-4 h-4 accent-[#D97706]" />
                    <span className="text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2]">🔥 Bán chạy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isAvailable}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-4 h-4 accent-[#D97706]" />
                    <span className="text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2]">🟢 Còn hàng</span>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Thời Gian Chuẩn Bị (phút)</label>
                  <input type="number" min={1} placeholder="10"
                    value={productForm.preparationTime || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, preparationTime: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex gap-2 items-end justify-end md:col-span-3">
                  {editingProductId && (
                    <button type="button" onClick={resetProductForm}
                      className="px-4 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingProductId ? 'Cập Nhật' : 'Thêm Món'}
                  </button>
                </div>
              </form>
            </div>

            {/* Product List */}
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
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
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {products.length === 0 ? (
                    <tr><td colSpan={8} className="p-6 text-center text-[#8B7E74] dark:text-[#B2A496] italic">Chưa có sản phẩm nào.</td></tr>
                  ) : (products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3">
                        <span className="text-2xl">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerText = '🍲'; }} /> : '🍲'}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{p.name}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                          {p.categoryName || 'Khác'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#D97706]">{p.price.toLocaleString('vi-VN')} đ</td>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* List drivers */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">Danh Sách Tài Xế Nội Bộ</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((d) => (
                  <div key={d.id} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] flex gap-3.5 items-start">
                    <div className="w-11 h-11 rounded-xl bg-[#D97706]/10 border border-[#E5E1D8] dark:border-[#2D2321] flex items-center justify-center text-xl shrink-0">
                      🛵
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">{d.name}</p>
                      <p className="text-[9px] text-[#D97706] font-mono">ID: {d.id}</p>
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">📞 {d.phone}</p>
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] font-mono mt-0.5">{d.vehicle}</p>

                      <div className="mt-3 flex gap-1.5 items-center">
                        <span className="text-[9px] text-[#8B7E74] dark:text-[#B2A496]">Trạng thái:</span>
                        <select
                          value={d.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as Driver['status'];
                            if (isBackendConnected) {
                              try { await ApiService.updateDriverStatus(d.id, newStatus); } catch (err) { console.error(err); }
                            }
                            onUpdateDriverStatus(d.id, newStatus);
                          }}
                          className="text-[9px] p-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3D302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-none"
                        >
                          <option value="available" className="dark:bg-[#1C1311]">🟢 Rảnh rỗi</option>
                          <option value="busy" className="dark:bg-[#1C1311]">🔴 Bận chở bánh</option>
                          <option value="offline" className="dark:bg-[#1C1311]">⚫ Nghỉ phép/Offline</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create new driver */}
            <div className="lg:col-span-5 bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h3 className="font-serif text-base font-bold text-[#2D241E] dark:text-[#FAF8F5] mb-3">🖊️ Đăng ký Shipper Mới</h3>
              <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mb-4">Thêm tài xế mới vào danh mục nội bộ của Bánh canh cá lóc miền Trung.</p>

              {driverSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl mb-4 text-center font-bold">
                  {driverSuccess}
                </div>
              )}

              <form onSubmit={handleAddDriverSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên Tài Xế:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Số Điện Thoại:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912xxxxx"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Phương Tiện & Biển Số Xe:</label>
                  <input
                    type="text"
                    required
                    placeholder="Dream lùn - 43C1-999.99"
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2D241E] hover:bg-[#3E2F26] dark:bg-[#FAF8F5] dark:hover:bg-[#FAF8F5]/90 text-white dark:text-[#2D241E] text-center py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  🚀 Thêm Shipper Vào Hệ Thống
                </button>
              </form>
            </div>

          </div>
        )}
        {/* TAB: CATEGORIES - Full CRUD */}
        {adminTab === 'categories' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">📂 Quản Lý Danh Mục</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Các danh mục món ăn trong thực đơn</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingCategoryId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Danh Mục</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Danh Mục Mới</>}
              </h4>
              <form onSubmit={handleCategorySubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên Danh Mục</label>
                  <input type="text" required placeholder="Ví dụ: Món Mới"
                    value={categoryForm.name}
                    onChange={(e) => {
                      const n = e.target.value;
                      setCategoryForm(prev => ({ ...prev, name: n, slug: toSlug(n) }));
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Slug (tự động)</label>
                  <input type="text" readOnly value={toSlug(categoryForm.name)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-gray-100 dark:bg-gray-900 text-[#8B7E74] dark:text-[#B2A496] cursor-not-allowed" />
                </div>
                <div className="flex gap-2">
                  {editingCategoryId !== null && (
                    <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', slug: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingCategoryId !== null ? 'Cập Nhật' : 'Thêm Danh Mục'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <tr>
                    <th className="p-3">Tên Danh Mục</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3 text-center">Số Sản Phẩm</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{cat.name}</td>
                      <td className="p-3 font-mono text-[10px] text-[#8B7E74]">{cat.slug}</td>
                      <td className="p-3 text-center text-[#D97706] font-bold">{cat.count}</td>
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
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🧂 Quản Lý Topping</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Các loại topping thêm vào bánh canh</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingToppingId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Topping</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Topping Mới</>}
              </h4>
              <form onSubmit={handleToppingSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên Topping</label>
                  <input type="text" required placeholder="Bánh phở"
                    value={toppingForm.name}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Giá</label>
                  <input type="number" required min={0} placeholder="5000"
                    value={toppingForm.price || ''}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Danh Mục</label>
                  <select value={toppingForm.category}
                    onChange={(e) => setToppingForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    <option value="Đồ Ăn Kèm">Đồ Ăn Kèm</option>
                    <option value="Đồ Uống">Đồ Uống</option>
                    <option value="Tráng Miệng">Tráng Miệng</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={toppingForm.isAvailable}
                      onChange={(e) => setToppingForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-4 h-4 accent-[#D97706]" />
                    <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2]">Khả dụng</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  {editingToppingId !== null && (
                    <button type="button" onClick={() => { setEditingToppingId(null); setToppingForm({ name: '', price: 0, category: 'Đồ Ăn Kèm', isAvailable: true }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingToppingId !== null ? 'Cập Nhật' : 'Thêm Topping'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <tr>
                    <th className="p-3">Tên</th>
                    <th className="p-3 text-right">Giá</th>
                    <th className="p-3">Danh Mục</th>
                    <th className="p-3 text-center">Khả Dụng</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {toppings.map(t => (
                    <tr key={t.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{t.name}</td>
                      <td className="p-3 text-right font-extrabold text-[#D97706]">{t.price.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">{t.category}</span>
                      </td>
                      <td className="p-3 text-center">{t.isAvailable ? <span className="text-emerald-500 font-bold text-[11px]">✓</span> : <span className="text-red-400">✗</span>}</td>
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

        {/* TAB: MATERIALS - Full CRUD */}
        {adminTab === 'materials' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">📦 Quản Lý Nguyên Liệu</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Theo dõi tồn kho nguyên liệu nấu bánh canh</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingMaterialId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Nguyên Liệu</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Nguyên Liệu</>}
              </h4>
              <form onSubmit={handleMaterialSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[140px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Nguyên Liệu</label>
                  <input type="text" required placeholder="Cá lóc"
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[80px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">ĐVT</label>
                  <input type="text" required placeholder="kg"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[90px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tồn Kho</label>
                  <input type="number" required min={0} placeholder="10"
                    value={materialForm.stock || ''}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[90px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tối Thiểu</label>
                  <input type="number" required min={0} placeholder="2"
                    value={materialForm.min || ''}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, min: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[110px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Đơn Giá</label>
                  <input type="number" required min={0} placeholder="80000"
                    value={materialForm.price || ''}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex gap-2">
                  {editingMaterialId !== null && (
                    <button type="button" onClick={() => { setEditingMaterialId(null); setMaterialForm({ name: '', unit: 'kg', stock: 0, min: 0, price: 0 }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingMaterialId !== null ? 'Cập Nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <tr>
                    <th className="p-3">Nguyên Liệu</th>
                    <th className="p-3">ĐVT</th>
                    <th className="p-3 text-right">Tồn Kho</th>
                    <th className="p-3 text-right">Tối Thiểu</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {materials.map(m => (
                    <tr key={m.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{m.name}</td>
                      <td className="p-3">{m.unit}</td>
                      <td className={`p-3 text-right font-bold ${m.stock <= m.min ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{m.stock}</td>
                      <td className="p-3 text-right text-[#8B7E74]">{m.min}</td>
                      <td className="p-3 text-right font-extrabold text-[#D97706]">{m.price.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleEditMaterial(m)}
                            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteMaterial(m.id)}
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
        {/* TAB: TABLES - Full CRUD */}
        {adminTab === 'tables' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🪑 Quản Lý Bàn Ăn</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Sơ đồ bàn cho khách dùng tại quán</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingTableId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Bàn</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Bàn Mới</>}
              </h4>
              <form onSubmit={handleTableSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 min-w-[100px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Số Bàn</label>
                  <input type="text" required placeholder="A1"
                    value={tableForm.number}
                    onChange={(e) => setTableForm(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[100px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Sức Chứa</label>
                  <input type="number" required min={1} placeholder="4"
                    value={tableForm.capacity || ''}
                    onChange={(e) => setTableForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Vị Trí</label>
                  <input type="text" required placeholder="Tầng 1 - Gần cửa"
                    value={tableForm.position}
                    onChange={(e) => setTableForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex gap-2">
                  {editingTableId !== null && (
                    <button type="button" onClick={() => { setEditingTableId(null); setTableForm({ number: '', capacity: 2, position: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingTableId !== null ? 'Cập Nhật' : 'Thêm Bàn'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tables.map(t => (
                <div key={t.id} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center relative">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => handleEditTable(t)}
                      className="p-1 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteTable(t.id)}
                      className="p-1 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-3xl mb-2">🪑</div>
                  <h4 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">{t.number}</h4>
                  <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">{t.capacity} chỗ • {t.position}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PROMOTIONS - Full CRUD */}
        {adminTab === 'promotions' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🏷️ Quản Lý Khuyến Mãi</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Mã giảm giá và chương trình ưu đãi</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingPromoId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Khuyến Mãi</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Khuyến Mãi</>}
              </h4>
              <form onSubmit={handlePromoSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[130px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Mã</label>
                  <input type="text" required placeholder="WELCOME10"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên</label>
                  <input type="text" required placeholder="Giảm 10% khách mới"
                    value={promoForm.name}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Loại</label>
                  <select value={promoForm.discount_type}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, discount_type: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    <option value="percentage">%</option>
                    <option value="fixed">VNĐ</option>
                  </select>
                </div>
                <div className="space-y-1 min-w-[100px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Giá Trị</label>
                  <input type="number" required min={0} placeholder="10"
                    value={promoForm.discount_value || ''}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Đơn Tối Thiểu</label>
                  <input type="number" required min={0} placeholder="100000"
                    value={promoForm.min_order_amount || ''}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex gap-2">
                  {editingPromoId !== null && (
                    <button type="button" onClick={() => { setEditingPromoId(null); setPromoForm({ code: '', name: '', discount_type: 'percentage', discount_value: 0, min_order_amount: 0 }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingPromoId !== null ? 'Cập Nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map(p => (
                <div key={p.id} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] flex gap-3 relative">
                  <button onClick={() => handleEditPromo(p)}
                    className="absolute top-2 right-8 p-1 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-950/50 cursor-pointer">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeletePromo(p.id)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="text-2xl">🏷️</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">{p.name}</h4>
                    <p className="text-[10px] font-mono text-[#D97706] font-bold">{p.code}</p>
                    <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mt-1">
                      {p.discount_type === 'percentage' ? `Giảm ${p.discount_value}%` : `Giảm ${p.discount_value.toLocaleString('vi-VN')}đ`} • Đơn tối thiểu {p.min_order_amount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REVIEWS - Full CRUD */}
        {adminTab === 'reviews' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">⭐ Đánh Giá Khách Hàng</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Phản hồi từ thực khách</p>

            <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#3E302D]">
              <h4 className="font-serif font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                {editingReviewId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Đánh Giá</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Đánh Giá</>}
              </h4>
              <form onSubmit={handleReviewSubmit} className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Khách Hàng</label>
                  <input type="text" required placeholder="Nguyễn Văn A"
                    value={reviewForm.customer}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, customer: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Sản Phẩm</label>
                  <input type="text" required placeholder="Bánh Canh Cá Lóc"
                    value={reviewForm.product}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, product: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Đánh Giá (1-5)</label>
                  <select value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                  </select>
                </div>
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Nhận Xét</label>
                  <input type="text" placeholder="Nước dùng ngọt thanh..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex gap-2">
                  {editingReviewId !== null && (
                    <button type="button" onClick={() => { setEditingReviewId(null); setReviewForm({ customer: '', product: '', rating: 5, comment: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                      <X className="w-3.5 h-3.5 inline mr-1" />Hủy
                    </button>
                  )}
                  <button type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
                    {editingReviewId !== null ? 'Cập Nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                  <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3 text-center">Đánh Giá</th>
                      <th className="p-3">Nhận Xét</th>
                      <th className="p-3 text-center">Duyệt</th>
                      <th className="p-3">Ngày</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                    {reviews.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-[#8B7E74] dark:text-[#B2A496] italic">Chưa có đánh giá nào.</td></tr>
                    ) : (reviews.map(r => (
                      <tr key={r.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                        <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{r.customer}</td>
                        <td className="p-3">{r.product}</td>
                        <td className="p-3 text-center text-amber-500">{'⭐'.repeat(r.rating)}</td>
                        <td className="p-3 text-[#8B7E74] max-w-[200px] truncate">{r.comment}</td>
                        <td className="p-3 text-center">
                          {(r as any).isApproved
                            ? <span className="text-emerald-500 font-bold text-[10px]">✅ Đã duyệt</span>
                            : <button onClick={() => handleApproveReview(r.id)} className="text-[10px] bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-bold hover:bg-amber-200 dark:hover:bg-amber-950/50 cursor-pointer">Duyệt</button>}
                        </td>
                        <td className="p-3 text-[10px] text-[#8B7E74] font-mono">{(r as any).createdAt ? new Date((r as any).createdAt).toLocaleDateString('vi-VN') : '-'}</td>
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
        {/* TAB: STATISTICS */}
        {adminTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">📊 Thống Kê Kinh Doanh</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Tổng quan tình hình bán hàng</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng Đơn Hàng', value: orders.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' },
                { label: 'Đã Hoàn Thành', value: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' },
                { label: 'Đang Xử Lý', value: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' },
                { label: 'Đã Hủy', value: orders.filter(o => o.status === 'cancelled').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' },
              ].map((s, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${s.bg}`}>
                  <p className="text-[10px] font-bold text-[#8B7E74] dark:text-[#B2A496] uppercase">{s.label}</p>
                  <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">💰 Doanh Thu</h4>
                <p className="text-2xl font-black text-[#D97706]">
                  {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[10px] text-[#8B7E74] mt-1">Tổng doanh thu từ các đơn hoàn thành</p>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">🛵 Tài Xế</h4>
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

            <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">🔥 Sản Phẩm Bán Chạy</h4>
              <div className="space-y-2">
                {products.filter(p => p.isBestSeller).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-[#1C1311] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-[#D97706]">#{i + 1}</span>
                      <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#D97706]">{p.price.toLocaleString('vi-VN')}đ</span>
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
        {adminTab === 'permissions' && isSuperAdmin && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🔐 Phân quyền & Vai trò</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Quản lý vai trò và phân quyền chi tiết theo module</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel: Role List + CRUD */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#F3F0E9] dark:bg-[#2D2321] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#3E302D]">
                  <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">
                    {editingRoleId !== null ? <><Edit3 className="w-4 h-4 inline mr-1 text-[#D97706]" /> Sửa Vai Trò</> : <><Plus className="w-4 h-4 inline mr-1 text-emerald-500" /> Thêm Vai Trò</>}
                  </h4>
                  <form onSubmit={handleRoleFormSubmit} className="space-y-2">
                    <input type="text" required placeholder="ROLE_NAME"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                    <input type="text" required placeholder="Tên hiển thị"
                      value={roleForm.display}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, display: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                    <input type="text" placeholder="Mô tả"
                      value={roleForm.desc}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, desc: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                    <div className="flex gap-2">
                      {editingRoleId !== null && (
                        <button type="button" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', display: '', desc: '' }); }}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D] cursor-pointer">
                          <X className="w-3 h-3 inline mr-1" />Hủy
                        </button>
                      )}
                      <button type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 cursor-pointer">
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
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-[#D97706] dark:border-amber-700'
                          : 'bg-[#FAF8F5] dark:bg-[#211715] border-[#E5E1D8] dark:border-[#2D2321] hover:border-amber-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-[#D97706] font-mono">{r.name}</p>
                          <p className="text-xs text-[#2D241E] dark:text-[#FAF8F5]">{r.display}</p>
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
                  <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">
                        Quyền hạn cho <span className="text-[#D97706] font-mono">{selectedRoleForPerms.name}</span>
                      </h4>
                      <button
                        onClick={handleSavePermissions}
                        className="px-4 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#D97706]/90 text-white text-xs font-bold cursor-pointer"
                      >
                        Lưu Phân Quyền
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {PERMISSION_MODULES.map(mod => (
                        <div key={mod.module} className="bg-white dark:bg-[#1C1311] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
                          <h5 className="font-bold text-xs text-[#D97706] uppercase mb-2">{mod.label}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {mod.permissions.map(perm => (
                              <label key={perm.code} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer">
                                <input type="checkbox" checked={!!checkPermissions[perm.code]}
                                  onChange={() => handlePermissionToggle(perm.code)}
                                  className="w-4 h-4 accent-[#D97706] cursor-pointer" />
                                <span className="text-[10px] text-[#3E2F26] dark:text-[#EAE3D2]">{perm.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF8F5] dark:bg-[#211715] p-8 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] flex items-center justify-center">
                    <p className="text-xs text-[#8B7E74] italic">Chọn một vai trò ở bên trái để xem và chỉnh sửa quyền hạn</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Creation Section */}
            <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">👤 Tạo Tài Khoản Người Dùng</h4>
              {accountSuccess && <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl text-center font-bold">{accountSuccess}</div>}
              {accountError && <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 text-xs rounded-xl text-center font-bold">{accountError}</div>}
              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên ĐN</label>
                  <input type="text" required placeholder="username" value={accountForm.username}
                    onChange={e => setAccountForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Mật khẩu</label>
                  <input type="password" required placeholder="••••••" value={accountForm.password}
                    onChange={e => setAccountForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Email</label>
                  <input type="email" required placeholder="user@email.com" value={accountForm.email}
                    onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Họ tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" value={accountForm.fullName}
                    onChange={e => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Vai trò</label>
                  <select value={accountForm.roleId} onChange={e => setAccountForm(prev => ({ ...prev, roleId: Number(e.target.value) }))}
                    className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    <option value={0}>-- Chọn role --</option>
                    {roleList.map(r => <option key={r.id} value={r.id}>{r.display} ({r.name})</option>)}
                  </select>
                </div>
                <button type="submit" className="bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                  Tạo TK
                </button>
              </form>

              {/* Existing Users Table */}
              {accountUsers.length > 0 && (
                <div className="mt-4 overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] text-[#2D241E] dark:text-[#FAF8F5] uppercase font-bold border-b border-[#E5E1D8] dark:border-[#2D2321]">
                      <tr><th className="p-2">Username</th><th className="p-2">Họ tên</th><th className="p-2">Email</th><th className="p-2">Vai trò</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                      {accountUsers.map(u => (
                        <tr key={u.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50">
                          <td className="p-2 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{u.username}</td>
                          <td className="p-2">{u.fullName || '-'}</td>
                          <td className="p-2 text-[#8B7E74]">{u.email}</td>
                          <td className="p-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">{u.roleName}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: JAVA BACKEND SOURCE CODE */}
        {adminTab === 'java' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-3 space-y-1">
              <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] font-black uppercase mb-1.5 block">File cấu trúc Java</span>
              {JAVA_BACKEND_FILES.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedJavaFile(i)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedJavaFile === i
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E]'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#201614] text-[#3E2F26] dark:text-[#EAE3D2]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#D97706]" />
                  <div className="truncate">
                    <p className="font-bold">{file.filename}</p>
                    <p className="text-[8px] opacity-75">{file.path.split('/')[2] || 'ROOT'}</p>
                  </div>
                </button>
              ))}

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[10px] text-amber-900 dark:text-amber-300 leading-normal mt-4">
                <strong>📝 Chú ý:</strong> Bạn có thể copy source Spring Boot này dán trực tiếp vào dự án Java IDE của bạn (IntelliJ, Eclipse...). Nó chứa cấu hình kết nối chuẩn để chạy với MySQL XAMPP.
              </div>
            </div>

            <div className="lg:col-span-9 space-y-3">
              <div className="bg-[#2D241E] rounded-2xl overflow-hidden shadow-md text-white">
                <div className="bg-[#3E2F26] px-4 py-2.5 flex justify-between items-center border-b border-[#2D241E]">
                  <span className="text-[10px] font-mono text-[#FAF8F5] font-bold">
                    src/main/java/{JAVA_BACKEND_FILES[selectedJavaFile].path}
                  </span>
                  <button
                    onClick={() => handleCopySource(JAVA_BACKEND_FILES[selectedJavaFile].content)}
                    className="flex items-center gap-1 bg-white/15 hover:bg-white/20 text-white font-mono text-[10px] px-2.5 py-1 rounded cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Đã copy!' : 'Copy code'}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[350px] bg-[#1E1815] text-[#F3F0E9] select-all">
                  <code>{JAVA_BACKEND_FILES[selectedJavaFile].content}</code>
                </pre>
              </div>
            </div>

          </div>
        )}

        {/* TAB: SQL DATABASE SCHEMA FOR XAMPP */}
        {adminTab === 'sql' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <span className="text-xl">🛠️</span>
              <div className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] leading-relaxed">
                <strong>HƯỚNG DẪN KẾT NỐI VÀ CHẠY DATABASE QUA XAMPP Control Panel:</strong>
                <ol className="list-decimal list-inside space-y-1 mt-1.5 font-sans">
                  <li>Mở <strong>XAMPP Control Panel</strong> lên, bật dịch vụ <strong>Apache</strong> và <strong>MySQL</strong>.</li>
                  <li>Nhấp nút <strong>Admin</strong> ở dòng MySQL hoặc gõ địa chỉ <code className="bg-white dark:bg-[#1E1311] border dark:border-[#2D2321] text-red-600 dark:text-red-400 px-1 rounded font-mono">http://localhost/phpmyadmin</code> trên trình duyệt.</li>
                  <li>Click vào tab <strong>SQL</strong> ở menu chính.</li>
                  <li>Sao chép toàn bộ đoạn script SQL mẫu dưới đây, dán vào ô truy vấn SQL và nhấn nút <strong>Go</strong> (Thực hiện).</li>
                  <li>XAMPP sẽ khởi tạo Database <code className="bg-white dark:bg-[#1E1311] border dark:border-[#2D2321] text-red-600 dark:text-red-400 px-1 rounded font-mono">banhcanh_db</code> cùng các bảng Products, Drivers, Orders, Order_Items chuẩn chỉnh!</li>
                </ol>
              </div>
            </div>

            <div className="bg-[#2D241E] rounded-2xl overflow-hidden text-white">
              <div className="bg-[#3E2F26] px-4 py-2.5 flex justify-between items-center border-b border-[#2D241E]">
                <span className="text-[10px] font-mono text-[#FAF8F5] font-bold">banhcanh_db_schema.sql</span>
                <button
                  onClick={() => handleCopySource(MYSQL_DATABASE_SQL)}
                  className="flex items-center gap-1 bg-white/15 hover:bg-white/20 text-white font-mono text-[10px] px-2.5 py-1 rounded cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Đã copy SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[290px] bg-[#1E1815] text-amber-100/90 select-all">
                <code>{MYSQL_DATABASE_SQL}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB: FRONTEND INTEGRATION */}
        {adminTab === 'frontend' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-3 space-y-1">
              <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] font-black uppercase mb-1.5 block">File cấu trúc & Hướng dẫn FE</span>
              {FRONTEND_INTEGRATION_FILES.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFEFile(i)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFEFile === i
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E]'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#201614] text-[#3E2F26] dark:text-[#EAE3D2]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="truncate">
                    <p className="font-bold">{file.filename}</p>
                    <p className="text-[8px] opacity-75">{file.path}</p>
                  </div>
                </button>
              ))}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-[10px] text-emerald-900 dark:text-emerald-300 leading-normal mt-4">
                <strong>💡 Mẹo liên kết:</strong> Tạo một file <code className="bg-white/80 dark:bg-black/20 px-1 rounded font-mono text-red-600 dark:text-red-400">src/services/api.ts</code> và chép nội dung bên phải để thiết lập gọi API chuẩn xác kết nối trực tiếp đến Spring Boot.
              </div>
            </div>

            <div className="lg:col-span-9 space-y-3">
              <div className="bg-[#2D241E] rounded-2xl overflow-hidden shadow-md text-white">
                <div className="bg-[#3E2F26] px-4 py-2.5 flex justify-between items-center border-b border-[#2D241E]">
                  <span className="text-[10px] font-mono text-[#FAF8F5] font-bold">
                    {FRONTEND_INTEGRATION_FILES[selectedFEFile].path}
                  </span>
                  <button
                    onClick={() => handleCopySource(FRONTEND_INTEGRATION_FILES[selectedFEFile].content)}
                    className="flex items-center gap-1 bg-white/15 hover:bg-white/20 text-white font-mono text-[10px] px-2.5 py-1 rounded cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Đã copy!' : 'Copy code'}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[350px] bg-[#1E1815] text-[#F3F0E9] select-all">
                  <code>{FRONTEND_INTEGRATION_FILES[selectedFEFile].content}</code>
                </pre>
              </div>
            </div>

          </div>
        )}
        {/* TAB: USER MANAGEMENT */}
        {adminTab === 'users' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-2">

            <div className="xl:col-span-7 space-y-6">

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                <span className="text-xl shrink-0">🤝</span>
                <div className="text-xs text-[#FAF8F5]/80 space-y-1">
                  <p className="font-bold text-[#D97706] text-sm">Chính Sách Tài Khoản: Chỉ Người Dùng (Khách Hàng) Đăng Ký</p>
                  <p className="leading-relaxed text-[#B2A496]">
                    Theo nghiệp vụ của quán bánh canh, hệ thống chỉ cho phép khách hàng vãng lai đăng ký tài khoản thành viên để mua sắm, nhận mã giảm giá và tích điểm. <strong className="text-amber-400">Tài xế (Shipper)</strong> và <strong className="text-amber-400">Chủ quán (Admin)</strong> được coi là nhân sự nội bộ của quán, do đó sẽ được khởi tạo thủ công (Seeding) trực tiếp trong MySQL Database để đảm bảo tính bảo mật, tránh giả mạo tài xế hoặc chiếm đoạt cổng quản trị.
                  </p>
                </div>
              </div>

              <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#241A18] px-4 py-3 flex justify-between items-center border-b border-[#2D2321]">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">📀</span>
                    <span className="text-xs font-serif font-bold text-[#FAF8F5]">Bước 1: Tạo Bảng `users` Lên phpMyAdmin</span>
                  </div>
                  <button
                    onClick={() => handleCopySource(`-- SCRIPT TẠO BẢNG USER TRÊN phpMyAdmin XAMPP
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  \`password\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  \`role\` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED TÀI KHOẢN CHỦ QUÁN MẶC ĐỊNH SỬ DỤNG
INSERT INTO \`users\` (\`username\`, \`password\`, \`email\`, \`role\`)
VALUES ('admin', 'admin', 'chuan@banhcanhcaloc.com', 'admin');`)}
                    className="bg-white/10 hover:bg-white/15 text-white text-[9px] font-mono px-2 py-1 rounded cursor-pointer transition-all"
                  >
                    {copiedText ? 'Đã sao chép!' : 'Sao chép SQL'}
                  </button>
                </div>
                <div className="p-4 bg-[#140D0C] text-xs space-y-3 font-sans">
                  <p className="text-xs text-[#B2A496] leading-relaxed">
                    Mở phpMyAdmin, chọn database <code className="bg-black/30 text-amber-400 px-1 rounded font-mono">banhcanh_db</code>, chạy lệnh SQL sau để khởi tạo bảng quản lý người dùng:
                  </p>
                  <pre className="p-3 bg-black/40 rounded-xl text-amber-100/90 font-mono text-[10px] overflow-x-auto leading-relaxed max-h-[160px] select-all">
{`CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  \`password\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`email\` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  \`role\` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm admin (chủ quán) bảo mật
INSERT INTO \`users\` (\`username\`, \`password\`, \`email\`, \`role\`)
VALUES ('admin', 'admin', 'admin@banhcanhcaloc.com', 'admin');`}
                  </pre>
                </div>
              </div>

              <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#241A18] px-4 py-3 flex justify-between items-center border-b border-[#2D2321]">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">☕</span>
                    <span className="text-xs font-serif font-bold text-[#FAF8F5]">Bước 2: Cập Nhật Java Spring Boot Entity</span>
                  </div>
                  <button
                    onClick={() => handleCopySource(`package com.example.banhcanh.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role = "customer";
}`)}
                    className="bg-white/10 hover:bg-white/15 text-white text-[9px] font-mono px-2 py-1 rounded cursor-pointer transition-all"
                  >
                    {copiedText ? 'Đã sao chép!' : 'Sao chép Entity'}
                  </button>
                </div>
                <div className="p-4 bg-[#140D0C] text-xs space-y-2">
                  <p className="text-[#B2A496] leading-normal">
                    Tạo file <strong className="font-mono text-amber-500">User.java</strong> trong thư mục model của Spring Boot:
                  </p>
                  <pre className="p-3 bg-black/40 rounded-xl text-slate-300 font-mono text-[10px] overflow-x-auto leading-relaxed max-h-[160px] select-all">
{`package com.example.banhcanh.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role = "customer";
}`}
                  </pre>
                </div>
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
                    {apiStats && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40">
                        {apiStats.totalUsers} users
                      </span>
                    )}
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D2321]">
                          {apiUsers.map((u: any) => (
                            <tr key={u.id} className="hover:bg-[#241A18]/50">
                              <td className="p-2 font-bold text-amber-500">{u.username}</td>
                              <td className="p-2 text-[#B2A496]">{u.email}</td>
                              <td className="p-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  u.role === 'admin' ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' :
                                  u.role === 'driver' ? 'bg-blue-950/30 text-blue-400 border-blue-900/40' :
                                  'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                                }`}>
                                  {u.role === 'admin' ? 'Quản trị' : u.role === 'driver' ? 'Tài xế' : 'Khách hàng'}
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

              {isBackendConnected && apiStats && (
                <div className="p-4 bg-[#1C1311] border border-[#2D2321] rounded-2xl shadow-xs">
                  <h5 className="font-serif font-bold text-xs text-[#FAF8F5] mb-3">📊 Thống Kê Hệ Thống</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#241A18] p-2.5 rounded-xl border border-[#2D2321]">
                      <p className="text-[9px] text-[#8B7E74] font-mono">Đơn hàng</p>
                      <p className="text-sm font-bold text-[#D97706]">{apiStats.totalOrders}</p>
                    </div>
                    <div className="bg-[#241A18] p-2.5 rounded-xl border border-[#2D2321]">
                      <p className="text-[9px] text-[#8B7E74] font-mono">Hoàn thành</p>
                      <p className="text-sm font-bold text-emerald-400">{apiStats.completedOrders}</p>
                    </div>
                    <div className="bg-[#241A18] p-2.5 rounded-xl border border-[#2D2321]">
                      <p className="text-[9px] text-[#8B7E74] font-mono">Doanh thu</p>
                      <p className="text-sm font-bold text-amber-500">{apiStats.totalRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="bg-[#241A18] p-2.5 rounded-xl border border-[#2D2321]">
                      <p className="text-[9px] text-[#8B7E74] font-mono">Tài xế bận</p>
                      <p className="text-sm font-bold text-blue-400">{apiStats.busyDrivers}/{apiStats.totalDrivers}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4.5 bg-[#1C1311] border border-[#2D2321] rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#FAF8F5]">Tài Khoản Local</h4>
                    <p className="text-[10px] text-[#8B7E74]">Lưu trữ mô phỏng khách hàng offline</p>
                  </div>
                  <button
                    onClick={handleResetSimulatedUsers}
                    className="bg-red-950/20 hover:bg-red-950/40 text-red-100 border border-red-900/50 text-[9px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                  >
                    Reset
                  </button>
                </div>

                {localUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8B7E74] italic border border-dashed border-[#2D2321] rounded-xl">
                    Chưa có khách hàng offline đăng ký.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {localUsers.map((u, index) => (
                      <div key={index} className="p-2.5 rounded-xl bg-[#241A18] border border-[#3E2E2A] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-500 font-mono text-[11px]">{u.username}</span>
                          <span className="bg-[#FAF8F5]/10 text-[8px] font-black uppercase text-[#FAF8F5]/80 px-1 rounded">{u.role}</span>
                        </div>
                        <p className="text-[9px] text-[#8B7E74] truncate max-w-[140px]">{u.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#1C1311] border border-[#2D2321] rounded-2xl text-xs space-y-3 shadow-xs">
                <h5 className="font-serif font-bold text-amber-500">🔑 Tài Khoản Quản Trị</h5>
                <div className="bg-[#140D0C] p-3 rounded-xl font-mono text-[11px] text-amber-200/90 border border-[#2D2321] space-y-1">
                  <p>• <strong>Username:</strong> <span className="text-white">admin</span></p>
                  <p>• <strong>Password:</strong> <span className="text-white">admin</span></p>
                  <p>• <strong>Vai trò:</strong> <span className="text-emerald-400 font-black">Chủ quán (Admin)</span></p>
                </div>
              </div>

            </div>

          </div>
        )}



      </div>

      {/* Confirmation Dialog for Order Cancellation */}
      {orderIdToCancel !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E1311] rounded-2xl max-w-sm w-full p-6 border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl space-y-4 transform scale-100 transition-all select-none">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Hủy đơn hàng đang chờ?</h4>
                <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496]">Hành động này sẽ cập nhật trạng thái đơn thành "Đã Hủy"!</p>
              </div>
            </div>

            <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng mã <strong className="font-mono text-[#2D241E] dark:text-[#FAF8F5] bg-[#F3F0E9] dark:bg-[#2D2321] px-1.5 py-0.5 rounded font-black">{orderIdToCancel}</strong> này không?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderIdToCancel(null)}
                className="flex-1 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#3D302D] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] text-[#3E2F26] dark:text-[#EAE3D2] py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
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
