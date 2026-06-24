import React, { useState } from 'react';
import { Order, Driver, OrderStatus, Product } from '../types';
import { JAVA_BACKEND_FILES, MYSQL_DATABASE_SQL, FRONTEND_INTEGRATION_FILES } from '../data';
import { FileCode, Check, Copy, AlertTriangle, Plus, Edit3, Trash2, X } from 'lucide-react';
import { ApiService } from '../services/api';

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
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'drivers' | 'categories' | 'materials' | 'tables' | 'promotions' | 'reviews' | 'stats' | 'users' | 'java' | 'sql' | 'frontend' | 'permissions'>('orders');
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
    // Refresh local users
    try {
      const saved = localStorage.getItem('banhcanh_registered_users');
      setLocalUsers(saved ? JSON.parse(saved) : []);
    } catch {
      setLocalUsers([]);
    }
    // Refresh API users if connected
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
  
  const [productForm, setProductForm] = useState<{ name: string; description: string; price: number; categoryName: string; isBestSeller: boolean; imageUrl: string }>({ name: '', description: '', price: 0, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: false, imageUrl: '' });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState('');
  const [productError, setProductError] = useState('');

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

  const handleCopySource = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: 0, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: false, imageUrl: '' });
    setEditingProductId(null);
    setProductError('');
  };

  const handleEditProduct = (p: Product) => {
    setProductForm({ name: p.name, description: p.description, price: p.price, categoryName: p.categoryName || '', isBestSeller: p.isBestSeller, imageUrl: p.imageUrl || '' });
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
      imageUrl: productForm.imageUrl || undefined
    };

    const productData: Omit<Product, 'id'> = { ...productForm, price: Number(productForm.price), isAvailable: true, preparationTime: 10 };

    try {
      if (editingProductId) {
        if (isBackendConnected) {
          await ApiService.updateProduct(editingProductId, payload);
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
      if (isBackendConnected) {
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
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'orders' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            📋 Live Orders ({orders.length})
          </button>
          <button
            onClick={() => setAdminTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'products' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🍲 Sản Phẩm ({products.length})
          </button>
          <button
            onClick={() => setAdminTab('drivers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'drivers' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🛵 Shippers
          </button>
          <button
            onClick={() => {
              handleRefreshUsers();
              setAdminTab('users');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'users' ? 'bg-[#D97706] text-white shadow-xs animate-pulse' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            👥 Quản Lý Users ({localUsers.length})
          </button>
          <button
            onClick={() => setAdminTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'categories' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            📂 Danh Mục
          </button>
          <button
            onClick={() => setAdminTab('materials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'materials' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            📦 Nguyên Liệu
          </button>
          <button
            onClick={() => setAdminTab('tables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'tables' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🪑 Bàn Ăn
          </button>
          <button
            onClick={() => setAdminTab('promotions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'promotions' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🏷️ Khuyến Mãi
          </button>
          <button
            onClick={() => setAdminTab('reviews')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'reviews' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            ⭐ Đánh Giá
          </button>
          <button
            onClick={() => setAdminTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'stats' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            📊 Thống Kê
          </button>
          <button
            onClick={() => setAdminTab('java')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              adminTab === 'java' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            <span>☕ Java</span>
            <span className="bg-red-200 dark:bg-red-950/40 text-red-900 dark:text-red-400 text-[8px] font-black px-1 rounded-sm">XAMPP</span>
          </button>
          <button
            onClick={() => setAdminTab('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'sql' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🗄️ SQL
          </button>
          <button
            onClick={() => setAdminTab('frontend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'frontend' ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] shadow-xs' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
            }`}
          >
            🔌 FE
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setAdminTab('permissions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'permissions' ? 'bg-[#D97706] text-white shadow-xs animate-pulse' : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#E5E1D8] dark:hover:bg-[#3E302D]'
              }`}
            >
              🔐 Phân Quyền
            </button>
          )}
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
                      <th className="p-3.5 text-right">Tổng Tiền</th>
                      <th className="p-3.5">Trạng thái</th>
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
                              {drivers
                                .filter((d) => d.status === 'available')
                                .map((d) => (
                                  <option key={d.id} value={d.id} className="dark:bg-[#1E1311]">
                                    {d.name} ({d.vehicle.split('-')[0]})
                                  </option>
                                ))}
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
                                onClick={() => onUpdateOrderStatus(order.id, 'shipping')}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2 py-1 rounded text-[10px] text-center w-full cursor-pointer"
                              >
                                Xác Nhận Hoàn Tất Lên Xe
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
                    onChange={(e) => setProductForm(prev => ({ ...prev, categoryName: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]">
                    <option value="Bánh Canh Cá Lóc">Bánh canh chính</option>
                    <option value="Đồ Ăn Kèm">Toppings thêm</option>
                    <option value="Đồ Uống">Nước giải nhiệt</option>
                    <option value="Tráng Miệng">Tráng Miệng</option>
                    <option value="Combo">Combo</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Mô Tả</label>
                  <input type="text" placeholder="Mô tả món ăn..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Hình Ảnh (URL)</label>
                  <input type="text" placeholder="https://..."
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#3E302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                      className="w-4 h-4 accent-[#D97706]" />
                    <span className="text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2]">🔥 Bán chạy</span>
                  </label>
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
                    <th className="p-3 text-center">Bán Chạy</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {products.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-[#8B7E74] dark:text-[#B2A496] italic">Chưa có sản phẩm nào.</td></tr>
                  ) : (products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3">
                        <span className="text-2xl">{(p.imageUrl || '').startsWith('http') ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" /> : (p.imageUrl || '🍲')}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{p.name}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                          {p.categoryName || 'Khác'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#D97706]">{p.price.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-center">{p.isBestSeller ? <span className="text-emerald-500 font-bold">🔥 Bán chạy</span> : '-'}</td>
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

        {/* TAB: CATEGORIES */}
        {adminTab === 'categories' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">📂 Quản Lý Danh Mục</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Các danh mục món ăn trong thực đơn</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Bánh Canh Cá Lóc', slug: 'banh-canh-ca-loc', count: 5 },
                { name: 'Đồ Ăn Kèm', slug: 'do-an-kem', count: 8 },
                { name: 'Đồ Uống', slug: 'do-uong', count: 6 },
                { name: 'Tráng Miệng', slug: 'trang-mieng', count: 3 },
                { name: 'Combo', slug: 'combo', count: 2 },
              ].map((cat) => (
                <div key={cat.slug} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                  <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">{cat.name}</h4>
                  <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">Slug: {cat.slug}</p>
                  <p className="text-[10px] text-[#D97706] font-bold mt-2">{cat.count} sản phẩm</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MATERIALS */}
        {adminTab === 'materials' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">📦 Quản Lý Nguyên Liệu</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Theo dõi tồn kho nguyên liệu nấu bánh canh</p>
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <tr>
                    <th className="p-3">Nguyên Liệu</th>
                    <th className="p-3">ĐVT</th>
                    <th className="p-3 text-right">Tồn Kho</th>
                    <th className="p-3 text-right">Tối Thiểu</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {[
                    { name: 'Cá lóc', unit: 'kg', stock: 10, min: 2, price: 80000 },
                    { name: 'Bột gạo', unit: 'kg', stock: 15, min: 5, price: 25000 },
                    { name: 'Bột năng', unit: 'kg', stock: 10, min: 3, price: 20000 },
                    { name: 'Hành lá', unit: 'kg', stock: 2, min: 0.5, price: 30000 },
                    { name: 'Rau răm', unit: 'kg', stock: 1, min: 0.3, price: 25000 },
                    { name: 'Chả cá', unit: 'kg', stock: 5, min: 1, price: 120000 },
                    { name: 'Trứng cút', unit: 'cái', stock: 100, min: 30, price: 2000 },
                  ].map((m, i) => (
                    <tr key={i} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{m.name}</td>
                      <td className="p-3">{m.unit}</td>
                      <td className={`p-3 text-right font-bold ${m.stock <= m.min ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{m.stock}</td>
                      <td className="p-3 text-right text-[#8B7E74]">{m.min}</td>
                      <td className="p-3 text-right font-extrabold text-[#D97706]">{m.price.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DINING TABLES */}
        {adminTab === 'tables' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🪑 Quản Lý Bàn Ăn</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Sơ đồ bàn cho khách dùng tại quán</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { number: 'A1', capacity: 2, position: 'Tầng 1 - Gần cửa' },
                { number: 'A2', capacity: 4, position: 'Tầng 1 - Giữa' },
                { number: 'A3', capacity: 4, position: 'Tầng 1 - Góc' },
                { number: 'B1', capacity: 6, position: 'Tầng 2 - Phòng lạnh' },
              ].map((t, i) => (
                <div key={i} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center">
                  <div className="text-3xl mb-2">🪑</div>
                  <h4 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">{t.number}</h4>
                  <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">{t.capacity} chỗ • {t.position}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PROMOTIONS */}
        {adminTab === 'promotions' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🏷️ Quản Lý Khuyến Mãi</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Mã giảm giá và chương trình ưu đãi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { code: 'WELCOME10', name: 'Giảm 10% khách mới', type: 'percentage', value: 10, min: 100000 },
                { code: 'FREESHIP', name: 'Free ship đơn 150k', type: 'fixed', value: 20000, min: 150000 },
              ].map((p, i) => (
                <div key={i} className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] flex gap-3">
                  <div className="text-2xl">🏷️</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">{p.name}</h4>
                    <p className="text-[10px] font-mono text-[#D97706] font-bold">{p.code}</p>
                    <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mt-1">
                      {p.type === 'percentage' ? `Giảm ${p.value}%` : `Giảm ${p.value.toLocaleString('vi-VN')}đ`} • Đơn tối thiểu {p.min.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REVIEWS */}
        {adminTab === 'reviews' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">⭐ Đánh Giá Khách Hàng</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Phản hồi từ thực khách</p>
            <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1210]">
              <table className="w-full text-left text-xs text-[#3E2F26] dark:text-[#EAE3D2]">
                <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] uppercase font-bold text-[#2D241E] dark:text-[#FAF8F5] border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <tr>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Sản Phẩm</th>
                    <th className="p-3 text-center">Đánh Giá</th>
                    <th className="p-3">Nhận Xét</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                  {[
                    { customer: 'Nguyễn Thị A', product: 'Bánh Canh Cá Lóc', rating: 5, comment: 'Nước dùng ngọt thanh, cá tươi ngon!' },
                    { customer: 'Trần Văn B', product: 'Bánh Canh Cá Lóc', rating: 4, comment: 'Rất ngon, sẽ ủng hộ quán dài dài.' },
                  ].map((r, i) => (
                    <tr key={i} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50 transition-colors">
                      <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{r.customer}</td>
                      <td className="p-3">{r.product}</td>
                      <td className="p-3 text-center text-amber-500">{'⭐'.repeat(r.rating)}</td>
                      <td className="p-3 text-[#8B7E74] max-w-[200px] truncate">{r.comment}</td>
                    </tr>
                  ))}
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
              {/* Doanh thu */}
              <div className="bg-[#FAF8F5] dark:bg-[#211715] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">💰 Doanh Thu</h4>
                <p className="text-2xl font-black text-[#D97706]">
                  {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[10px] text-[#8B7E74] mt-1">Tổng doanh thu từ các đơn hoàn thành</p>
              </div>

              {/* Tài xế */}
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

            {/* Top sản phẩm */}
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

        {/* TAB: PERMISSIONS (Super Admin only) */}
        {adminTab === 'permissions' && isSuperAdmin && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">🔐 Phân Quyền Hệ Thống</h3>
            <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Quản lý vai trò và quyền hạn của từng tài khoản</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Roles */}
              <div className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">Vai Trò (Roles)</h4>
                <div className="space-y-2">
                  {[
                    { name: 'ROLE_SUPER_ADMIN', display: 'Đại Siêu Quản Trị', desc: 'Toàn quyền hệ thống' },
                    { name: 'ROLE_ADMIN', display: 'Quản lý', desc: 'Quản lý đơn hàng, sản phẩm, tài xế' },
                    { name: 'ROLE_STAFF', display: 'Nhân viên', desc: 'Xem và cập nhật đơn hàng' },
                    { name: 'ROLE_CUSTOMER', display: 'Khách hàng', desc: 'Đặt món và theo dõi' },
                  ].map((r, i) => (
                    <div key={i} className="bg-white dark:bg-[#1C1311] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
                      <p className="font-bold text-xs text-[#D97706] font-mono">{r.name}</p>
                      <p className="text-xs text-[#2D241E] dark:text-[#FAF8F5]">{r.display}</p>
                      <p className="text-[9px] text-[#8B7E74]">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">Quyền Hạn (Permissions)</h4>
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {[
                    { code: 'product:*', name: 'Quản lý sản phẩm', module: 'product' },
                    { code: 'order:*', name: 'Quản lý đơn hàng', module: 'order' },
                    { code: 'driver:*', name: 'Quản lý tài xế', module: 'driver' },
                    { code: 'category:*', name: 'Quản lý danh mục', module: 'category' },
                    { code: 'user:read', name: 'Xem người dùng', module: 'user' },
                    { code: 'role:assign', name: 'Phân quyền', module: 'role' },
                    { code: 'stats:view', name: 'Xem thống kê', module: 'stats' },
                  ].map((p, i) => (
                    <div key={i} className="bg-white dark:bg-[#1C1311] p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">{p.code}</span>
                        <span className="text-[10px] text-[#8B7E74] ml-2">{p.name}</span>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#F3F0E9] dark:bg-[#2D2321] text-[#8B7E74] font-mono">{p.module}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User-Role Assignment */}
            <div className="bg-[#FAF8F5] dark:bg-[#211715] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">Phân Vai Trò Cho Người Dùng</h4>
              <div className="overflow-x-auto border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F0E9] dark:bg-[#2D2321] text-[#2D241E] dark:text-[#FAF8F5] uppercase font-bold border-b border-[#E5E1D8] dark:border-[#2D2321]">
                    <tr>
                      <th className="p-3">Người Dùng</th>
                      <th className="p-3">Vai Trò Hiện Tại</th>
                      <th className="p-3">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321] bg-white dark:bg-[#1C1311]">
                    {[
                      { user: 'superadmin', role: 'ROLE_SUPER_ADMIN', note: 'Toàn quyền' },
                      { user: 'admin', role: 'ROLE_ADMIN', note: 'Quản lý' },
                      { user: 'customer', role: 'ROLE_CUSTOMER', note: 'Khách hàng' },
                    ].map((u, i) => (
                      <tr key={i} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#2D2321]/50">
                        <td className="p-3 font-bold text-[#2D241E] dark:text-[#FAF8F5]">{u.user}</td>
                        <td className="p-3">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-[#8B7E74]">{u.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: JAVA BACKEND SOURCE CODE */}
        {adminTab === 'java' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left selector */}
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

            {/* Code presentation */}
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

        {/* TAB 4: SQL DATABASE SCHEMA FOR XAMPP */}
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

        {/* TAB 5: FRONTEND INTEGRATION */}
        {adminTab === 'frontend' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left selector */}
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

        {/* TAB 6: USER MANAGEMENT & DATABASE SETUP GUIDES */}
        {adminTab === 'users' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-2">
            
            {/* LEFT COLUMN: GUIDES AND STEP BY STEP SETUP */}
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

              {/* SQL Schema Code Card */}
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

              {/* Spring Boot Java Entity card */}
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
    private String role = "customer"; // customer hoặc admin
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

            {/* RIGHT COLUMN: USERS FROM API + LOCAL */}
            <div className="xl:col-span-5 space-y-4">

              {/* API Users (when connected) */}
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

              {/* Stats Summary Card */}
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

              {/* Local Storage Users */}
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

              {/* Quick Credentials Sandbox summary */}
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
