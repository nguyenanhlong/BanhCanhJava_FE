import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { TrackingSection } from './components/TrackingSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';

import { Product, CartItem, User, Order, Driver, OrderStatus, ProductReview } from './types';
import { INITIAL_PRODUCTS, INITIAL_DRIVERS, INITIAL_REVIEWS } from './data';
import { ApiService } from './services/api';
import { Sparkles, Utensils, MessageCircle, Heart, Info, Clock, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Toaster, Toast } from './components/Toaster';

export default function App() {
  // Application tabs: 'home' | 'menu' | 'about' | 'tracking' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('home');
  
  // Products, drivers, orders list
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('banhcanh_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved orders:', e);
      }
    }
    return [
      {
        id: 'DH-1001',
        customerName: 'Lê Thanh Vy',
        phone: '0943221100',
        address: '24 Lê Lợi, TP. Huế',
        items: [
          { productName: 'Bánh Canh Cá Lóc Đặc Biệt', quantity: 2, price: 65000, noodleType: 'Bột gạo', notes: 'Cay vừa, nhiều hành và củ nén' },
          { productName: 'Bánh Quẩy Giòn', quantity: 2, price: 5000 }
        ],
        totalAmount: 140000,
        paymentMethod: 'momo',
        paymentStatus: 'paid',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        driverId: 'driver-2',
        driverName: 'Trần Minh Hải',
        etaMinutes: 0
      },
      {
        id: 'DH-1002',
        customerName: 'Phạm Ngọc Thạch',
        phone: '0935555123',
        address: 'K45/12 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng',
        items: [
          { productName: 'Bánh Canh Đầu Lòng Cá Lóc', quantity: 1, price: 55000, noodleType: 'Bột lọc' },
          { productName: 'Trứng Cút (5 Quả)', quantity: 2, price: 8000 }
        ],
        totalAmount: 71000,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'preparing',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ];
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);

  // Sync orders to localStorage (as offline / redundant persistence cache)
  useEffect(() => {
    localStorage.setItem('banhcanh_orders', JSON.stringify(orders));
  }, [orders]);

  // Load real data from Spring Boot if online, otherwise use local fallback
  useEffect(() => {
    async function synchronizeWithBackend() {
      try {
        setIsLoadingBackend(true);
        const connected = await ApiService.checkConnection();
        if (connected) {
          const [backendProducts, backendDrivers, backendOrders] = await Promise.all([
            ApiService.getProducts(),
            ApiService.getDrivers(),
            ApiService.getOrders()
          ]);
          
          if (backendProducts && backendProducts.length > 0) {
            setProducts(backendProducts);
          }
          if (backendDrivers && backendDrivers.length > 0) {
            setDrivers(backendDrivers);
          }
          if (backendOrders && backendOrders.length > 0) {
            setOrders(backendOrders);
          }
          
          setIsBackendConnected(true);
          showToast('🔌 Đã kết nối thành công đến database MySQL & Spring Boot!', 'success', 'Cơ sở dữ liệu Live');
        } else {
          setIsBackendConnected(false);
          console.log('Spring Boot offline, falling back to local simulation database.');
        }
      } catch (err) {
        console.error('Error auto-syncing with Spring Boot:', err);
        setIsBackendConnected(false);
      } finally {
        setIsLoadingBackend(false);
      }
    }
    synchronizeWithBackend();
  }, []);

  // Auth User
  const [user, setUser] = useState<User | null>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Payment Gateway Simulator Modal State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingCheckoutDetails, setPendingCheckoutDetails] = useState<{
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'momo' | 'vnpay' | 'card' | 'cod';
    totalAmount: number;
    items: CartItem[];
  } | null>(null);

  // Auth Modal State
  const [authOpen, setAuthOpen] = useState(false);

  // Chat message simulation state
  const [chatHistory, setChatHistory] = useState<Record<string, { sender: string; text: string; timestamp: string }[]>>({
    'DH-1001': [
      { sender: 'System', text: 'Tài xế nhận đơn! Đang di chuyển giao hàng nóng hổi.', timestamp: '11:45 AM' },
      { sender: 'Driver', text: 'Chào chị Vy ạ, em gần tới chỗ mình rồi nghen!', timestamp: '11:58 AM' }
    ]
  });

  // Food Filter Categorization
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bestsellers' | 'main' | 'extra' | 'drink'>('all');

  // Reviews State
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);

  // Toast System State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('banhcanh_theme') === 'dark';
  });

  // Dark Mode side effect to toggle class on root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('banhcanh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('banhcanh_theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', title?: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load from local storage on bootstrap
  useEffect(() => {
    const savedUser = localStorage.getItem('banhcanh_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedCart = localStorage.getItem('banhcanh_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    const savedReviews = localStorage.getItem('banhcanh_reviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  // Automated background progress simulation for 'shipping' orders
  useEffect(() => {
    const routeMilestones = [
      { progress: 10, stage: 'Đang xếp cẩn thận thố bánh canh cá lóc nóng hổi lót lá chuối vào thùng giữ nhiệt.' },
      { progress: 25, stage: 'Xe đã lăn bánh ra đại lộ. Gió mát sầm sập, nước dùng củ nén sực nức thơm lừng.' },
      { progress: 45, stage: 'Đang chạy bon bon qua nhịp Cầu Trường Tiền bắc qua dòng sông Hương lững lờ.' },
      { progress: 65, stage: 'Đã bọc rẽ sang đoạn ngã năm tấp nập. Shipper ôm cua điệu nghệ.' },
      { progress: 85, stage: 'Đã đi vào ngõ hẻm tìm số nhà. Đang nhìn bảng chỉ đường chi tiết.' },
      { progress: 100, stage: 'Đang bấm chuông trước hiên nhà khách. Thố bánh khói tỏa nghi ngút đã cập bến.' }
    ];

    const timer = setInterval(() => {
      setOrders(prevOrders => {
        // Check if there are any shipping orders that need advancing
        const needsAdvancing = prevOrders.some(o => o.status === 'shipping' && (o.deliveryProgress === undefined || o.deliveryProgress < 100));
        if (!needsAdvancing) return prevOrders;

        return prevOrders.map(order => {
          if (order.status === 'shipping' && (order.deliveryProgress === undefined || order.deliveryProgress < 100)) {
            const currentProgress = order.deliveryProgress || 0;
            const nextMilestone = routeMilestones.find(m => m.progress > currentProgress);
            if (nextMilestone) {
              const updatedStage = nextMilestone.stage;
              const updatedProgress = nextMilestone.progress;
              const isDone = updatedProgress >= 100;
              
              // Send background chat notification non-blocking
              setTimeout(() => {
                handleSendMessage(
                  order.id, 
                  `🚴‍♂️ [Định vị GPS]: ${updatedStage} (${updatedProgress}%)`, 
                  'Driver'
                );
              }, 10);

              // If completed, free up the driver automatically
              if (isDone && order.driverId) {
                setDrivers(prevDrs => prevDrs.map(d => d.id === order.driverId ? { ...d, status: 'available' as const } : d));
              }

              return {
                ...order,
                deliveryProgress: updatedProgress,
                deliveryStage: updatedStage,
                status: isDone ? 'completed' as const : 'shipping' as const,
                paymentStatus: isDone ? 'paid' as const : order.paymentStatus
              };
            }
          }
          return order;
        });
      });
    }, 12000); // Check and advance every 12 seconds for automatic realistic simulation

    return () => clearInterval(timer);
  }, []);

  const handleAddReview = (reviewData: Omit<ProductReview, 'id' | 'createdAt'>) => {
    const newReview: ProductReview = {
      ...reviewData,
      id: 'rev-' + (reviews.length + 1) + '-' + Math.floor(Math.random() * 10000),
      createdAt: new Date().toISOString()
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem('banhcanh_reviews', JSON.stringify(updated));
  };

  // Sync state modifications helper
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('banhcanh_cart', JSON.stringify(items));
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('banhcanh_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('banhcanh_user');
    setActiveTab('home');
  };

  // Cart actions
  const handleAddToCart = (product: Product, noodleType?: 'Bột gạo' | 'Bột lọc', notes?: string, toppings?: Product[]) => {
    const isMain = product.category === 'main';
    const trimmedNotes = notes?.trim() || undefined;
    const itemToppings = toppings || [];
    
    setCartItems((prevCartItems) => {
      // Check if exact item exists already (including options and toppings)
      const existingIdx = prevCartItems.findIndex(
        (item) => {
          if (item.product.id !== product.id) return false;
          if (isMain && item.noodleType !== noodleType) return false;
          if (item.notes !== trimmedNotes) return false;
          
          const itemToppingsList = item.toppings || [];
          if (itemToppingsList.length !== itemToppings.length) return false;
          
          const currentToppingIds = [...itemToppings].map(t => t.id).sort();
          const existingToppingIds = [...itemToppingsList].map(t => t.id).sort();
          return currentToppingIds.every((id, idx) => id === existingToppingIds[idx]);
        }
      );

      let updated: CartItem[];
      if (existingIdx > -1) {
        updated = [...prevCartItems];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1
        };
      } else {
        const newItem: CartItem = {
          product,
          quantity: 1,
          noodleType: isMain ? noodleType : undefined,
          notes: trimmedNotes,
          toppings: itemToppings.length > 0 ? itemToppings : undefined
        };
        updated = [...prevCartItems, newItem];
      }
      localStorage.setItem('banhcanh_cart', JSON.stringify(updated));
      return updated;
    });

    setCartOpen(true);
    showToast(`Đã thêm ${product.name} vào giỏ hàng thành công!`, 'success', 'Thêm vào giỏ hàng');
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    const updated = [...cartItems];
    updated[index].quantity = quantity;
    saveCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const item = cartItems[index];
    const updated = [...cartItems];
    updated.splice(index, 1);
    saveCart(updated);
    if (item) {
      showToast(`Đã xóa "${item.product.name}" khỏi giỏ hàng.`, 'warning', 'Xóa sản phẩm');
    }
  };

  // Checkout process trigger
  const handleCheckoutInit = (details: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'cod' | 'momo' | 'vnpay' | 'card';
    finalTotalAmount?: number;
  }) => {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.product.price + (item.toppings || []).reduce((s, t) => s + t.price, 0)) * item.quantity,
      0
    );
    const finalAmount = details.finalTotalAmount !== undefined 
      ? details.finalTotalAmount 
      : totalAmount + (totalAmount > 150000 ? 0 : 15000);

    const checkDetails = {
      ...details,
      totalAmount: finalAmount,
      items: [...cartItems]
    };

    setPendingCheckoutDetails(checkDetails);
    setCartOpen(false);

    if (details.paymentMethod === 'cod') {
      // Direct Cash checkout success simulation
      handleCompleteOrderFinalization(checkDetails, 'cod');
    } else {
      // Open online interactive bank gateway
      setPaymentOpen(true);
    }
  };

  const handleCompleteOrderFinalization = async (
    details: typeof pendingCheckoutDetails,
    method: 'cod' | 'momo' | 'vnpay' | 'card'
  ) => {
    if (!details) return;

    const mappedItems = details.items.flatMap(it => {
      const list = [{
        productName: it.product.name,
        quantity: it.quantity,
        price: it.product.price,
        noodleType: it.noodleType,
        notes: it.notes
      }];
      
      if (it.toppings && it.toppings.length > 0) {
        it.toppings.forEach(topping => {
          list.push({
            productName: `${topping.name} (Ăn kèm ${it.product.name})`,
            quantity: it.quantity,
            price: topping.price,
            noodleType: undefined,
            notes: undefined
          });
        });
      }
      return list;
    });

    const orderPayload = {
      customerName: details.customerName,
      phone: details.phone,
      address: details.address,
      items: mappedItems,
      totalAmount: details.totalAmount,
      paymentMethod: method,
      paymentStatus: (method === 'cod' ? 'pending' : 'paid') as 'pending' | 'paid',
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    let savedOrder: Order;

    if (isBackendConnected) {
      try {
        savedOrder = await ApiService.createOrder(orderPayload);
        showToast(`Đặt hàng thành công! Đơn hàng đã được đồng bộ lên MySQL.`, 'success', 'Cổng API Live 🔌');
      } catch (err: any) {
        console.error('Không thể lưu lên Spring Boot Backend, lưu offline thay thế:', err);
        showToast('Kết nối Spring Boot bị gián đoạn. Đang lưu đơn hàng ở chế độ offline tạm thời!', 'warning');
        savedOrder = {
          ...orderPayload,
          id: 'DH-' + (1000 + orders.length + 1)
        };
      }
    } else {
      savedOrder = {
        ...orderPayload,
        id: 'DH-' + (1000 + orders.length + 1)
      };
    }

    // Add to top of orders list
    const updatedOrders = [savedOrder, ...orders];
    setOrders(updatedOrders);

    // Empty cart
    saveCart([]);
    setPendingCheckoutDetails(null);
    setPaymentOpen(false);

    // Switch view to Tracking order screen directly
    setActiveTab('tracking');
    showToast(`Đặt hàng thành công! Mã đơn của bạn là ${savedOrder.id}.`, 'success', 'Đặt hàng thành công 🍲');
  };

  // Admin and driver operations
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    let updatedOrder: Order | null = null;
    if (isBackendConnected) {
      try {
        updatedOrder = await ApiService.updateOrderStatus(orderId, status);
      } catch (err: any) {
        console.error('Lỗi khi cập nhật trạng thái lên Spring Boot:', err);
        showToast('Không thể cập nhật trạng thái lên Spring Boot. Đang xử lý offline!', 'warning');
      }
    }

    const updated = orders.map(o => {
      if (o.id === orderId) {
        if (updatedOrder) return updatedOrder;
        const nextOrderState = { ...o, status };
        if (status === 'completed') {
          nextOrderState.paymentStatus = 'paid' as const;
          nextOrderState.deliveryProgress = 100;
          nextOrderState.deliveryStage = 'Món ăn đã được giao hoàn tất!';
        }
        return nextOrderState;
      }
      return o;
    });

    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && targetOrder.driverId && (status === 'completed' || status === 'cancelled')) {
      // Free the driver
      setDrivers(prev => prev.map(d => d.id === targetOrder.driverId ? { ...d, status: 'available' as const } : d));
    }

    setOrders(updated);

    // Trigger a Toast
    let statusText = '';
    let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
    switch (status) {
      case 'pending': statusText = 'đang chờ xác nhận'; break;
      case 'preparing': statusText = 'đang được chế biến'; break;
      case 'shipping': statusText = 'đang được giao đi'; break;
      case 'completed': 
        statusText = 'đã giao xong xuôi!'; 
        toastType = 'success';
        break;
      case 'cancelled': 
        statusText = 'đã bị hủy'; 
        toastType = 'error';
        break;
    }
    showToast(`Đơn hàng ${orderId} ${statusText}.`, toastType, 'Cập nhật đơn hàng');
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    let updatedOrder: Order | null = null;
    if (isBackendConnected) {
      try {
        updatedOrder = await ApiService.assignDriverToOrder(orderId, driverId);
      } catch (err: any) {
        console.error('Lỗi khi phân công tài xế lên Spring Boot:', err);
        showToast('Không thể phân công tài xế lên Spring Boot. Đang xử lý offline!', 'warning');
      }
    }

    // Change driver status
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'busy' as const } : d));

    // Update order
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (updatedOrder) return updatedOrder;
        return {
          ...o,
          driverId,
          driverName: driver.name,
          status: 'shipping' as const,
          etaMinutes: 15
        };
      }
      return o;
    }));

    showToast(`Shipper ${driver.name} đã nhận đơn hàng ${orderId}!`, 'info', 'Đã phân công Shipper 🛵');
  };

  const handleCreateDriver = (name: string, phone: string, vehicle: string) => {
    const newDriver: Driver = {
      id: 'driver-' + (drivers.length + 1),
      name,
      phone,
      vehicle,
      status: 'available',
      rating: 5.0,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
    };
    setDrivers([...drivers, newDriver]);
  };

  const handleUpdateDriverStatus = (driverId: string, status: Driver['status']) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status } : d));
  };

  // Chat message processor
  const handleSendMessage = (orderId: string, text: string, sender: 'Customer' | 'Driver' | 'Kitchen' = 'Customer') => {
    const existingMessages = chatHistory[orderId] || [];
    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newMsg]
    }));

    // If sender is Customer, simulate the automatic kitchen/driver responses
    if (sender === 'Customer') {
      setTimeout(() => {
        // Skip reply if message corresponds to auto-GPS simulation messages
        if (text.includes('[Hệ Thống Bản Đồ]')) return;

        const activeOrd = orders.find(o => o.id === orderId);
        const isShipping = activeOrd?.status === 'shipping';
        
        const reply = {
          id: 'msg-reply-' + Date.now(),
          sender: isShipping ? 'Driver' as const : 'Kitchen' as const,
          text: isShipping 
            ? 'Em nhận ý kiến rồi nha chị Vy ơi, em đang chạy nhanh nhất có thể đây ạ!'
            : 'Dạ quán Bánh Canh đã ghi nhận yêu cầu thêm nén/rau cho đơn mình rồi ạ! Cảm ơn anh chị.',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatHistory(prev => ({
          ...prev,
          [orderId]: [...(prev[orderId] || []), reply]
        }));
      }, 2000);
    }
  };

  const handleUpdateOrderProgress = (orderId: string, progress: number, stage: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          deliveryProgress: progress,
          deliveryStage: stage,
          status: progress >= 100 ? 'completed' as const : 'shipping' as const
        };
      }
      return o;
    }));
  };

  // Filter products by selected categories
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'bestsellers') return p.isBestSeller;
    return p.category === selectedCategory;
  });

  if (user && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#110D0C] text-[#EAE3D2] transition-colors duration-300 font-sans flex flex-col antialiased">
        
        {/* STANDALONE ADMIN HEADER */}
        <header className="bg-[#1C1311] border-b border-[#2D2321] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg select-none">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍲</span>
            <div className="text-center sm:text-left">
              <h1 className="text-sm font-serif font-black uppercase tracking-wider text-[#D97706]">
                BÁNH CANH CÁ LÓC MIỀN TRUNG
              </h1>
              <p className="text-[10px] text-[#B2A496] font-mono uppercase tracking-widest mt-0.5">
                CỔNG QUẢN TRỊ CHẤT LƯỢNG CAO • DÀNH CHO CHỦ QUÁN
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 text-xs">
            <span className={`bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 font-mono px-3 py-1 rounded-sm text-[9px] font-bold flex items-center gap-1.5 ${isBackendConnected ? '' : 'opacity-50 grayscale'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              {isBackendConnected ? 'CONNECTED TO SPRING BOOT MySQL' : 'OFFLINE SIMULATOR'}
            </span>
            <div className="text-center sm:text-right">
              <p className="font-bold text-[#D97706] text-[11px]">ADMIN • {user.username}</p>
              <p className="max-w-[150px] truncate text-[9px] text-[#8B7E74] font-mono">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-600/90 hover:bg-red-700 text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-md shrink-0 animate-pulse"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* CONTAINER FOR STANDALONE OWNER PORTAL */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Active Business Performance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl p-4.5 shadow-sm">
              <p className="text-[9px] uppercase font-bold text-[#8B7E74] font-mono">Đơn Hàng Gần Đây</p>
              <h4 className="text-2xl font-serif font-bold text-[#D97706] mt-1">{orders.length} Đơn hàng</h4>
              <p className="text-[9px] text-[#8B7E74] mt-1 font-mono">Đồng bộ trực tiếp SQL</p>
            </div>
            <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl p-4.5 shadow-sm">
              <p className="text-[9px] uppercase font-bold text-[#8B7E74] font-mono">Doanh thu tích lũy</p>
              <h4 className="text-2xl font-serif font-bold text-emerald-400 mt-1">
                {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('vi-VN')} đ
              </h4>
              <p className="text-[9px] text-[#8B7E74] mt-1 font-mono">Tổng hóa đơn thành công</p>
            </div>
            <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl p-4.5 shadow-sm">
              <p className="text-[9px] uppercase font-bold text-[#8B7E74] font-mono">Nhân sự giao hàng</p>
              <h4 className="text-2xl font-serif font-bold text-blue-400 mt-1">
                {drivers.length} Tài xế
              </h4>
              <p className="text-[9px] text-[#8B7E74] mt-1 font-mono">{drivers.filter(d => d.status === 'available').length} shipper sẵn sàng</p>
            </div>
            <div className="bg-[#1C1311] border border-[#2D2321] rounded-2xl p-4.5 shadow-sm">
              <p className="text-[9px] uppercase font-bold text-[#8B7E74] font-mono">Khách hàng tương tác</p>
              <h4 className="text-2xl font-serif font-bold text-purple-400 mt-1">
                {new Set(orders.map(o => o.customerName)).size || 1} người dùng
              </h4>
              <p className="text-[9px] text-[#8B7E74] mt-1 font-mono">Tự động cộng dồn</p>
            </div>
          </div>

          <AdminDashboard 
            orders={orders}
            drivers={drivers}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignDriver={handleAssignDriver}
            onCreateDriver={handleCreateDriver}
            onUpdateDriverStatus={handleUpdateDriverStatus}
            onUpdateOrderProgress={handleUpdateOrderProgress}
          />
        </main>

        <footer className="bg-[#1C1311] border-t border-[#2D2321] py-6 text-center text-[10px] text-[#8B7E74] font-mono uppercase tracking-wider select-none">
          Cổng Nghiệp Vụ - Bánh Canh Cá Lóc Miền Trung © 1998 - 2026 • Spring Boot Port: 8080 • MySQL: Localhost
        </footer>

        {/* TOAST SYSTEM NOTIFICATIONS */}
        <Toaster 
          toasts={toasts}
          onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E1513] text-[#3E2F26] dark:text-[#EAE3D2] transition-colors duration-300 font-sans flex flex-col antialiased">
      
      <Navbar 
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* Promotional Hero Banner with natural tone textures */}
            <Hero onOrderNow={() => setActiveTab('menu')} />

            {/* Quick Highlights Info Cards under banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-[#1C1311] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs flex flex-col justify-center">
                <div>
                  <h4 className="font-bold text-[#2D241E] dark:text-[#FAF8F5] text-sm">Hương Vị Sánh Thơm</h4>
                  <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5">Sợi bánh xắt mỏng bùi ngậy quyện tóp mỡ sả ớt sừng.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1C1311] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs flex flex-col justify-center">
                <div>
                  <h4 className="font-bold text-[#2D241E] dark:text-[#FAF8F5] text-sm">Giao Hàng Thời Gian Thực</h4>
                  <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5">Hệ thống phân Shipper siêu tốc, húp nước lèo nóng rẫy.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1C1311] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs flex flex-col justify-center">
                <div>
                  <h4 className="font-bold text-[#2D241E] dark:text-[#FAF8F5] text-sm">Thanh Toán Điện Tử</h4>
                  <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5 font-sans">Quét mã QR Momo, VNPay an toàn, bảo mật tuyệt đối.</p>
                </div>
              </div>

            </div>

            {/* BEST SELLING HIGHLIGHTS */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[#D97706] text-xs font-mono font-black uppercase tracking-widest block">Nổi bật nhất hôm nay</span>
                  <h3 className="text-2xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-0.5">Món Ngon Bán Chạy Nhất Quán</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setActiveTab('menu');
                  }}
                  className="text-xs font-black text-[#D97706] hover:underline"
                >
                  Xem tất cả {products.length} Món →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.isBestSeller).map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    reviews={reviews}
                  />
                ))}
              </div>
            </div>

            {/* About us snippet display */}
            <div className="border-t border-[#E5E1D8] dark:border-[#2D2321] pt-8">
              <AboutUs />
            </div>

          </div>
        )}

        {/* VIEW 2: PRODUCT MENU */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5]">Thực Đơn Đậm Chất Miền Trung</h2>
              <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-1.5 leading-relaxed">
                Tất cả sản phẩm đều được sơ chế tươi mới vệ sinh trong ngày. Cam kết không bột ngọt hóa học, nước dùng ngọt thanh từ 100% xương rơm hầm cá.
              </p>
            </div>

            {/* Categories filter segment */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {[
                { id: 'all', label: 'Tất cả sản phẩm' },
                { id: 'bestsellers', label: 'Bán chạy nhất' },
                { id: 'main', label: 'Bánh canh chính' },
                { id: 'extra', label: 'Toppings thêm' },
                { id: 'drink', label: 'Nước giải nhiệt' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1311] text-[#3E2F26] dark:text-[#EAE3D2] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid display products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  reviews={reviews}
                />
              ))}
            </div>

            {/* Highlighted info */}
            <div className="p-4 bg-[#F1EDE4] dark:bg-[#251A18] text-center rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-xs max-w-md mx-auto text-[#2D241E] dark:text-[#EAE3D2]">
              🥫 <strong>Lưu ý:</strong> Sợi bánh canh nặn tay có độ dai tự nhiên. Nếu quý khách muốn nấu sẵn sợi bánh mềm rục hơn, vui lòng ghi chú lại khi tiến hành thêm món vào giỏ hàng!
            </div>
          </div>
        )}

        {/* VIEW 3: ABOUT US DESCRIPTION SECTION */}
        {activeTab === 'about' && (
          <div className="space-y-12">
            <AboutUs />
            
            {/* Sincere Quality pledge card */}
            <div className="bg-gradient-to-br from-[#F1EDE4] to-white rounded-3xl p-8 border border-[#E5E1D8] shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="text-7xl shrink-0">🤝</div>
              <div>
                <h4 className="font-serif text-xl font-bold text-[#2D241E] mb-2">Lời cam kết về sức khỏe cộng đồng</h4>
                <p className="text-xs text-[#3E2F26] leading-relaxed mb-4">
                  Bánh canh cá lóc là món ăn mang đậm hồn cốt xứ sở gió cát miền Trung. Tại quán, chúng tôi cam đoan không sử dụng cá lóc đông lạnh nhập khẩu thương mại. Toàn bộ là cá lóc bông nguyên con khỏe mạnh, đánh bắt luộc tẩm ướp tiêu đen củ nén mới tinh tươm mỗi bình minh. Sức khỏe và niềm hân hoan khi thưởng thức của quý khách là động lực tự hào nhất của gia đình chúng tôi!
                </p>
                <div className="flex gap-4">
                  <span className="text-[10px] text-[#8B7E74] font-bold">✓ Đảm bảo An Toàn Thực Phẩm của Bộ Y Tế</span>
                  <span className="text-[10px] text-[#8B7E74] font-bold">✓ Độc quyền nén nướng Quảng Trị</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REAL-TIME SECURE SHIPPER TRACKING */}
        {activeTab === 'tracking' && (
          <TrackingSection 
            activeOrders={orders}
            onSendMessage={handleSendMessage}
            chatHistory={chatHistory}
            reviews={reviews}
            onAddReview={handleAddReview}
            currentUser={user}
            onCancelOrder={(orderId) => handleUpdateOrderStatus(orderId, 'cancelled')}
          />
        )}

        {/* VIEW 5: ADMIN / CHỦ QUÁN AND JAVA SOURCE CONSOLE */}
        {activeTab === 'admin' && (
          <AdminDashboard 
            orders={orders}
            drivers={drivers}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignDriver={handleAssignDriver}
            onCreateDriver={handleCreateDriver}
            onUpdateDriverStatus={handleUpdateDriverStatus}
            onUpdateOrderProgress={handleUpdateOrderProgress}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#1C1311] border-t border-[#E5E1D8] dark:border-[#2D2321] mt-12 py-8 text-xs text-[#8B7E74] dark:text-[#B2A496] font-medium font-mono transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 text-center md:text-left">
            <span className="font-serif text-sm font-black text-[#2D241E] dark:text-[#FAF8F5] block font-sans">Bánh Canh Cá Lóc Miền Trung</span>
            <p className="mt-1 text-[11px] leading-relaxed">Đậm đà tình Trung Bộ, nước súp ngạt nào củ nén xoa dịu lòng muôn năm.</p>
            <p className="mt-3 text-[9px] text-[#8B7E74] dark:text-[#B2A496]/70">© 1998 - 2026 • Since 1998. Built with React.js & Java Spring Boot.</p>
          </div>
          
          <div className="md:col-span-7 flex flex-wrap justify-center md:justify-end gap-5 text-[10px] uppercase tracking-wider font-bold">
            <button onClick={() => setActiveTab('home')} className="hover:text-[#D97706]">Trang Chủ</button>
            <button onClick={() => setActiveTab('menu')} className="hover:text-[#D97706]">Thực Đơn</button>
            <button onClick={() => setActiveTab('about')} className="hover:text-[#D97706]">Về Chúng Tôi</button>
            <button onClick={() => setActiveTab('tracking')} className="hover:text-[#D97706]">Theo Dõi Đơn Hàng</button>
            <button onClick={() => {
              // Quick login simulation as admin to show backend instantly
              const u = { id: 'admin-user', username: 'Chủ Quán (admin)', email: 'admin@banhcanhcaloc.com', role: 'admin' as const };
              setUser(u);
              setActiveTab('admin');
            }} className="text-[#D97706] hover:underline">
              Bảng Java & XAMPP DB ☕
            </button>
          </div>
        </div>
      </footer>

      {/* POPUP: SHOPPING CART SLIDE OVERVIEW */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        user={user}
        onCheckout={handleCheckoutInit}
      />

      {/* POPUP: INTERACTIVE BANK PAYMENT SCAN OVERLAY */}
      {paymentOpen && pendingCheckoutDetails && (
        <PaymentModal 
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onPaymentSuccess={() => handleCompleteOrderFinalization(pendingCheckoutDetails, pendingCheckoutDetails.paymentMethod)}
          orderDetails={pendingCheckoutDetails}
        />
      )}

      {/* POPUP: LOGIN/REGISTER MODAL */}
      <AuthModal 
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* TOAST SYSTEM NOTIFICATIONS */}
      <Toaster 
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

    </div>
  );
}
