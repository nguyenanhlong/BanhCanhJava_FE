import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Driver, DeliveryTrip, Order } from '../types';
import { ApiService } from '../services/api';
import { X, MapPin, Phone, User, ChevronRight, Award, Clock, CheckCircle, AlertTriangle, Navigation, Bike, RefreshCw, DollarSign, Flag, Home, Star, Car, TrendingUp, Calendar, LogOut, Settings, Wifi, WifiOff, Target, ChevronLeft, ChevronDown, ChevronUp, Package, Search, AlertCircle, Info } from 'lucide-react';

interface DriverDashboardProps {
  orders: Order[];
  drivers: Driver[];
  currentUser: { id: string; username: string; email: string; role: string; fullName?: string; phone?: string };
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onUpdateDriverStatus: (driverId: string, status: Driver['status']) => void;
  onLogout: () => void;
  isBackendConnected?: boolean;
}

type TabType = 'home' | 'orders' | 'history' | 'profile';

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
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [myDriver, setMyDriver] = useState<Driver | null>(null);
  const [myTrips, setMyTrips] = useState<DeliveryTrip[]>([]);
  const [stats, setStats] = useState<{ totalTrips: number; activeTrips: number; completedTrips: number; totalEarnings: number; rating: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState<Driver['status']>('offline');
  const [selectedTrip, setSelectedTrip] = useState<DeliveryTrip | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newOrderAlert, setNewOrderAlert] = useState(false);

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
    } catch (err: any) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [findMyDriver]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // New order alert
  useEffect(() => {
    const currentAssigned = myTrips.filter(t => t.status === 'assigned').length;
    if (currentAssigned > prevTripCount.current) {
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 6000);
    }
    prevTripCount.current = currentAssigned;
  }, [myTrips]);

  // Start/stop geolocation
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

      if (newStatus === 'accepted' || newStatus === 'picked_up') {
        setSelectedTrip(updated);
      }
      if (newStatus === 'delivered') {
        setSelectedTrip(null);
        if (stats) {
          setStats(prev => prev ? { ...prev, completedTrips: prev.completedTrips + 1, activeTrips: Math.max(0, prev.activeTrips - 1), totalEarnings: prev.totalEarnings + 15000 } : prev);
        }
      }

      const trip = myTrips.find(t => t.id === tripId);
      if (trip) {
        const order = orders.find(o => o.id === String(trip.orderId));
        if (order) {
          const statusMap: Record<string, string> = { accepted: 'picked_up', picked_up: 'shipping', delivered: 'completed' };
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

  const activeTrips = myTrips.filter(t => t.status !== 'delivered' && t.status !== 'cancelled');
  const completedTrips = myTrips.filter(t => t.status === 'delivered');
  const filteredTrips = myTrips.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const order = getOrderForTrip(t);
      const search = searchQuery.toLowerCase();
      if (order?.customerName.toLowerCase().includes(search)) return true;
      if (order?.phone?.includes(search)) return true;
      if (String(t.id).includes(search)) return true;
      return false;
    }
    return true;
  });

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

  const driverId = parseInt(myDriver.id);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#150F0D] font-sans pb-20">
      {/* New order alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl shadow-lg animate-fade-in flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 animate-bounce">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">🛵 Đơn hàng mới!</p>
            <p className="text-xs opacity-80">Bạn có đơn hàng mới được phân công</p>
          </div>
          <button onClick={() => setNewOrderAlert(false)} className="p-1 rounded-lg hover:bg-emerald-200/50 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {/* ===== TAB: HOME ===== */}
      {activeTab === 'home' && (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#D97706] to-[#B85A00] text-white px-5 pt-12 pb-8 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-bold text-lg">Xin chào, {currentUser.fullName || currentUser.username}!</h1>
                <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> {myDriver.vehicleType || myDriver.vehicle} {myDriver.vehiclePlate ? `• ${myDriver.vehiclePlate}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRefresh} className={`bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl backdrop-blur cursor-pointer transition-all ${refreshing ? 'animate-spin' : ''}`}>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur cursor-pointer transition-all">
                  Đăng xuất
                </button>
              </div>
            </div>

            {/* Status toggle */}
            <div className="mt-4 bg-white/10 backdrop-blur rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${driverStatus === 'available' ? 'bg-emerald-400 animate-pulse' : driverStatus === 'busy' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {driverStatus === 'available' ? 'Đang rảnh - Sẵn sàng nhận đơn' :
                     driverStatus === 'busy' ? 'Đang giao hàng' : 'Ngoại tuyến'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleStatusToggle('available')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      driverStatus === 'available' ? 'bg-emerald-400 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}>
                    Rảnh
                  </button>
                  <button onClick={() => handleStatusToggle('offline')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      driverStatus === 'offline' ? 'bg-gray-400 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}>
                    Off
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="px-4 -mt-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center mx-auto mb-1.5">
                  <Navigation className="w-4 h-4 text-sky-500" />
                </div>
                <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{activeTrips.length}</p>
                <p className="text-[8px] text-[#8B7E74]">Đang giao</p>
              </div>
              <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{stats?.completedTrips ?? completedTrips.length}</p>
                <p className="text-[8px] text-[#8B7E74]">Hoàn thành</p>
              </div>
              <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-1.5">
                  <DollarSign className="w-4 h-4 text-[#D97706]" />
                </div>
                <p className="font-black text-sm text-[#D97706]">{(stats?.totalEarnings ?? 0).toLocaleString('vi-VN')}đ</p>
                <p className="text-[8px] text-[#8B7E74]">Doanh thu</p>
              </div>
              <div className="bg-white dark:bg-[#1C1311] p-3 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm text-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-1.5">
                  <Star className="w-4 h-4 text-purple-500" />
                </div>
                <p className="font-black text-lg text-[#2D241E] dark:text-[#FAF8F5]">{(stats?.rating ?? myDriver.rating ?? 5).toFixed(1)}</p>
                <p className="text-[8px] text-[#8B7E74]">Đánh giá</p>
              </div>
            </div>
          </div>

          {/* Location toggle */}
          <div className="px-4 mt-4">
            <button onClick={toggleLocation}
              className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                locationEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-white dark:bg-[#1C1311] border-[#E5E1D8] dark:border-[#2D2321] text-[#8B7E74] hover:border-[#D97706]/40'
              }`}>
              {locationEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {locationEnabled ? 'Đang chia sẻ vị trí thời gian thực' : 'Bật chia sẻ vị trí'}
            </button>
          </div>

          {/* Active deliveries */}
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#D97706]" /> Đơn đang giao
                {activeTrips.length > 0 && (
                  <span className="bg-[#D97706] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">{activeTrips.length}</span>
                )}
              </h2>
              <button onClick={() => setActiveTab('orders')} className="text-[10px] text-[#D97706] font-bold cursor-pointer">
                Xem tất cả →
              </button>
            </div>

            {activeTrips.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321]">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-3">
                  <Bike className="w-8 h-8 text-[#D97706]" />
                </div>
                <p className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Chưa có đơn hàng</p>
                <p className="text-xs text-[#8B7E74] mt-1">Bật trạng thái "Rảnh" để nhận đơn mới</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTrips.slice(0, 5).map(trip => {
                  const order = getOrderForTrip(trip);
                  const statusConf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.assigned;
                  const nextAction = getNextAction(trip);
                  return (
                    <div key={trip.id}
                      className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden cursor-pointer hover:border-[#D97706]/40 transition-all"
                      onClick={() => setSelectedTrip(trip)}>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-mono text-[11px] font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                              Đơn #{trip.orderId}
                            </p>
                            {order && (
                              <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] mt-0.5">
                                {order.customerName}
                              </p>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConf.color}`}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                        </div>
                        {order?.address && (
                          <div className="flex items-start gap-1.5 text-[10px] text-[#8B7E74] mt-2">
                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{order.address}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E1D8] dark:border-[#2D2321]">
                          <span className="text-[10px] text-[#8B7E74]">
                            {timeAgo(trip.createdAt)}
                          </span>
                          {nextAction && (
                            <span className="text-[10px] text-[#D97706] font-bold flex items-center gap-1">
                              {nextAction.label} <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                      {nextAction && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTripStatusUpdate(trip.id, nextAction.status); }}
                          className={`w-full py-2.5 text-xs font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-1.5`}>
                          {nextAction.label} → {trip.status === 'assigned' ? 'Nhận chuyến' : trip.status === 'accepted' ? 'Xác nhận lấy hàng' : 'Hoàn thành'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent completed */}
          {completedTrips.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B7E74]" /> Đã giao gần đây
              </h2>
              <div className="space-y-2">
                {completedTrips.slice(-5).reverse().map(trip => {
                  const order = getOrderForTrip(trip);
                  return (
                    <div key={trip.id} className="bg-white dark:bg-[#1C1311] p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] flex justify-between items-center">
                      <div>
                        <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">
                          #{trip.orderId} {order ? `— ${order.customerName}` : ''}
                        </p>
                        <p className="text-[9px] text-[#8B7E74]">{formatDate(trip.deliveredAt || trip.updatedAt)}</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+15,000đ</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: ORDERS ===== */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in">
          <div className="bg-white dark:bg-[#1C1311] px-5 pt-12 pb-4 border-b border-[#E5E1D8] dark:border-[#2D2321]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">📦 Đơn giao hàng</h1>
              <button onClick={handleRefresh} className={`p-2 rounded-xl hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] cursor-pointer ${refreshing ? 'animate-spin' : ''}`}>
                <RefreshCw className="w-4 h-4 text-[#8B7E74]" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7E74]" />
              <input
                type="text"
                placeholder="Tìm theo tên khách, số ĐT, mã đơn..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl text-xs text-[#2D241E] dark:text-[#FAF8F5] placeholder-[#8B7E74] outline-none focus:border-[#D97706] transition-colors"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'assigned', label: 'Mới' },
                { key: 'accepted', label: 'Đã nhận' },
                { key: 'picked_up', label: 'Đã lấy' },
                { key: 'delivered', label: 'Đã giao' },
                { key: 'cancelled', label: 'Đã hủy' },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    statusFilter === f.key
                      ? 'bg-[#D97706] text-white'
                      : 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#8B7E74] hover:bg-[#E5E1D8] dark:hover:bg-[#3D3331]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-4 pb-8 space-y-3">
            {filteredTrips.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-8 h-8 text-[#8B7E74]" />
                </div>
                <p className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Không tìm thấy đơn hàng</p>
                <p className="text-xs text-[#8B7E74] mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
              </div>
            ) : (
              filteredTrips.map(trip => {
                const order = getOrderForTrip(trip);
                const statusConf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.assigned;
                const nextAction = getNextAction(trip);
                const isExpanded = expandedTripId === trip.id;

                return (
                  <div key={trip.id}
                    className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#1A1412] transition-colors"
                      onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-[11px] font-bold text-[#2D241E] dark:text-[#FAF8F5]">Đơn #{trip.orderId}</p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${statusConf.color}`}>
                              {statusConf.label}
                            </span>
                          </div>
                          {order && (
                            <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] mt-1">{order.customerName}</p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8B7E74]" /> : <ChevronDown className="w-4 h-4 text-[#8B7E74]" />}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[9px] text-[#8B7E74]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(trip.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(trip.createdAt)}
                        </span>
                      </div>

                      {order?.address && (
                        <div className="flex items-start gap-1.5 mt-2 text-[10px] text-[#8B7E74]">
                          <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{order.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#E5E1D8] dark:border-[#2D2321] pt-3 space-y-3">
                        {order && (
                          <div className="bg-[#FAF8F5] dark:bg-[#150F0D] rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8B7E74]">Khách hàng</span>
                              <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8B7E74]">Số điện thoại</span>
                              <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{order.phone}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#8B7E74]">Phương thức</span>
                              <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                                {order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'momo' ? 'Momo' : 'Chuyển khoản'}
                              </span>
                            </div>
                            {order.items && (
                              <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#2D2321]">
                                <p className="text-[9px] font-bold text-[#8B7E74] mb-1">Món ăn:</p>
                                {order.items.map((item, i) => (
                                  <p key={i} className="text-[10px] text-[#3E2F26] dark:text-[#EAE3D2]">
                                    {item.quantity}x {item.productName}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trip timeline */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold text-[#8B7E74] uppercase">Dòng thời gian</p>
                          {[
                            { label: 'Đã phân công', time: trip.createdAt, done: true },
                            { label: 'Đã nhận đơn', time: trip.acceptedAt, done: !!trip.acceptedAt },
                            { label: 'Đã lấy hàng', time: trip.pickedUpAt, done: !!trip.pickedUpAt },
                            { label: 'Đã giao hàng', time: trip.deliveredAt, done: !!trip.deliveredAt },
                          ].map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                step.done ? 'bg-emerald-500' : 'bg-[#E5E1D8] dark:bg-[#2D2321]'
                              }`}>
                                {step.done && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={step.done ? 'font-bold text-[#2D241E] dark:text-[#FAF8F5]' : 'text-[#8B7E74]'}>
                                {step.label}
                              </span>
                              {step.time && (
                                <span className="text-[8px] text-[#8B7E74] ml-auto">{formatTime(step.time)}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action button */}
                        {nextAction && (
                          <button
                            onClick={() => handleTripStatusUpdate(trip.id, nextAction.status)}
                            className={`w-full py-3 rounded-xl text-xs font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-2`}>
                            {nextAction.label}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===== TAB: HISTORY ===== */}
      {activeTab === 'history' && (
        <div className="animate-fade-in">
          <div className="bg-white dark:bg-[#1C1311] px-5 pt-12 pb-4 border-b border-[#E5E1D8] dark:border-[#2D2321]">
            <h1 className="font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5]">📋 Lịch sử giao hàng</h1>
          </div>

          <div className="px-4 pt-4 space-y-4">
            {/* Earnings summary */}
            <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-[#1C1311] rounded-2xl border border-amber-200 dark:border-amber-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#D97706]" /> Tổng doanh thu
                </h3>
                <span className="text-lg font-black text-[#D97706]">{(stats?.totalEarnings ?? completedTrips.length * 15000).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white dark:bg-[#150F0D] rounded-xl p-2.5">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.completedTrips ?? completedTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Chuyến thành công</p>
                </div>
                <div className="bg-white dark:bg-[#150F0D] rounded-xl p-2.5">
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.totalTrips ?? myTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Tổng chuyến</p>
                </div>
              </div>
            </div>

            {/* List */}
            {completedTrips.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-[#8B7E74]" />
                </div>
                <p className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Chưa có lịch sử giao hàng</p>
                <p className="text-xs text-[#8B7E74] mt-1">Các đơn đã giao sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTrips.sort((a, b) => new Date(b.deliveredAt || b.updatedAt).getTime() - new Date(a.deliveredAt || a.updatedAt).getTime()).map(trip => {
                  const order = getOrderForTrip(trip);
                  return (
                    <div key={trip.id} className="bg-white dark:bg-[#1C1311] p-3.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">Đơn #{trip.orderId}</p>
                          {order && <p className="text-[10px] text-[#8B7E74] mt-0.5">{order.customerName}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+15,000đ</span>
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
          </div>
        </div>
      )}

      {/* ===== TAB: PROFILE ===== */}
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
            {/* Info card */}
            <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Họ tên</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Số điện thoại</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Email</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Phương tiện</span>
                <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.vehicleType || myDriver.vehicle}</span>
              </div>
              {myDriver.vehiclePlate && (
                <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <span className="text-xs text-[#8B7E74]">Biển số</span>
                  <span className="text-xs font-bold font-mono text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.vehiclePlate}</span>
                </div>
              )}
              {myDriver.vehicleColor && (
                <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                  <span className="text-xs text-[#8B7E74]">Màu xe</span>
                  <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{myDriver.vehicleColor}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-[#E5E1D8] dark:border-[#2D2321]">
                <span className="text-xs text-[#8B7E74]">Đánh giá</span>
                <span className="text-xs font-bold text-[#D97706] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {(stats?.rating ?? myDriver.rating ?? 5).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-[#8B7E74]">Trạng thái</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  driverStatus === 'available' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                  driverStatus === 'busy' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' :
                  'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400'
                }`}>
                  {driverStatus === 'available' ? 'Đang rảnh' : driverStatus === 'busy' ? 'Đang giao' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm p-4">
              <h3 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-[#D97706]" /> Thống kê
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.totalTrips ?? myTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Tổng chuyến</p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{stats?.activeTrips ?? activeTrips.length}</p>
                  <p className="text-[8px] text-[#8B7E74]">Đang giao</p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#D97706]">{((stats?.totalEarnings ?? 0) || completedTrips.length * 15000).toLocaleString('vi-VN')}đ</p>
                  <p className="text-[8px] text-[#8B7E74]">Doanh thu</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              className="w-full p-4 rounded-2xl bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 font-bold text-sm cursor-pointer hover:bg-red-200 dark:hover:bg-red-950/50 transition-all flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* ===== BOTTOM TAB BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1311] border-t border-[#E5E1D8] dark:border-[#2D2321] z-40 px-2 pb-safe">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {[
            { key: 'home' as TabType, icon: <Home className="w-5 h-5" />, label: 'Trang chủ' },
            { key: 'orders' as TabType, icon: <Package className="w-5 h-5" />, label: 'Đơn hàng', badge: activeTrips.length },
            { key: 'history' as TabType, icon: <Clock className="w-5 h-5" />, label: 'Lịch sử' },
            { key: 'profile' as TabType, icon: <User className="w-5 h-5" />, label: 'Cá nhân' },
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
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [journeyPhase, setJourneyPhase] = useState<'waiting' | 'to_shop' | 'at_shop' | 'to_customer' | 'delivered'>('waiting');
  const journeyTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (trip.status === 'picked_up') {
      setJourneyPhase('to_shop');
      setJourneyProgress(0);
      journeyTimer.current = setInterval(() => {
        setJourneyProgress(prev => {
          const next = prev + Math.random() * 6 + 2;
          if (next >= 35) setJourneyPhase('at_shop');
          if (next >= 45) setJourneyPhase('to_customer');
          if (next >= 100) {
            setJourneyPhase('delivered');
            if (journeyTimer.current) clearInterval(journeyTimer.current);
            return 100;
          }
          return Math.min(next, 100);
        });
      }, 2500);
    }
    return () => { if (journeyTimer.current) clearInterval(journeyTimer.current); };
  }, [trip.id, trip.status]);

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
        {/* Journey map */}
        {trip.status === 'picked_up' && (
          <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4 overflow-hidden">
            <h4 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5] mb-3 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-[#D97706]" /> Hành trình giao hàng
            </h4>
            <div className="relative h-36 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/20 dark:to-sky-950/10 rounded-xl border border-sky-200 dark:border-sky-900/40 mb-3 overflow-hidden">
              <div className="absolute" style={{ left: '10%', top: '70%' }}>
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#D97706] flex items-center justify-center shadow-lg border-2 border-white">
                    <Home className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[6px] font-bold text-[#8B7E74] mt-0.5 bg-white/80 dark:bg-black/50 px-1 rounded">Quán</span>
                </div>
              </div>
              <div className="absolute transition-all duration-1000 ease-out z-10"
                style={{ left: `${10 + (journeyProgress / 100) * 65}%`, top: `${70 - (journeyProgress / 100) * 40}%` }}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${journeyPhase === 'delivered' ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                    <Bike className={`w-4.5 h-4.5 text-white ${journeyPhase !== 'delivered' ? 'animate-bounce' : ''}`} />
                  </div>
                  <span className="text-[6px] font-bold text-white mt-0.5 bg-sky-600/80 px-1 rounded whitespace-nowrap">
                    {journeyPhase === 'to_shop' ? 'Đến quán' : journeyPhase === 'at_shop' ? 'Nhận hàng' : journeyPhase === 'to_customer' ? 'Đang giao' : 'Đã giao'}
                  </span>
                </div>
              </div>
              <div className="absolute" style={{ right: '10%', top: '25%' }}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${journeyPhase === 'delivered' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <Flag className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[6px] font-bold text-[#8B7E74] mt-0.5 bg-white/80 dark:bg-black/50 px-1 rounded">Khách</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#8B7E74]">Tiến trình</span>
                <span className="font-bold text-[#D97706]">{Math.round(journeyProgress)}%</span>
              </div>
              <div className="h-1.5 bg-[#F3F0E9] dark:bg-[#2D2321] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D97706] to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${journeyProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Order info */}
        <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] p-4">
          <div className="flex justify-between items-start mb-3">
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
                  <p className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{order.customerName}</p>
                  <p className="text-[10px] text-[#8B7E74]">{order.phone}</p>
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
                <span className="text-[#D97706]">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
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

        {/* Action button */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-[#8B7E74] uppercase">Thao tác</p>
          {nextAction ? (
            <button onClick={() => onUpdateStatus(trip.id, nextAction.status)}
              className={`w-full p-4 rounded-2xl text-sm font-bold text-white ${nextAction.color} cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg`}>
              {nextAction.label} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-center p-4 bg-[#F3F0E9] dark:bg-[#2D2321] rounded-2xl text-xs text-[#8B7E74]">
              {trip.status === 'delivered' ? '✅ Chuyến giao đã hoàn thành' : '🚫 Chuyến giao đã kết thúc'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
