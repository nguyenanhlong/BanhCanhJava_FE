import React, { useState, useEffect, useRef } from 'react';
import { Order, Driver } from '../types';
import { X, MapPin, Phone, User, ChevronRight, Award, Clock, CheckCircle, AlertTriangle, Navigation, Bike, RefreshCw, DollarSign, Flag, Home } from 'lucide-react';

interface DriverSectionProps {
  orders: Order[];
  drivers: Driver[];
  currentDriver: { id: string; username: string; email: string; role: string; fullName?: string; phone?: string };
  onUpdateOrderStatus: (orderId: string, status: 'picked_up' | 'shipping' | 'completed') => void;
  onUpdateDriverStatus: (driverId: string, status: 'available' | 'busy' | 'offline') => void;
  onLogout: () => void;
}

export function DriverSection({
  orders,
  drivers,
  currentDriver,
  onUpdateOrderStatus,
  onUpdateDriverStatus,
  onLogout
}: DriverSectionProps) {
  const driverProfile = drivers.find(d => d.name.toLowerCase().includes(currentDriver.fullName?.toLowerCase() || currentDriver.username.toLowerCase()) || d.phone === currentDriver.phone);
  const myDeliveries = orders.filter(o => o.driverId && String(o.driverId) === String(driverProfile?.id || '') && o.status !== 'cancelled' && o.status !== 'completed');
  const completedDeliveries = orders.filter(o => o.driverId && String(o.driverId) === String(driverProfile?.id || '') && (o.status === 'completed' || o.status === 'cancelled'));
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [driverStatus, setDriverStatus] = useState<Driver['status']>(driverProfile?.status || 'offline');
  const [showEarnings, setShowEarnings] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderCount = useRef(myDeliveries.length);

  // Journey tracking simulation
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [journeyPhase, setJourneyPhase] = useState<'waiting' | 'to_shop' | 'at_shop' | 'to_customer' | 'delivered'>('waiting');
  const journeyTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (driverProfile && driverProfile.status !== driverStatus) {
      onUpdateDriverStatus(driverProfile.id, driverStatus);
    }
  }, [driverStatus]);

  // Notify when new orders arrive
  useEffect(() => {
    if (myDeliveries.length > prevOrderCount.current) {
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 5000);
    }
    prevOrderCount.current = myDeliveries.length;
  }, [myDeliveries.length]);

  // Journey simulation when shipping
  useEffect(() => {
    if (selectedDelivery?.status === 'shipping') {
      setJourneyPhase('to_shop');
      setJourneyProgress(0);
      journeyTimer.current = setInterval(() => {
        setJourneyProgress(prev => {
          const next = prev + Math.random() * 8 + 2;
          if (next >= 40) {
            setJourneyPhase('at_shop');
          }
          if (next >= 45) {
            setJourneyPhase('to_customer');
          }
          if (next >= 100) {
            setJourneyPhase('delivered');
            if (journeyTimer.current) clearInterval(journeyTimer.current);
            return 100;
          }
          return Math.min(next, 100);
        });
      }, 2000);
    } else {
      if (journeyTimer.current) clearInterval(journeyTimer.current);
      setJourneyProgress(0);
      setJourneyPhase('waiting');
    }
    return () => {
      if (journeyTimer.current) clearInterval(journeyTimer.current);
    };
  }, [selectedDelivery?.id, selectedDelivery?.status]);

  const totalEarnings = completedDeliveries
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.shippingFee, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipping': return 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50';
      case 'picked_up': return 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'preparing': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      default: return 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-900/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'shipping': return 'Đang giao';
      case 'picked_up': return 'Đã lấy hàng';
      case 'preparing': return 'Chờ lấy hàng';
      default: return status;
    }
  };

  if (selectedDelivery) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-[#150F0D] overflow-y-auto font-sans animate-fade-in">
        <div className="sticky top-0 bg-white dark:bg-[#1C1311] border-b border-[#E5E1D8] dark:border-[#2D2321] px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setSelectedDelivery(null)} className="p-2 rounded-xl hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer">
            <X className="w-5 h-5 text-[#3E2F26] dark:text-[#EAE3D2]" />
          </button>
          <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Chi tiết đơn hàng</h3>
          <div className="w-9" />
        </div>

        <div className="p-4 space-y-4">
          {/* JOURNEY TRACKING MAP */}
          {selectedDelivery.status === 'shipping' && (
            <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4 overflow-hidden">
              <h4 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#D97706]" /> Hành trình giao hàng
              </h4>

              {/* Visual route */}
              <div className="relative h-40 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/20 dark:to-sky-950/10 rounded-xl border border-sky-200 dark:border-sky-900/40 mb-3 overflow-hidden">
                {/* Start point (shop) */}
                <div className="absolute" style={{ left: '10%', top: '70%' }}>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center shadow-lg border-2 border-white">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[7px] font-bold text-[#8B7E74] mt-0.5 bg-white/80 dark:bg-black/50 px-1 rounded">Quán</span>
                  </div>
                </div>

                {/* Animated driver marker */}
                <div className="absolute transition-all duration-1000 ease-out z-10"
                  style={{
                    left: `${10 + (journeyProgress / 100) * 65}%`,
                    top: `${70 - (journeyProgress / 100) * 40}%`
                  }}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${journeyPhase === 'delivered' ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                      <Bike className={`w-5 h-5 text-white ${journeyPhase !== 'delivered' ? 'animate-bounce' : ''}`} />
                    </div>
                    <span className="text-[7px] font-bold text-white mt-0.5 bg-sky-600/80 px-1 rounded whitespace-nowrap">
                      {journeyPhase === 'to_shop' ? '🔄 Đang đến quán' :
                       journeyPhase === 'at_shop' ? '📦 Nhận hàng' :
                       journeyPhase === 'to_customer' ? '🚚 Đang giao' :
                       journeyPhase === 'delivered' ? '✅ Đã giao' : ''}
                    </span>
                  </div>
                </div>

                {/* Dotted route line */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d={`M 10 70 Q ${30 + journeyProgress * 0.2} ${60 - journeyProgress * 0.3} ${75 - (100 - journeyProgress) * 0.1} ${30 - journeyProgress * 0.2}`}
                    fill="none" stroke={journeyPhase === 'delivered' ? '#10B981' : '#0EA5E9'}
                    strokeWidth="2" strokeDasharray="4 3" className="opacity-60" />
                </svg>

                {/* End point (customer) */}
                <div className="absolute" style={{ right: '10%', top: '25%' }}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${journeyPhase === 'delivered' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      <Flag className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[7px] font-bold text-[#8B7E74] mt-0.5 bg-white/80 dark:bg-black/50 px-1 rounded text-center max-w-[60px] truncate">Khách</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8B7E74]">Tiến trình</span>
                  <span className="font-bold text-[#D97706]">{Math.round(journeyProgress)}%</span>
                </div>
                <div className="h-2 bg-[#F3F0E9] dark:bg-[#2D2321] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D97706] to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${journeyProgress}%` }} />
                </div>
                <div className="flex justify-between text-[8px] text-[#8B7E74]">
                  <span>🏪 Quán</span>
                  <span>📍 {selectedDelivery.address?.slice(0, 20)}...</span>
                </div>
              </div>

              {/* Journey timeline */}
              <div className="mt-3 space-y-1.5">
                {[
                  { phase: 'to_shop', label: 'Nhận đơn từ quán', done: journeyPhase !== 'waiting' },
                  { phase: 'at_shop', label: 'Đã lấy hàng', done: journeyPhase === 'at_shop' || journeyPhase === 'to_customer' || journeyPhase === 'delivered' },
                  { phase: 'to_customer', label: 'Đang giao đến khách', done: journeyPhase === 'to_customer' || journeyPhase === 'delivered' },
                  { phase: 'delivered', label: 'Giao hàng thành công', done: journeyPhase === 'delivered' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? 'bg-emerald-500' : 'bg-[#E5E1D8] dark:bg-[#2D2321]'
                    }`}>
                      {step.done && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={step.done ? 'font-bold text-[#2D241E] dark:text-[#FAF8F5]' : 'text-[#8B7E74]'}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order info */}
          <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[9px] text-[#8B7E74] font-mono">Đơn hàng</p>
                <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">#{selectedDelivery.id}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedDelivery.status)}`}>
                {getStatusLabel(selectedDelivery.status)}
              </span>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321]">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[#8B7E74] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{selectedDelivery.customerName}</p>
                  <p className="text-[10px] text-[#8B7E74]">{selectedDelivery.phone}</p>
                </div>
              </div>
              {selectedDelivery.orderType === 'delivery' && selectedDelivery.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#8B7E74] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2]">{selectedDelivery.address}</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold text-[#8B7E74] uppercase">Món ăn</p>
              {selectedDelivery.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-[#F3F0E9] dark:bg-[#2D2321] p-2.5 rounded-xl">
                  <div>
                    <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                      {item.quantity}x {item.productName}
                    </p>
                    {item.optionsText && <p className="text-[9px] text-[#8B7E74]">{item.optionsText}</p>}
                  </div>
                  <span className="font-bold text-[#D97706]">{item.price.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>

            {selectedDelivery.notes && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">📝 Ghi chú:</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">{selectedDelivery.notes}</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8B7E74]">Phí ship:</span>
                <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">+{selectedDelivery.shippingFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm font-black">
                <span className="text-[#3E2F26] dark:text-[#EAE3D2]">Tổng:</span>
                <span className="text-[#D97706]">{selectedDelivery.totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          {/* Status update buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#8B7E74] uppercase">Cập nhật trạng thái</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedDelivery.status === 'preparing' && (
                <button onClick={() => { onUpdateOrderStatus(selectedDelivery.id, 'picked_up'); setSelectedDelivery(prev => prev ? { ...prev, status: 'picked_up' as any } : null); }}
                  className="col-span-2 p-4 rounded-2xl bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm hover:bg-amber-200 dark:hover:bg-amber-950/50 cursor-pointer flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Đã lấy hàng
                </button>
              )}
              {selectedDelivery.status === 'picked_up' && (
                <button onClick={() => { onUpdateOrderStatus(selectedDelivery.id, 'shipping'); setSelectedDelivery(prev => prev ? { ...prev, status: 'shipping' as any } : null); }}
                  className="col-span-2 p-4 rounded-2xl bg-sky-100 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 font-bold text-sm hover:bg-sky-200 dark:hover:bg-sky-950/50 cursor-pointer flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5" /> Đang giao hàng
                </button>
              )}
              {selectedDelivery.status === 'shipping' && (
                <button onClick={() => { onUpdateOrderStatus(selectedDelivery.id, 'completed'); setSelectedDelivery(null); }}
                  className="col-span-2 p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-950/50 cursor-pointer flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Đã giao thành công
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#150F0D] font-sans pb-24">
      {/* New order alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl shadow-lg animate-fade-in flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 animate-bounce">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">🛵 Đơn hàng mới!</p>
            <p className="text-xs opacity-80">Bạn có đơn hàng mới được phân công</p>
          </div>
          <button onClick={() => setNewOrderAlert(false)} className="ml-auto p-1 rounded-lg hover:bg-emerald-200/50 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-[#D97706] to-[#B85A00] text-white px-5 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-bold text-lg">Xin chào, {currentDriver.fullName || currentDriver.username}! 👋</h1>
            <p className="text-sm text-white/80 mt-0.5">
              {driverProfile ? `${driverProfile.vehicle} • ${driverProfile.phone}` : 'Tài xế giao hàng'}
            </p>
          </div>
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur cursor-pointer transition-all">
            Đăng xuất
          </button>
        </div>

        {/* Status toggle */}
        <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-3">
          <div className={`w-3 h-3 rounded-full ${driverStatus === 'available' ? 'bg-emerald-400 animate-pulse' : driverStatus === 'busy' ? 'bg-amber-400' : 'bg-gray-400'}`} />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {driverStatus === 'available' ? 'Đang rảnh' : driverStatus === 'busy' ? 'Đang giao hàng' : 'Ngoại tuyến'}
            </p>
            <p className="text-[10px] text-white/70">
              {driverStatus === 'available' ? 'Sẵn sàng nhận đơn hàng mới' : driverStatus === 'busy' ? 'Hoàn thành đơn để nhận đơn mới' : 'Bật trạng thái để bắt đầu nhận đơn'}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setDriverStatus('available')} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${driverStatus === 'available' ? 'bg-emerald-400 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              Rảnh
            </button>
            <button onClick={() => setDriverStatus('offline')} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${driverStatus === 'offline' ? 'bg-gray-400 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              Off
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
            <div className="text-xl mb-1">🛵</div>
            <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{myDeliveries.length}</p>
            <p className="text-[9px] text-[#8B7E74]">Đang giao</p>
          </div>
          <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
            <div className="text-xl mb-1">✅</div>
            <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{completedDeliveries.filter(o => o.status === 'completed').length}</p>
            <p className="text-[9px] text-[#8B7E74]">Hoàn thành</p>
          </div>
          <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            onClick={() => setShowEarnings(!showEarnings)}>
            <div className="text-xl mb-1">💰</div>
            <p className="font-black text-lg text-[#D97706]">{(totalEarnings || 0).toLocaleString('vi-VN')}đ</p>
            <p className="text-[9px] text-[#8B7E74]">Doanh thu</p>
          </div>
        </div>
      </div>

      {/* Active deliveries */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-2">
          <Bike className="w-4 h-4 text-[#D97706]" /> Đơn hàng đang giao
          {myDeliveries.length > 0 && <span className="bg-[#D97706] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{myDeliveries.length}</span>}
        </h2>

        {myDeliveries.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
            <div className="text-4xl mb-3">🛵</div>
            <p className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Chưa có đơn hàng nào</p>
            <p className="text-xs text-[#8B7E74] mt-1">Bật trạng thái "Rảnh" để nhận đơn</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myDeliveries.map(order => {
              const isShipping = order.status === 'shipping';
              return (
                <div key={order.id} onClick={() => setSelectedDelivery(order)}
                  className={`bg-white dark:bg-[#1C1311] p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-[#D97706]/40 transition-all active:scale-[0.98] ${
                    isShipping ? 'border-sky-200 dark:border-sky-900/50 ring-1 ring-sky-500/20' : 'border-[#E5E1D8] dark:border-[#2D2321]'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">#{order.id}</p>
                      <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] mt-1">{order.customerName}</p>
                      <p className="text-[10px] text-[#8B7E74]">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <p className="text-xs font-bold text-[#D97706] mt-1">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  {order.address && (
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] text-[#8B7E74]">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{order.address}</span>
                    </div>
                  )}
                  {isShipping && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-bold animate-pulse">
                      <Navigation className="w-3 h-3" /> Đang giao...
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-[#D97706] text-[10px] font-bold">
                    <ChevronRight className="w-3 h-3" /> Xem chi tiết & hành trình
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent completed deliveries */}
      {completedDeliveries.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B7E74]" /> Đã giao gần đây
          </h2>
          <div className="space-y-2">
            {completedDeliveries.slice(-5).reverse().map(order => (
              <div key={order.id} className="bg-white dark:bg-[#1C1311] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">#{order.id} — {order.customerName}</p>
                  <p className="text-[9px] text-[#8B7E74]">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  +{order.shippingFee.toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings detail modal */}
      {showEarnings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E1311] rounded-2xl max-w-sm w-full p-6 border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">💰 Chi tiết doanh thu</h4>
              <button onClick={() => setShowEarnings(false)} className="p-1 rounded-lg hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer">
                <X className="w-4 h-4 text-[#8B7E74]" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-[#8B7E74]">Tổng đơn hoàn thành</span>
                <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{completedDeliveries.filter(o => o.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-[#8B7E74]">Tổng phí ship nhận được</span>
                <span className="font-bold text-[#D97706] text-sm">{totalEarnings.toLocaleString('vi-VN')}đ</span>
              </div>
              <p className="text-[9px] text-[#8B7E74] italic">* Doanh thu dựa trên phí giao hàng của các đơn hoàn thành</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
