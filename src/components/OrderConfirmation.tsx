import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, User, DeliveryArea, Promotion } from '../types';
import { getUserTier, calculateAutoDiscount } from '../services/membership';
import { ApiService } from '../services/api';
import { X, MapPin, Phone, User as UserIcon, Tag, Ticket, Award, ShieldAlert, Check, AlertTriangle, Search } from 'lucide-react';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'cod' | 'momo';
    finalTotalAmount: number;
    shippingFee: number;
    deliveryAreaId?: number;
    appliedPromo?: Promotion;
    appliedVoucherId?: string;
    membershipDiscount: number;
    voucherDiscount: number;
    discountAmount: number;
  }) => void;
  cartItems: CartItem[];
  user: User | null;
  totalAmount: number;
}

const FREE_SHIP_THRESHOLD = 150000;

export function OrderConfirmation({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  user,
  totalAmount
}: OrderConfirmationProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo'>('cod');
  const [errorMsg, setErrorMsg] = useState('');

  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);

  const [loadingAreas, setLoadingAreas] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setCustomerName(user?.fullName || user?.username || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setPaymentMethod('cod');
    setErrorMsg('');
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');

    setLoadingAreas(true);
    ApiService.getDeliveryAreas()
      .then(setDeliveryAreas)
      .catch(() => setDeliveryAreas([]))
      .finally(() => setLoadingAreas(false));
  }, [isOpen, user]);

  const matchedArea = useMemo(() => {
    if (!address.trim()) return null;
    const a = address.toLowerCase();
    for (const area of deliveryAreas) {
      if (area.isActive === false) continue;
      const kw = area.name.toLowerCase();
      if (a.includes(kw)) return area;
    }
    return null;
  }, [address, deliveryAreas]);

  let shippingFee = 0;
  if (address.trim()) {
    if (matchedArea) {
      shippingFee = totalAmount > FREE_SHIP_THRESHOLD ? 0 : matchedArea.baseFee;
    } else {
      shippingFee = totalAmount > FREE_SHIP_THRESHOLD ? 0 : 15000;
    }
  }

  const membershipDiscount = user ? calculateAutoDiscount(getUserTier((user as any).total_spent || 0, (user as any).total_orders || 0), totalAmount) : 0;

  let promoDiscount = 0;
  let voucherDiscount = 0;

  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      promoDiscount = Math.round(totalAmount * appliedPromo.discountValue / 100);
      if (appliedPromo.maxDiscount && promoDiscount > appliedPromo.maxDiscount) {
        promoDiscount = appliedPromo.maxDiscount;
      }
    } else if (appliedPromo.discountType === 'fixed_amount') {
      promoDiscount = appliedPromo.discountValue;
    }
    if (appliedPromo.code === 'FREESHIP') {
      promoDiscount = shippingFee;
      shippingFee = 0;
    }
  }

  const finalTotal = Math.max(0, totalAmount + shippingFee - membershipDiscount - voucherDiscount - promoDiscount);

  const totalItemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleValidatePromo = async () => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      setPromoError('Vui lòng nhập mã giảm giá');
      return;
    }
    setPromoValidating(true);
    setPromoError('');
    try {
      const result = await ApiService.validatePromotion(trimmed, totalAmount);
      if (result.valid && result.promo) {
        setAppliedPromo(result.promo);
        setPromoInput('');
      } else {
        setPromoError(result.error || 'Mã không hợp lệ');
      }
    } catch {
      setPromoError('Không thể kiểm tra mã, vui lòng thử lại');
    }
    setPromoValidating(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleConfirm = () => {
    if (!customerName.trim() || !phone.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }
    if (phone.length < 9) {
      setErrorMsg('Số điện thoại không hợp lệ!');
      return;
    }
    setErrorMsg('');

    onConfirm({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod,
      finalTotalAmount: finalTotal,
      shippingFee,
      deliveryAreaId: matchedArea?.id,
      appliedPromo: appliedPromo || undefined,
      membershipDiscount,
      voucherDiscount,
      discountAmount: promoDiscount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="max-w-lg mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2D241E] dark:text-[#FAF8F5]">Xác Nhận Đơn Hàng</h2>
          <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-0.5">Vui lòng kiểm tra thông tin trước khi đặt</p>
        </div>
        <button onClick={onClose} className="text-xs font-bold text-[#D97706] hover:underline">
          ← Quay lại
        </button>
      </div>

      <div className="space-y-4">

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Order Items Summary */}
            <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-3">
              <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-2">
                Đơn hàng ({totalItemCount} món)
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs border-b border-[#F3F0E9] dark:border-[#2D2321] pb-2 last:border-0">
                    <span className="font-mono font-bold text-[#D97706] shrink-0 w-5">{item.quantity}x</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2D241E] dark:text-[#FAF8F5] truncate">{item.product.name}</p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-[9px] text-[#8B7E74] truncate">
                          {item.selectedOptions.map(o => o.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5] shrink-0">
                      {((item.product.price + (item.selectedOptions || []).reduce((s, o) => s + o.price, 0)) * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-3 space-y-3">
              <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Thông Tin Giao Hàng
              </h4>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName(user.fullName || user.username);
                    setPhone(user.phone || '');
                    setAddress(user.address || '');
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-[#D97706] font-bold hover:underline"
                >
                  <UserIcon className="w-3 h-3" /> Sử dụng thông tin từ tài khoản
                </button>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-0.5">Tên người nhận</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  placeholder="Nhập tên người nhận"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-0.5">
                  <Phone className="w-3 h-3 inline mr-0.5" /> Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-0.5">
                  <MapPin className="w-3 h-3 inline mr-0.5" /> Địa chỉ giao hàng
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                />
                {matchedArea && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Khu vực: {matchedArea.name}
                  </p>
                )}
                {address.trim() && !matchedArea && deliveryAreas.length > 0 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Địa chỉ ngoài khu vực giao hàng hỗ trợ
                  </p>
                )}
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-3 space-y-2">
              <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Mã Giảm Giá
              </h4>
              {!appliedPromo ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                    placeholder="Nhập mã (VD: HUEMON)"
                    className="flex-1 text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] uppercase focus:outline-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={handleValidatePromo}
                    disabled={promoValidating}
                    className="bg-[#2D241E] hover:bg-[#D97706] disabled:bg-[#8B7E74]/50 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                  >
                    {promoValidating ? (
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    ) : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="font-bold">{appliedPromo.code}</span>
                    <span className="text-[#8B7E74] text-[10px]">({appliedPromo.name})</span>
                  </div>
                  <button type="button" onClick={handleRemovePromo} className="text-[#8B7E74] hover:text-red-600 font-bold text-[10px]">Xóa</button>
                </div>
              )}
              {promoError && <p className="text-[10px] text-red-600 font-medium">{promoError}</p>}
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-3 space-y-2">
              <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">Phương Thức Thanh Toán</h4>
              <label className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] text-xs">
                <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-[#D97706]" />
                <span className="font-semibold">💵 Tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] text-xs">
                <input type="radio" name="pay" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="text-[#D97706]" />
                <span className="font-semibold">💳 Ví MoMo (Quét QR)</span>
              </label>
            </div>

            {/* Invoice Breakdown */}
            <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-3 space-y-1.5">
              <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-2">Chi Tiết Hóa Đơn</h4>
              <div className="flex justify-between text-xs">
                <span className="text-[#8B7E74]">Tạm tính ({totalItemCount} món):</span>
                <span className="font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8B7E74]">Phí giao hàng:</span>
                <span className="font-bold">{shippingFee > 0 ? `${shippingFee.toLocaleString('vi-VN')}đ` : <span className="text-emerald-600 text-[10px]">Miễn phí</span>}</span>
              </div>
              {membershipDiscount > 0 && (
                <div className="flex justify-between text-xs text-[#D97706] font-bold">
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Giảm hạng thành viên:</span>
                  <span>-{membershipDiscount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Giảm giá ({appliedPromo.code}):</span>
                  <span>-{promoDiscount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="h-px bg-[#E5E1D8] dark:bg-[#2D2321] my-1" />
              <div className="flex justify-between text-sm">
                <span className="font-bold">Tổng thanh toán:</span>
                <span className="font-black text-lg text-[#D97706]">{finalTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] text-[#3E2F26] dark:text-[#EAE3D2] py-3 rounded-xl text-xs font-bold transition-all"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-2/3 bg-[#D97706] hover:bg-[#D97706]/90 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Xác Nhận & Đặt Hàng • {finalTotal.toLocaleString('vi-VN')}đ
            </button>
          </div>

    </div>
  );
}
