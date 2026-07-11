import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Driver, DeliveryTrip, Order } from '../types';
import { ApiService } from '../services/api';
import { X, MapPin, Phone, User, Award, Clock, CheckCircle, AlertTriangle, Navigation, Bike, RefreshCw, DollarSign, Flag, Home, Star, Car, TrendingUp, Calendar, LogOut, Settings, Wifi, WifiOff, Target, ChevronLeft, ChevronDown, ChevronUp, Package, Search, AlertCircle, Info } from 'lucide-react';

interface DriverDashboardProps {
  orders: Order[];
  drivers: Driver[];
  currentUser: { id: string; username: string; email: string; role: string; fullName?: string; phone?: string };
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onUpdateDriverStatus: (driverId: string, status: Driver['status']) => void;
  onLogout: () => void;
  isBackendConnected?: boolean;
}

type TabType = 'new' | 'delivering' | 'history' | 'profile';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  assigned: { label: 'Đã phân công', color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50', icon: <Clock className="w-3 h-3" /> },
  accepted: { label: 'Đã nhận', color: 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50', icon: <CheckCircle className="w-3 h-3" /> },
  picked_up: { label: 'Đã lấy hàng', color: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50', icon: <Package className="w-3 h-3" /> },
  delivered: { label: 'Đã giao', color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50', icon: <Flag className="w-3 h-3" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50', icon: <AlertCircle className="w-3 h-3" /> },
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return formatDate(dateStr);
}

export function DriverDashboard({
  orders,
  drivers,
  currentUser,
  onUpdateOrderStatus,
  onUpdateDriverStatus,
  onLogout,
  isBackendConnected: _isBackendConnected
}: DriverDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [myDriver, setMyDriver] = useState<Driver | null>(null);
  const [myTrips, setMyTrips] = useState<DeliveryTrip[]>([]);
  const [stats, setStats] = useState<{ totalTrips: number; activeTrips: number; completedTrips: number; totalEarnings: number; rating: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState<Driver['status']>('offline');
  const [selectedTrip, setSelectedTrip] = useState<DeliveryTrip | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevTripCount = useRef(myTrips.filter(t => t.status === 'assigned').length);

  const findMyDriver = useCallback(() => {
    const userId = parseInt(currentUser.id);
    let found = drivers.find(d => d.userId === userId);
    if (!found) {
      found = drivers.find(d =>
        d.name.toLowerCase().includes(currentUser.fullName?.toLowerCase() || currentUser.username.toLowerCase()) ||
        d.phone === currentUser.phone
      );
    }
    return found || null;
  }, [drivers, currentUser]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const driver = findMyDriver();
      if (!driver) {
        setLoading(false);
        return;
      }
      setMyDriver(driver);
      setDriverStatus(driver.status);

      const driverId = parseInt(driver.id);
      const [trips, statsData] = await Promise.all([
        ApiService.getDriverTrips(driverId).catch(() => [] as DeliveryTrip[]),
        ApiService.getDriverStats(driverId).catch(() => null)
      ]);
      setMyTrips(trips);
      setStats(statsData);
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [findMyDriver]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const currentAssigned = myTrips.filter(t => t.status === 'assigned').length;
    if (currentAssigned > prevTripCount.current) {
      setTimeout(() => {}, 0);
    }
    prevTripCount.current = currentAssigned;
  }, [myTrips]);

  const toggleLocation = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
      setLocationEnabled(false);
      return;
    }
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (myDriver) {
          await ApiService.updateDriverLocation(parseInt(myDriver.id), pos.coords.latitude, pos.coords.longitude).catch(() => {});
        }
      },
      () => setError('Không thể lấy vị trí'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    setLocationWatchId(watchId);
    setLocationEnabled(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStatusToggle = async (status: Driver['status']) => {
    if (!myDriver) return;
    setDriverStatus(status);
    onUpdateDriverStatus(myDriver.id, status);
    await ApiService.updateDriverStatus(parseInt(myDriver.id), status).catch(() => {});
  };

  const handleTripStatusUpdate = async (tripId: number, newStatus: string) => {
    try {
      const updated = await ApiService.updateDeliveryTripStatus(tripId, newStatus);
      setMyTrips(prev => prev.map(t => t.id === tripId ? updated : t));

      if (newStatus === 'delivered') {
        setSelectedTrip(null);
        if (stats) {
          setStats(prev => prev ? { ...prev, completedTrips: prev.completedTrips + 1, activeTrips: Math.max(0, prev.activeTrips - 1), totalEarnings: prev.totalEarnings + 15000 } : prev);
        }
        // Giao xong → hệ thống giải phóng tài xế về trạng thái sẵn sàng.
        setDriverStatus('available');
        if (myDriver) onUpdateDriverStatus(myDriver.id, 'available');
      }

      const trip = myTrips.find(t => t.id === tripId);
      if (trip) {
        const order = orders.find(o => o.id === String(trip.orderId));
        if (order) {
          // Shipper xác nhận giao xong → đơn sang 'delivered' (chờ KHÁCH xác nhận đã nhận
          // hàng thì mới 'completed' — bước 5 của quy trình).
          const statusMap: Record<string, string> = { accepted: 'picked_up', picked_up: 'shipping', delivered: 'delivered' };
          const mapped = statusMap[newStatus];
          if (mapped) onUpdateOrderStatus(order.id, mapped);
        }
      }
    } catch {
      setError('Không thể cập nhật trạng thái chuyến giao');
    }
  };

  const getOrderForTrip = (trip: DeliveryTrip): Order | undefined => {
    return orders.find(o => o.id === String(trip.orderId));
  };

  const getNextAction = (trip: DeliveryTrip): { label: string; status: string; color: string } | null => {
    switch (trip.status) {
      case 'assigned': return { label: 'Nhận đơn', status: 'accepted', color: 'bg-sky-500 hover:bg-sky-600' };
      case 'accepted': return { label: 'Đã lấy hàng', status: 'picked_up', color: 'bg-purple-500 hover:bg-purple-600' };
      case 'picked_up': return { label: 'Đã giao thành công', status: 'delivered', color: 'bg-emerald-500 hover:bg-emerald-600' };
      default: return null;
    }
  };

  const newTrips = myTrips.filter(t => t.status === 'assigned');
  const deliveringTrips = myTrips.filter(t => t.status === 'accepted' || t.status === 'picked_up');
  const completedTrips = myTrips.filter(t => t.status === 'delivered');
  const cancelledTrips = myTrips.filter(t => t.status === 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#150F0D] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#D97706]/20 flex items-center justify-center mx-auto">
            <Bike className="w-8 h-8 text-[#D97706] animate-bounce" />
          </div>
          <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5]">Đang tải dữ liệu...</p>
          <div className="h-1.5 w-48 bg-[#E5E1D8] dark:bg-[#2D2321] rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/3 bg-[#D97706] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!myDriver) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#150F0D] flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">Không tìm thấy tài xế</h3>
          <p className="text-xs text-[#8B7E74]">Tài khoản của bạn chưa được liên kết với hồ sơ tài xế. Vui lòng liên hệ admin.</p>
          <button onClick={onLogout} className="bg-[#D97706] text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-[#B85A00]">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#150F0D] font-sans pb-20">
      {/* Error banner */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 rounded-lg hover:bg-red-200/50 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected trip detail modal */}
      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          order={getOrderForTrip(selectedTrip)}
          myDriver={myDriver}
          onClose={() => setSelectedTrip(null)}
          onUpdateStatus={handleTripStatusUpdate}
        />
      )}

      {/* ===== TAB: ĐƠN MỚI ===== */}
      {activeTab === 'new' && (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-[#D97706] to-[#B85A00] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bold text-lg">Xin chào, {currentUser.fullName || currentUser.username}!</h1>
                <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> {myDriver.vehicleType || myDriver.vehicle} {myDriver.vehiclePlate ? `• ${myDriver.vehiclePlate}` : ''}
                </p>
              </div>
              <button onClick={handleRefresh} className={`bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-xl backdrop-blur cursor-pointer transition-all ${refreshing ? 'animate-spin' : ''}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${driverStatus === 'available' ? 'bg-emerald-400 animate-pulse' : driverStatus === 'busy' ? 'bg-amber-400' : 'bg-gray-400'}`} />
              <span className="flex-1 font-bold text-sm">
                {driverStatus === 'available' ? 'Đang rảnh - Sẵn sàng nhận đơn' :
                 driverStatus === 'busy' ? 'Đang giao hàng' : 'Ngoại tuyến'}
              </span>
              <div className="flex gap-1">
                {/* Đang giao hàng thì không được tự đổi trạng thái — hệ thống sẽ mở lại khi giao xong. */}
                <button onClick={() => handleStatusToggle('available')} disabled={driverStatus === 'busy'}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    driverStatus === 'available' ? 'bg-emerald-400 text-white shadow-lg' : driverStatus === 'busy' ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer'
                  }`}>
                  Rảnh
                </button>
                <button onClick={() => handleStatusToggle('offline')} disabled={driverStatus === 'busy'}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    driverStatus === 'offline' ? 'bg-gray-400 text-white shadow-lg' : driverStatus === 'busy' ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer'
                  }`}>
                  Off
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 -mt-3">
            <div className="flex gap-2">
              {[
                { label: 'Đơn mới', count: newTrips.length, icon: <Package className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-950/30' },
                { label: 'Đang giao', count: deliveringTrips.length, icon: <Bike className="w-5 h-5" />, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-950/30' },
                { label: 'Đã giao', count: completedTrips.length, icon: <Flag className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-950/30' },
              ].map((stat, i) => (
                <div key={i} className="flex-1 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-3 text-center shadow-sm">
                  <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{stat.count}</p>
                  <p className="text-[9px] text-[#8B7E74] font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 mt-5">
            <h2 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#D97706]" /> Đơn hàng mới
              {newTrips.length > 0 && (
                <span className="bg-[#D97706] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{newTrips.length}</span>
              )}
            </h2>

            {newTrips.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-[#D97706]" />
                </div>
                <p className="font-bold text-base text-[#2D241E] dark:text-[#FAF8F5]">Không có đơn hàng mới</p>
                <p className="text-xs text-[#8B7E74] mt-1">Bật trạng thái "Rảnh" để nhận đơn mới</p>
              </div>
            ) : (
              <div className="space-y-3">
                {newTrips.map(trip => {
                  const order = getOrderForTrip(trip);
                  const statusConf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.assigned;
                  const nextAction = getNextAction(trip);
                  return (
                    <div key={trip.id} className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[11px] font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                              Đơn #{trip.orderId}
                            </p>
                            {order && (
                              <p className="text-sm font-bold text-[#3E2F26] dark:text-[#EAE3D2] mt-0.5">{order.customerName}</p>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${statusConf.color}`}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                        </div>
                        {order && (
                          <>
                            {order.address && (
                              <div className="flex items-start gap-1.5 text-[11px] text-[#8B7E74] mb-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{order.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-[#8B7E74]">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{formatCurrency(order.totalAmount)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(trip.createdAt)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {nextAction && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTripStatusUpdate(trip.id, nextAction.status); }}
                          className={`w-full py-3 text-sm font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-2`}>
                          {nextAction.label} →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: ĐANG GIAO ===== */}
      {activeTab === 'delivering' && (
        <div className="animate-fade-in">
          <div className="bg-white dark:bg-[#1C1311] px-5 pt-12 pb-4 border-b border-[#E5E1D8] dark:border-[#2D2321]">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#D97706]" /> Đang giao
              </h1>
              <button onClick={handleRefresh} className={`p-2 rounded-xl hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer ${refreshing ? 'animate-spin' : ''}`}>
                <RefreshCw className="w-4 h-4 text-[#8B7E74]" />
              </button>
            </div>
            <p className="text-xs text-[#8B7E74]">{deliveringTrips.length} chuyến đang thực hiện</p>
          </div>

          <div className="px-4 pt-4 pb-8 space-y-3">
            {deliveringTrips.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-10 h-10 text-sky-500" />
                </div>
                <p className="font-bold text-base text-[#2D241E] dark:text-[#FAF8F5]">Không có đơn đang giao</p>
                <p className="text-xs text-[#8B7E74] mt-1">Các đơn đã nhận sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              deliveringTrips.map(trip => {
                const order = getOrderForTrip(trip);
                const statusConf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.assigned;
                const nextAction = getNextAction(trip);
                return (
                  <div key={trip.id} className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[11px] font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                            Đơn #{trip.orderId}
                          </p>
                          {order && (
                            <p className="text-sm font-bold text-[#3E2F26] dark:text-[#EAE3D2] mt-0.5">{order.customerName}</p>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${statusConf.color}`}>
                          {statusConf.icon} {statusConf.label}
                        </span>
                      </div>
                      {order && (
                        <>
                          {order.address && (
                            <div className="flex items-start gap-1.5 text-[11px] text-[#8B7E74] mb-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{order.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-[#8B7E74]">
                            {order.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{formatCurrency(order.totalAmount)}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {nextAction && (
                      <button
                        onClick={() => handleTripStatusUpdate(trip.id, nextAction.status)}
                        className={`w-full py-3 text-sm font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-2`}>
                        {nextAction.label} →
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: LỊCH SỬ ===== */}
      {activeTab === 'history' && (
        <div className="animate-fade-in">
          <div className="bg-white dark:bg-[#1C1311] px-5 pt-12 pb-4 border-b border-[#E5E1D8] dark:border-[#2D2321]">
            <h1 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D97706]" /> Lịch sử giao hàng
            </h1>
          </div>

          <div className="px-4 pt-4 pb-8 space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-[#1C1311] rounded-2xl border border-amber-200 dark:border-amber-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#D97706]" /> Tổng doanh thu
                </h3>
                <span className="text-lg font-black text-[#D97706]">{formatCurrency(stats?.totalEarnings ?? completedTrips.length * 15000)}</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-white dark:bg-[#150F0D] rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.completedTrips ?? completedTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Chuyến thành công</p>
                </div>
                <div className="flex-1 bg-white dark:bg-[#150F0D] rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.totalTrips ?? myTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Tổng chuyến</p>
                </div>
              </div>
            </div>

            {completedTrips.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-[#8B7E74]" />
                </div>
                <p className="font-bold text-base text-[#2D241E] dark:text-[#FAF8F5]">Chưa có lịch sử giao hàng</p>
                <p className="text-xs text-[#8B7E74] mt-1">Các đơn đã giao sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTrips.sort((a, b) => new Date(b.deliveredAt || b.updatedAt).getTime() - new Date(a.deliveredAt || a.updatedAt).getTime()).map(trip => {
                  const order = getOrderForTrip(trip);
                  return (
                    <div key={trip.id} className="bg-white dark:bg-[#1C1311] p-3.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">Đơn #{trip.orderId}</p>
                          {order && <p className="text-[10px] text-[#8B7E74] mt-0.5">{order.customerName}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">+15,000đ</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#8B7E74]">
                        <Calendar className="w-3 h-3" />
                        {formatDate(trip.deliveredAt || trip.updatedAt)}
                        <span className="ml-auto">{timeAgo(trip.deliveredAt || trip.updatedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cancelledTrips.length > 0 && (
              <>
                <h3 className="font-bold text-xs text-[#8B7E74] flex items-center gap-1.5 pt-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Đã hủy ({cancelledTrips.length})
                </h3>
                {cancelledTrips.map(trip => {
                  const order = getOrderForTrip(trip);
                  return (
                    <div key={trip.id} className="bg-white dark:bg-[#1C1311] p-3.5 rounded-xl border border-red-200 dark:border-red-900/40">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">Đơn #{trip.orderId}</p>
                          {order && <p className="text-[10px] text-[#8B7E74] mt-0.5">{order.customerName}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-red-500 shrink-0">Đã hủy</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#8B7E74]">
                        <Calendar className="w-3 h-3" />
                        {formatDate(trip.updatedAt)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: CÁ NHÂN ===== */}
      {activeTab === 'profile' && (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-[#D97706] to-[#B85A00] text-white px-5 pt-12 pb-16 rounded-b-3xl shadow-lg text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-4 border-white/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-bold text-lg">{myDriver.name || currentUser.fullName || currentUser.username}</h1>
            <p className="text-sm text-white/80">{myDriver.vehicleType || myDriver.vehicle}</p>
          </div>

          <div className="px-4 -mt-10 space-y-3">
            <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Trạng thái</span>
                <div className="flex gap-1">
                  {/* Tài xế chỉ được tự chọn Rảnh/Nghỉ — "Đang giao" do hệ thống tự đặt khi được phân đơn. */}
                  <button onClick={() => handleStatusToggle('available')}
                    disabled={driverStatus === 'busy'}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                      driverStatus === 'available' ? 'bg-emerald-500 text-white shadow-lg' : driverStatus === 'busy' ? 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#C5BBB2] cursor-not-allowed' : 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#8B7E74] cursor-pointer'
                    }`}>
                    Đang rảnh
                  </button>
                  {driverStatus === 'busy' && (
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500 text-white shadow-lg">
                      Đang giao (tự động)
                    </span>
                  )}
                  <button onClick={() => handleStatusToggle('offline')}
                    disabled={driverStatus === 'busy'}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                      driverStatus === 'offline' ? 'bg-gray-500 text-white shadow-lg' : driverStatus === 'busy' ? 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#C5BBB2] cursor-not-allowed' : 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#8B7E74] cursor-pointer'
                    }`}>
                    Ngoại tuyến
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Họ tên</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Số điện thoại</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.phone}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Email</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Phương tiện</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.vehicleType || myDriver.vehicle}</span>
              </div>
              {myDriver.vehiclePlate && (
                <div className="flex items-center justify-between py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <span className="text-xs text-[#8B7E74]">Biển số</span>
                  <span className="text-xs font-bold font-mono text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.vehiclePlate}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-[#8B7E74]">Đánh giá</span>
                <span className="text-xs font-bold text-[#D97706] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {(stats?.rating ?? myDriver.rating ?? 5).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm p-4">
              <h3 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-[#D97706]" /> Thống kê
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.totalTrips ?? myTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Tổng chuyến</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.activeTrips ?? deliveringTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Đang giao</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-[#D97706]">{formatCurrency((stats?.totalEarnings ?? 0) || completedTrips.length * 15000)}</p>
                  <p className="text-[8px] text-[#8B7E74]">Doanh thu</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={toggleLocation}
                className={`flex-1 p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  locationEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-[#1C1311] border-[#E5E1D8] dark:border-[#2D2321] text-[#8B7E74] hover:border-[#D97706]/40'
                }`}>
                {locationEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {locationEnabled ? 'Vị trí: Bật' : 'Bật định vị'}
              </button>
              <button onClick={onLogout}
                className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 font-bold text-xs cursor-pointer hover:bg-red-200 dark:hover:bg-red-950/50 transition-all flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM TAB BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1311] border-t border-[#E5E1D8] dark:border-[#2D2321] z-40 px-2 pb-safe">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {[
            { key: 'new' as TabType, icon: <Package className="w-5 h-5" />, label: 'Đơn Mới', badge: newTrips.length },
            { key: 'delivering' as TabType, icon: <Bike className="w-5 h-5" />, label: 'Đang Giao', badge: deliveringTrips.length },
            { key: 'history' as TabType, icon: <Clock className="w-5 h-5" />, label: 'Lịch Sử' },
            { key: 'profile' as TabType, icon: <User className="w-5 h-5" />, label: 'Cá Nhân' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`relative py-2 px-4 flex flex-col items-center min-w-0 transition-all cursor-pointer ${
                activeTab === tab.key ? 'text-[#D97706]' : 'text-[#8B7E74] hover:text-[#3E2F26] dark:hover:text-[#EAE3D2]'
              }`}>
              {tab.icon}
              <span className="text-[9px] font-bold mt-0.5">{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TRIP DETAIL MODAL ===== */
function TripDetailModal({
  trip, order, myDriver, onClose, onUpdateStatus
}: {
  trip: DeliveryTrip;
  order?: Order;
  myDriver: Driver;
  onClose: () => void;
  onUpdateStatus: (tripId: number, status: string) => void;
}) {
  const statusConf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.assigned;
  const nextAction = (() => {
    switch (trip.status) {
      case 'assigned': return { label: 'Nhận đơn giao', status: 'accepted', color: 'bg-sky-500 hover:bg-sky-600' };
      case 'accepted': return { label: 'Xác nhận đã lấy hàng', status: 'picked_up', color: 'bg-purple-500 hover:bg-purple-600' };
      case 'picked_up': return { label: 'Xác nhận đã giao thành công', status: 'delivered', color: 'bg-emerald-500 hover:bg-emerald-600' };
      default: return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-[#150F0D] overflow-y-auto font-sans animate-fade-in">
      <div className="sticky top-0 bg-white dark:bg-[#1C1311] border-b border-[#E5E1D8] dark:border-[#2D2321] px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-[#3E2F26] dark:text-[#EAE3D2]" />
        </button>
        <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Chi tiết giao hàng</h3>
        <div className="w-9" />
      </div>

      <div className="p-4 space-y-4 pb-24">
        <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[9px] text-[#8B7E74] font-mono">Đơn hàng</p>
              <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">#{trip.orderId}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConf.color}`}>
              {statusConf.icon} {statusConf.label}
            </span>
          </div>

          {order && (
            <div className="space-y-3 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321]">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[#8B7E74] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5]">{order.customerName}</p>
                  <p className="text-[11px] text-[#8B7E74]">{order.phone}</p>
                </div>
              </div>
              {order.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#8B7E74] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2]">{order.address}</p>
                </div>
              )}
            </div>
          )}

          {order?.items && (
            <div className="mt-4 space-y-2">
              <p className="text-[9px] font-bold text-[#8B7E74] uppercase">Món ăn</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] bg-[#F3F0E9] dark:bg-[#2D2321] p-2.5 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{item.quantity}x {item.productName}</p>
                    {item.optionsText && <p className="text-[8px] text-[#8B7E74]">{item.optionsText}</p>}
                  </div>
                  <span className="font-bold text-[#D97706] ml-2">{item.price.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          )}

          {order?.notes && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                <Info className="w-3 h-3" /> Ghi chú:
              </p>
              <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-1">{order.notes}</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321] space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#8B7E74]">Phí ship nhận được:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+15,000đ</span>
            </div>
            {order && (
              <div className="flex justify-between text-sm font-black pt-1">
                <span className="text-[#3E2F26] dark:text-[#EAE3D2]">Tổng đơn:</span>
                <span className="text-[#D97706]">{formatCurrency(order.totalAmount)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4">
          <p className="text-[9px] font-bold text-[#8B7E74] uppercase mb-3">Dòng thời gian</p>
          <div className="space-y-2">
            {[
              { label: 'Đơn được tạo', time: trip.createdAt, done: true },
              { label: 'Bạn đã nhận đơn', time: trip.acceptedAt, done: !!trip.acceptedAt },
              { label: 'Đã lấy hàng từ quán', time: trip.pickedUpAt, done: !!trip.pickedUpAt },
              { label: 'Đã giao đến khách', time: trip.deliveredAt, done: !!trip.deliveredAt },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-emerald-500' : 'bg-[#E5E1D8] dark:bg-[#2D2321]'
                }`}>
                  {step.done && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={step.done ? 'font-bold text-[#2D241E] dark:text-[#FAF8F5]' : 'text-[#8B7E74]'}>
                  {step.label}
                </span>
                {step.time && <span className="text-[8px] text-[#8B7E74] ml-auto">{formatTime(step.time)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-bold text-[#8B7E74] uppercase">Thao tác</p>
          {nextAction ? (
            <button onClick={() => onUpdateStatus(trip.id, nextAction.status)}
              className={`w-full p-4 rounded-2xl text-sm font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg`}>
              {nextAction.label} <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-center p-4 bg-[#F3F0E9] dark:bg-[#2D2321] rounded-2xl text-xs text-[#8B7E74]">
              {trip.status === 'delivered' ? 'Chuyến giao đã hoàn thành' : 'Chuyến giao đã kết thúc'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
