import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, ProductReview, User, Driver } from '../types';
import { Clock, Phone, MapPin, Navigation, MessageCircle, Send, Check, Star } from 'lucide-react';

interface TrackingSectionProps {
  activeOrders: Order[];
  onSendMessage: (orderId: string, text: string) => void;
  chatHistory: Record<string, { sender: string; text: string; timestamp: string }[]>;
  reviews: ProductReview[];
  onAddReview: (review: Omit<ProductReview, 'id' | 'createdAt'>) => void;
  currentUser: User | null;
  onCancelOrder?: (orderId: string) => void;
  drivers?: Driver[];
}

export function TrackingSection({ 
  activeOrders, 
  onSendMessage, 
  chatHistory,
  reviews,
  onAddReview,
  currentUser,
  onCancelOrder,
  drivers = []
}: TrackingSectionProps) {
  const [searchId, setSearchId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  
  // States for reviews submission of each dish
  const [ratingInputs, setRatingInputs] = useState<Record<string, number>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const prevOrderIdsRef = useRef<string[]>([]);

  // Smoothly manage order selection and syncs
  useEffect(() => {
    const currentIds = activeOrders.map(o => o.id);
    const prevIds = prevOrderIdsRef.current;
    
    // Find if there's any brand new order ID that was not in prevIds
    const newOrderId = currentIds.find(id => !prevIds.includes(id));
    
    if (newOrderId) {
      // Auto-focus on the newly created order
      const newOrder = activeOrders.find(o => o.id === newOrderId);
      if (newOrder) {
        setSelectedOrder(newOrder);
      }
    } else if (!selectedOrder) {
      if (activeOrders.length > 0) {
        // Nothing is selected, find the first active order
        const activeOrder = activeOrders.find(o => o.status !== 'completed' && o.status !== 'cancelled');
        setSelectedOrder(activeOrder || activeOrders[0]);
      }
    } else {
      // Sync selected order attributes without stealing/forcing focus
      const synced = activeOrders.find(o => o.id === selectedOrder.id);
      if (synced && (synced.status !== selectedOrder.status || synced.deliveryProgress !== selectedOrder.deliveryProgress || synced.driverId !== selectedOrder.driverId)) {
        setSelectedOrder(synced);
      }
    }
    
    prevOrderIdsRef.current = currentIds;
  }, [activeOrders, selectedOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const found = activeOrders.find(o => o.id.toLowerCase() === searchId.trim().toLowerCase());
    if (found) {
      setSelectedOrder(found);
      setErrorMsg('');
    } else {
      setErrorMsg('Không tìm thấy đơn hàng nào với mã này hoặc đơn hàng đã xong xuôi!');
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const getStepStatus = (current: OrderStatus, step: OrderStatus) => {
    const sequence: OrderStatus[] = ['pending', 'preparing', 'shipping', 'completed'];
    const currentIndex = sequence.indexOf(current);
    const stepIndex = sequence.indexOf(step);

    if (current === 'cancelled') {
      return 'cancelled';
    }

    if (currentIndex >= stepIndex) {
      return 'completed';
    } else if (currentIndex + 1 === stepIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOrder) return;
    onSendMessage(selectedOrder.id, chatInput.trim());
    setChatInput('');
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Chờ Quán Xác Nhận';
      case 'preparing': return 'Đang Chế Biến Sợi Bánh';
      case 'shipping': return 'Đang Giao Hàng';
      case 'completed': return 'Giao Hàng Thành Công ';
      case 'cancelled': return 'Đã Hủy';
    }
  };

  return (
    <div className="text-[#3E2F26] dark:text-[#EAE3D2]">
      {/* Header design pattern */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[#D97706] font-mono text-xs uppercase tracking-widest font-black">Chức năng thời gian thực</span>
        <h2 className="text-2xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-1 mb-2">
          Hệ Thống Theo Dõi Đơn Hàng & Tài Xế Luân Chuyển
        </h2>
        <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Nhập mã đơn để xem tiến độ nấu và vị trí của shipper</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Search & Order selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#150F0D] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
            <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3">Tra Cứu Đơn Hàng Nhanh</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: DH-1002"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              />
              <button
                type="submit"
                className="bg-[#2D241E] dark:bg-[#FAF8F5] hover:bg-[#3E2F26] dark:hover:bg-[#EAE3D2] text-white dark:text-[#2D241E] text-xs px-4 rounded-xl font-bold transition-all"
              >
                Tìm
              </button>
            </form>
            {errorMsg && <p className="text-red-600 text-[10px] mt-2 font-medium">{errorMsg}</p>}
          </div>

          <div className="bg-white dark:bg-[#150F0D] p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs space-y-6">
            {/* Active section */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#D97706] mb-3">Đơn Đang Hoạt Động</h3>
              {activeOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
                <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] italic">Không có đơn hàng nào đang nấu hoặc đang giao.</p>
              ) : (
                <div className="space-y-2">
                  {activeOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex justify-between items-center ${
                        selectedOrder?.id === o.id
                          ? 'bg-[#F3F0E9] dark:bg-[#251A18] border-[#D97706]'
                          : 'bg-white dark:bg-[#1C1311] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#FAF8F5] dark:hover:bg-[#251917]'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-mono font-black text-[#2D241E] dark:text-[#FAF8F5]">{o.id}</span>
                        <p className="text-[9px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                        o.status === 'shipping' ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/30' :
                        o.status === 'preparing' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30' :
                        'bg-[#F3F0E9] dark:bg-[#251A18] text-[#2D241E] dark:text-[#FAF8F5]'
                      }`}>
                        {getStatusText(o.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* History section */}
            <div className="pt-4 border-t border-[#F3F0E9] dark:border-[#2D2321]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2D241E] dark:text-[#FAF8F5] mb-3">Lịch Sử Mua Hàng ({activeOrders.filter(o => o.status === 'completed' || o.status === 'cancelled').length})</h3>
              {activeOrders.filter(o => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
                <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] italic">Chưa có đơn hàng nào hoành thành trước đó.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeOrders.filter(o => o.status === 'completed' || o.status === 'cancelled').map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex justify-between items-center ${
                        selectedOrder?.id === o.id
                          ? 'bg-[#F3F0E9] dark:bg-[#251A18] border-[#D97706]'
                          : 'bg-white dark:bg-[#1C1311] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#FAF8F5] dark:hover:bg-[#251917]'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-mono font-black text-[#2D241E] dark:text-[#FAF8F5]">{o.id}</span>
                        <p className="text-[9px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : ''}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                        o.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      }`}>
                        {o.status === 'completed' ? 'Thành Công' : 'Đã Hủy'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Stepper & Interactive Simulation */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* ORDER DETAILS & STEPPER */}
              <div className="bg-white dark:bg-[#150F0D] p-6 rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
                
                <div className="flex flex-wrap items-center justify-between border-b border-[#F3F0E9] dark:border-[#2D2321] pb-4 mb-6">
                  <div>
                    <span className="text-xs text-[#8B7E74] dark:text-[#B2A496] font-medium">Theo dõi mã đơn:</span>
                    <h3 className="text-lg font-mono font-black text-[#2D241E] dark:text-[#FAF8F5] mt-0.5">{selectedOrder.id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#8B7E74] dark:text-[#B2A496] font-medium">Hình thức thanh toán:</span>
                    <p className="text-xs text-[#D97706] font-bold mt-0.5 capitalize font-sans">
                      {selectedOrder.paymentMethod === 'cash' ? '💵 Tiền mặt khi nhận' : 
                       selectedOrder.paymentMethod === 'momo' ? '🎀 Ví MoMo' : 
                       selectedOrder.paymentMethod === 'transfer' ? '🏛️ Chuyển khoản' : selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* CANCEL ORDER INLINE CONTROL FOR CURRENT CUSTOMER */}
                {selectedOrder.status === 'pending' && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-red-800 dark:text-red-400">Bạn muốn hủy đơn hàng này?</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400/80 leading-normal">
                        Món ăn chưa được cắm bếp làm, bạn có thể bấm nút bên phải để hủy đơn hàng này ngay lập tức.
                      </p>
                    </div>
                    {confirmCancelId === selectedOrder.id ? (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (onCancelOrder) {
                              onCancelOrder(selectedOrder.id);
                            }
                            setConfirmCancelId(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] py-2 px-3 rounded-xl shadow-xs transition-colors"
                        >
                          Xác nhận hủy
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="bg-gray-200 dark:bg-gray-800 text-gray-750 dark:text-gray-300 font-bold text-[11px] py-2 px-3 rounded-xl transition-colors"
                        >
                          Quay lại
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(selectedOrder.id)}
                        className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shrink-0 font-sans border border-red-200 dark:border-red-900/40"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                )}

                {/* GRAPHIC STEPPER */}
                <div className="grid grid-cols-4 gap-2 relative mb-8">
                  
                  {/* Progress Line */}
                  <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-[#E5E1D8] dark:bg-[#2D2321] z-0" />
                  
                  {/* Step 1: Pending */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                      getStepStatus(selectedOrder.status, 'pending') === 'completed'
                        ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                        : 'bg-white dark:bg-[#1C1311] text-[#8B7E74] dark:text-[#B2A496] border-[#E5E1D8] dark:border-[#2D2321] animate-pulse'
                    }`}>
                      1
                    </div>
                    <span className="text-[10px] font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-2 block">Xác nhận</span>
                    <span className="text-[8px] text-[#8B7E74] dark:text-[#B2A496]">Đã nhận đơn</span>
                  </div>

                  {/* Step 2: Preparing */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                      getStepStatus(selectedOrder.status, 'preparing') === 'completed'
                        ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                        : getStepStatus(selectedOrder.status, 'preparing') === 'active'
                        ? 'bg-[#D97706] text-white border-[#D97706] animate-pulse'
                        : 'bg-white dark:bg-[#1C1311] text-[#8B7E74] dark:text-[#B2A496] border-[#E5E1D8] dark:border-[#2D2321]'
                    }`}>
                      2
                    </div>
                    <span className="text-[10px] font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-2 block">Làm Bánh</span>
                    <span className="text-[8px] text-[#8B7E74] dark:text-[#B2A496]">Hầm súp củ nén</span>
                  </div>

                  {/* Step 3: Shipping */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                      getStepStatus(selectedOrder.status, 'shipping') === 'completed'
                        ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                        : getStepStatus(selectedOrder.status, 'shipping') === 'active'
                        ? 'bg-[#D97706] text-white border-[#D97706] animate-pulse'
                        : 'bg-white dark:bg-[#1C1311] text-[#8B7E74] dark:text-[#B2A496] border-[#E5E1D8] dark:border-[#2D2321]'
                    }`}>
                      3
                    </div>
                    <span className="text-[10px] font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-2 block">Đang Giao</span>
                    <span className="text-[8px] text-[#8B7E74] dark:text-[#B2A496]">Tài xế đang phóng</span>
                  </div>

                  {/* Step 4: Completed */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                      getStepStatus(selectedOrder.status, 'completed') === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-[#1C1311] text-[#8B7E74] dark:text-[#B2A496] border-[#E5E1D8] dark:border-[#2D2321]'
                    }`}>
                      4
                    </div>
                    <span className="text-[10px] font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-2 block">Thánh vị</span>
                    <span className="text-[8px] text-[#8B7E74] dark:text-[#B2A496]">Ăn ngon miệng</span>
                  </div>

                </div>

                {/* INVOICE / BILL SECTION */}
                <div className="mt-6 p-5 bg-[#FAF8F5] dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-xs">
                  <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-2">
                    <span className="text-lg">🧾</span> Chi Tiết Hóa Đơn
                  </h4>
                  <div className="divide-y divide-[#E5E1D8] dark:divide-[#2D2321]">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5] truncate block">{it.productName}</span>
                          {it.noodleType && <span className="text-[10px] text-[#8B7E74]">Sợi: {it.noodleType}</span>}
                          {it.notes && <span className="text-[10px] text-[#8B7E74] italic block">✍️ {it.notes}</span>}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">x{it.quantity}</span>
                          <span className="block text-[#D97706] font-extrabold">{(it.price * it.quantity).toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#8B7E74]">Tạm tính:</span>
                      <span className="font-bold">{(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('vi-VN')}₫</span>
                    </div>
                    {selectedOrder.shippingFee ? (
                      <div className="flex justify-between">
                        <span className="text-[#8B7E74]">Phí giao hàng:</span>
                        <span className="font-bold">{selectedOrder.shippingFee.toLocaleString('vi-VN')}₫</span>
                      </div>
                    ) : null}
                    {selectedOrder.discountAmount ? (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Giảm giá:</span>
                        <span className="font-bold">-{selectedOrder.discountAmount.toLocaleString('vi-VN')}₫</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-sm pt-1 border-t border-[#E5E1D8] dark:border-[#2D2321]">
                      <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">Tổng cộng:</span>
                      <span className="font-black text-[#D97706]">{selectedOrder.totalAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[#8B7E74]">Thanh toán:</span>
                      <span className="font-bold capitalize">
                        {selectedOrder.paymentMethod === 'cash' ? '💵 Tiền mặt (COD)' :
                         selectedOrder.paymentMethod === 'momo' ? '🎀 MoMo' :
                         selectedOrder.paymentMethod || 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7E74]">Trạng thái:</span>
                      <span className={`font-bold ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedOrder.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL SIMULATED MAP — hidden after completed */}
                {selectedOrder.status !== 'completed' && (
                <div className="bg-[#F3F0E9] dark:bg-[#1E1311] rounded-2xl h-56 border border-[#E5E1D8] dark:border-[#2D2321] relative overflow-hidden flex items-center justify-center">
                  
                  {/* Grid Lines mockup representing maps */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-30">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-r border-b border-[#3E2F26] dark:border-[#EAE3D2]/10" />
                    ))}
                  </div>

                  {/* River Mockup visually looking like Song Huong/TP Hue */}
                  <div className="absolute inset-x-0 top-1/3 h-10 bg-sky-200/50 dark:bg-sky-950/20 -rotate-6 transform scale-y-125 pointer-events-none" />

                  {/* Roads / Paths */}
                  <div className="absolute left-1/4 top-0 bottom-0 w-4 bg-white/70 dark:bg-[#2A1E1C]/70 shadow-xs rotate-12 transform pointer-events-none" />
                  <div className="absolute left-0 right-0 top-1/2 h-4 bg-white/70 dark:bg-[#2A1E1C]/70 shadow-xs -rotate-12 transform pointer-events-none" />

                  {/* Shop Pin Point */}
                  <div className="absolute left-1/3 top-1/2 hover:scale-105 transition-transform flex flex-col items-center">
                    <span className="bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-xs mb-1">Quán Bánh Canh Miền Trung</span>
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center border-2 border-white dark:border-[#1E1513] shadow-md animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Customer Pin Point */}
                  <div className="absolute right-1/4 top-1/4 hover:scale-105 transition-transform flex flex-col items-center">
                    <span className="bg-white dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-xs mb-1 border border-[#E5E1D8] dark:border-[#332522] flex items-center gap-0.5">
                      🏠 Tôi ở đây
                    </span>
                    <div className="w-4 h-4 rounded-full bg-[#D97706] flex items-center justify-center border-2 border-white dark:border-[#1E1513] shadow-md">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Shipper live tracking icon container */}
                  {selectedOrder.status === 'shipping' && (() => {
                    const progress = selectedOrder.deliveryProgress || 0;
                    const bikeLeft = 33.33 + (progress / 100) * (75 - 33.33);
                    const bikeTop = 50 - (progress / 100) * (50 - 25);
                    return (
                      <div 
                        className="absolute flex flex-col items-center animate-bounce transition-all duration-500 ease-out z-20"
                        style={{ left: `${bikeLeft}%`, top: `${bikeTop}%` }}
                      >
                        <span className="bg-sky-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black shadow-lg">Shipper 🏍️ ({progress}%)</span>
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#251A18] flex items-center justify-center shadow-lg border border-[#E5E1D8] dark:border-[#2D2321] text-sm transform -scale-x-100 font-sans">
                          🛵
                        </div>
                      </div>
                    );
                  })()}

                  {/* MAP OVERLAY STATS */}
                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#150F0D]/90 backdrop-blur px-3 py-2 rounded-xl text-[10px] font-mono border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[#2D241E] dark:text-[#FAF8F5]">
                      <Clock className="w-3 h-3 text-[#D97706]" /> Thời gian nhận dự kiến
                    </p>
                    <p className="mt-0.5 font-bold text-[#D97706] font-sans">
                      {(selectedOrder.status as string) === 'completed' ? 'Đã giao' : 
                       selectedOrder.status === 'shipping' ? `Còn khoảng ${Math.max(2, Math.round(15 - (selectedOrder.deliveryProgress || 0) * 0.13))} phút` : 
                       selectedOrder.status === 'preparing' ? 'Chuẩn bị thêm 5 phút' : 
                       selectedOrder.status === 'cancelled' ? 'Đơn hàng đã hủy' : 'Chờ xác nhận'}
                    </p>
                  </div>
                </div>
                )}

                {/* Driver information */}
                {selectedOrder.driverId && selectedOrder.status !== 'cancelled' ? (
                  <div className="mt-4 p-4 bg-[#FAF8F5] dark:bg-[#1C1311] rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3 font-sans">
                      <div className="text-2xl">🛵</div>
                      <div>
                        {(() => {
                          const driver = drivers.find(d => String(d.id) === String(selectedOrder.driverId));
                          return driver ? (
                            <>
                              <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{driver.name}</p>
                              <p className="text-[10px] text-[#8B7E74]">📞 {driver.phone} &nbsp;|&nbsp; 🚛 {driver.vehicle}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">Tài xế (ID: {selectedOrder.driverId})</p>
                              <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496]">⏳ Đang tải thông tin tài xế...</p>
                            </>
                          );
                        })()}
                        <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mt-1">
                          {selectedOrder.deliveryStage || 'Tài xế đang nhận thố dọn bánh canh chuẩn bị xuất phát.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const driver = drivers.find(d => String(d.id) === String(selectedOrder.driverId));
                        return driver ? (
                          <a href={`tel:${driver.phone}`} className="p-2 bg-white dark:bg-[#251A18] border border-[#E5E1D8] dark:border-[#2D2321] text-[#8B7E74] dark:text-[#B2A496] hover:text-[#2D241E] dark:hover:text-[#FAF8F5] rounded-full">
                            <Phone className="w-4 h-4" />
                          </a>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-[#FAF8F5] dark:bg-[#1C1311] rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] text-center text-xs text-[#8B7E74] dark:text-[#B2A496] font-sans">
                    {selectedOrder.status === 'cancelled' 
                      ? '❌ Đơn hàng này đã bị hủy bỏ.' 
                      : 'Chưa phân tài xế. Chủ quán đang chuẩn bị nguyên liệu lóc xương cá.'}
                  </div>
                )}

              </div>

              {/* INTERACTIVE RATING & REVIEW CARD (AFTER COMPLETED DELIVERY) */}
              {selectedOrder.status === 'completed' && (
                <div className="bg-white dark:bg-[#150F0D] p-6 rounded-3xl border-2 border-[#D97706]/20 dark:border-[#D97706]/30 shadow-xs space-y-4">
                  <div className="border-b border-[#F3F0E9] dark:border-[#2D2321] pb-3">
                    <span className="text-xs font-mono font-black text-[#D97706] uppercase tracking-wider block">Ý kiến khách hàng</span>
                    <h4 className="font-serif text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                      Đánh Giá & Nhận Xét Món Ăn Đã Thưởng Thức
                    </h4>
                    <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496]">
                      Sự góp ý quý giá của bạn giúp tiệm Bánh canh cá lóc miền Trung cải thiện tay nghề nêm nếm ngày càng tuyệt hảo!
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => {
                      const isReviewed = reviews.some(
                        r => r.orderId === selectedOrder.id && r.productName === item.productName
                      );
                      const itemReview = reviews.find(
                        r => r.orderId === selectedOrder.id && r.productName === item.productName
                      );
                      const currentRating = ratingInputs[item.productName] || 5;
                      const currentComment = commentInputs[item.productName] || '';

                      return (
                        <div key={idx} className="p-4 bg-[#FAF8F5] dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] transition-all">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5] truncate max-w-xs block">
                                🍲 {item.productName}
                              </span>
                              {item.noodleType && (
                                <span className="text-[10px] bg-[#E1DBD1] dark:bg-[#2D2321] text-[#2D241E] dark:text-[#EAE3D2] px-2 py-0.5 rounded font-black mr-2 mt-1 inline-block">
                                  {item.noodleType}
                                </span>
                              )}
                              {item.notes && (
                                <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] italic">
                                  Yêu cầu của bạn: "{item.notes}"
                                </span>
                              )}
                            </div>
                            
                            {isReviewed && itemReview && (
                              <div className="flex items-center text-amber-500 gap-1 text-xs font-bold bg-white dark:bg-[#1C1311] px-2.5 py-1 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xs">
                                <span>Đã gửi: {itemReview.rating}</span>
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </div>
                            )}
                          </div>

                          {isReviewed && itemReview ? (
                            <div className="mt-2.5 pt-2 border-t border-[#F3F0E9]/65 dark:border-[#2D2321]/60 text-[11px]">
                              <p className="text-[#3E2F26] dark:text-[#EAE3D2] italic">
                                "{itemReview.comment || 'Không có nhận xét văn bản.'}"
                              </p>
                              <span className="text-[8px] text-[#8B7E74] dark:text-[#B2A496] block mt-1">✓ Đã ghi nhận hệ thống</span>
                            </div>
                          ) : (
                            <div className="mt-3.5 pt-3.5 border-t border-[#E1DBD1]/60 dark:border-[#2D2321]/60">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Đánh giá sao:</span>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRatingInputs(prev => ({ ...prev, [item.productName]: star }))}
                                      className="transition-transform duration-100 active:scale-95 text-amber-500 hover:scale-110"
                                      title={`${star} sao`}
                                    >
                                      <Star 
                                        className={`w-5.5 h-5.5 ${star <= currentRating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} 
                                      />
                                    </button>
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-[#D97706]">{currentRating} / 5 Điểm</span>
                              </div>

                              <div className="space-y-2">
                                <textarea
                                  placeholder="Nhập lời nhận xét chân thực (Ví dụ: Bột lọc dẻo sần sật, cá béo ngọt thanh, không tanh...)"
                                  value={currentComment}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.productName]: e.target.value }))}
                                  className="w-full text-xs p-3 rounded-xl border border-[#E1DBD1] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                                  rows={2}
                                />
                                <div className="text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAddReview({
                                        orderId: selectedOrder.id,
                                        productName: item.productName,
                                        customerName: currentUser?.username || selectedOrder.customerName || 'Khách Hàng Thân Thiết',
                                        rating: currentRating,
                                        comment: currentComment
                                      });
                                    }}
                                    className="bg-[#2D241E] dark:bg-[#FAF8F5] hover:bg-[#3E2F26] dark:hover:bg-[#EAE3D2] text-white dark:text-[#2D241E] text-[10px] uppercase font-black px-4 py-2 rounded-xl transition-colors shadow-xs"
                                  >
                                    Lưu Nhận Xét Món Này ✓
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LIVE CHAT WITH THE KITCHEN / DRIVER */}
              <div className="bg-white dark:bg-[#150F0D] p-5 rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#D97706]" />
                  Chat trực tuyến với Shop & Shipper
                </h4>

                {/* Chat window panel */}
                <div className="h-40 overflow-y-auto border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#1C1311] rounded-xl p-3 space-y-2 mb-3">
                  <div className="bg-amber-100/50 dark:bg-amber-950/20 p-2.5 rounded-lg text-[10px] text-[#3E2F26] dark:text-[#EAE3D2]">
                    🤖 <strong>Trợ lý Bánh Canh:</strong> Xin chào mừng! Quý khách có thể yêu cầu đặt thêm các loại rau đắng, củ nén, nước luộc cá ngọt thơm bằng cách chat ở đây. Chúng tôi sẽ báo làm ngay!
                  </div>

                  {(chatHistory[selectedOrder.id] || []).map((msg, i) => (
                    <div key={i} className={`flex flex-col text-[10px] max-w-[80%] rounded-lg p-2.5 ${
                      msg.sender === 'Customer'
                        ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] self-end ml-auto'
                        : 'bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] text-[#2D241E] dark:text-[#EAE3D2]'
                    }`}>
                      <span className="font-bold mb-0.5 text-[9px] opacity-75">{msg.sender === 'Customer' ? 'Bạn' : 'Nhà bếp / Shipper'}</span>
                      <p>{msg.text}</p>
                      <span className="text-[8px] opacity-65 text-right mt-1">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập nội dung tin nhắn gửi tiệm bánh canh..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  />
                  <button
                    type="submit"
                    className="bg-[#D97706] hover:bg-[#D97706]/90 text-white p-2.5 rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#150F0D] p-12 text-center rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
              <h3 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">Vui lòng chọn hoặc đặt một đơn</h3>
              <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] max-w-sm mx-auto mt-1">Đơn bánh canh cá lóc nóng nổi và hành nén rang giòn sau khi đặt sẽ tự xuất hiện ngay phía cột bên trái!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
