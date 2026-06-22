import React, { useState } from 'react';
import { CartItem, User } from '../types';
import { X, Trash2, ShoppingBag, MapPin, Phone, User as UserIcon, ShieldAlert, Tag, Check, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  user: User | null;
  onCheckout: (orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'cod' | 'momo' | 'vnpay' | 'card';
    finalTotalAmount?: number;
  }) => void;
}

const AVAILABLE_PROMOS = [
  { code: 'HUEMON', type: 'percentage' as const, value: 20, label: 'Giảm 20% Thức Ăn' },
  { code: 'BANHCANH15', type: 'percentage' as const, value: 15, label: 'Giảm 15% Thức Ăn' },
  { code: 'CUNEN10', type: 'percentage' as const, value: 10, label: 'Giảm 10% Thức Ăn' },
  { code: 'FREESHIP', type: 'freeship' as const, value: 15000, label: 'Miễn Phí Vận Chuyển' }
];

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  user,
  onCheckout
}: CartDrawerProps) {
  // Safe form fields inside checkout state
  const [customerName, setCustomerName] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo' | 'vnpay' | 'card'>('cod');
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percentage' | 'freeship'; value: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  
  // Item removal confirmation state
  const [itemIndexToConfirmRemove, setItemIndexToConfirmRemove] = useState<number | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product.price + (item.toppings || []).reduce((s, t) => s + t.price, 0)) * item.quantity,
    0
  );

  let deliveryFee = totalAmount > 150000 ? 0 : 15000;
  let discountAmount = 0;

  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discountAmount = Math.round((totalAmount * appliedPromo.value) / 100);
    } else if (appliedPromo.type === 'freeship') {
      discountAmount = deliveryFee;
      deliveryFee = 0;
    }
  }

  const finalTotal = Math.max(0, totalAmount + deliveryFee - (appliedPromo?.type === 'freeship' ? 0 : discountAmount));

  const handleApplyPromo = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setPromoError('Vui lòng nhập mã giảm giá');
      return;
    }
    const found = AVAILABLE_PROMOS.find(p => p.code === trimmed);
    if (found) {
      setAppliedPromo(found);
      setPromoError('');
      setPromoInput('');
    } else {
      setPromoError('Mã giảm giá không chính xác.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleStartCheckout = () => {
    if (cartItems.length === 0) {
      setErrorMsg('Giỏ hàng trống!');
      return;
    }
    setCheckoutStep(true);
    setErrorMsg('');
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }
    if (phone.length < 9) {
      setErrorMsg('Số điện thoại không hợp lệ!');
      return;
    }
    setErrorMsg('');
    onCheckout({
      customerName,
      phone,
      address,
      paymentMethod,
      finalTotalAmount: finalTotal
    });
    // Reset state values
    setCheckoutStep(false);
    setAppliedPromo(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[#2D241E]/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#FAF8F5] dark:bg-[#150F0D] text-[#3E2F26] dark:text-[#EAE3D2] flex flex-col shadow-2xl border-l border-[#E5E1D8] dark:border-[#2D2321] transition-colors duration-300">
          
          {/* Header */}
          <div className="p-6 bg-white dark:bg-[#1C1311] border-b border-[#E5E1D8] dark:border-[#2D2321] flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#2D241E] dark:text-[#FAF8F5] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D97706]" />
              {checkoutStep ? 'Thông Tin Thanh Toán' : 'Giỏ Hàng Của Bạn'}
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] text-[#8B7E74] dark:text-[#B2A496] hover:text-[#2D241E] dark:hover:text-[#FAF8F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!checkoutStep ? (
              // STEP 1: CART CONTENTS
              cartItems.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                  <span className="text-6xl mb-4">🥣</span>
                  <p className="font-bold text-base text-[#2D241E] dark:text-[#FAF8F5]">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] max-w-xs mt-1">Đừng bỏ lỡ tô bánh canh cá lóc nóng hổi chuẩn vị miền Trung hôm nay nhé!</p>
                  <button 
                    onClick={onClose}
                    className="mt-6 px-5 py-2.5 bg-[#D97706] hover:bg-[#D97706]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    Khám phá thực đơn
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1C1311] p-4 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] flex gap-3.5 relative shadow-xs">
                      <div className="w-12 h-12 rounded-xl bg-[#F3F0E9] dark:bg-[#251A18] flex items-center justify-center text-2xl border border-[#E5E1D8] dark:border-[#2D2321] overflow-hidden shrink-0">
                        {(item.product.image || (item.product as any).imageUrl || '').startsWith('http') ? (
                          <img 
                            src={item.product.image || (item.product as any).imageUrl} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          item.product.image || (item.product as any).imageUrl || '🍲'
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] pr-6">{item.product.name}</h4>
                        {item.noodleType && item.product.category === 'main' && (
                          <span className="inline-block text-[10px] bg-[#FAF8F5] dark:bg-[#231816] text-[#D97706] font-bold px-1.5 py-0.5 rounded border border-[#E5E1D8] dark:border-[#2D2321] mt-1 mr-1">
                            Sợi: {item.noodleType}
                          </span>
                        )}
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.toppings.map((topping, tIdx) => (
                              <span key={tIdx} className="inline-block text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/40">
                                + {topping.name.replace(' thêm', '').replace(' Thêm', '')}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mt-1 bg-[#F3F0E9]/50 dark:bg-[#211715] px-2 py-1 rounded">
                            ✍️ {item.notes}
                          </p>
                        )}

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs font-bold text-[#D97706]">
                            {((item.product.price + (item.toppings || []).reduce((s, t) => s + t.price, 0)) * item.quantity).toLocaleString('vi-VN')} đ
                          </span>

                          <div className="flex items-center border border-[#E5E1D8] dark:border-[#2D2321] rounded-lg overflow-hidden bg-[#FAF8F5] dark:bg-[#211715]">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(idx, item.quantity - 1);
                                } else {
                                  setItemIndexToConfirmRemove(idx);
                                }
                              }}
                              className="px-2 py-1 text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5] bg-white dark:bg-[#1C1311] border-x border-[#E5E1D8] dark:border-[#2D2321]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                              className="px-2 py-1 text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setItemIndexToConfirmRemove(idx)}
                        className="absolute top-4 right-4 text-[#8B7E74] hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Coupon Code Input */}
                  <div className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-4 mt-6 space-y-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                      <Tag className="w-4 h-4 text-[#D97706]" />
                      <span>Nhập mã giảm giá</span>
                    </div>

                    {!appliedPromo ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Mã giảm giá (ví dụ: HUEMON...)"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value);
                              setPromoError('');
                            }}
                            className="flex-1 text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] uppercase placeholder:font-sans focus:outline-[#D97706]"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyPromo(promoInput)}
                            className="bg-[#2D241E] hover:bg-[#D97706] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all"
                          >
                            Áp dụng
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-[11px] text-red-600 font-medium">{promoError}</p>
                        )}
                        
                        {/* Interactive Pill Suggestions */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] self-center mr-1">Gợi ý mã:</span>
                          {AVAILABLE_PROMOS.map((p) => (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => handleApplyPromo(p.code)}
                              className="text-[10px] font-mono font-bold bg-[#F3F0E9] dark:bg-[#2D2321] hover:bg-[#D97706] text-[#2D241E] dark:text-[#EAE3D2] hover:text-white px-2.5 py-1 rounded transition-colors"
                            >
                              {p.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-mono font-black text-[#2D241E] dark:text-[#FAF8F5]">{appliedPromo.code}</span>
                            <span className="text-[#8B7E74] dark:text-[#B2A496] text-[10px] ml-1.5">({appliedPromo.label})</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[#8B7E74] hover:text-red-600 font-bold hover:bg-emerald-100/50 p-1.5 rounded-lg transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary Block */}
                  <div className="bg-[#FAF8F5] dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-4 space-y-2 mt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8B7E74] dark:text-[#B2A496]">Tạm tính:</span>
                      <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>Chết khấu ({appliedPromo.code}):</span>
                        <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs">
                      <span className="text-[#8B7E74] dark:text-[#B2A496]">Phí giao hàng:</span>
                      <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Miễn phí</span>
                        ) : (
                          `${deliveryFee.toLocaleString('vi-VN')} đ`
                        )}
                      </span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] text-right italic font-mono">
                        (Mua thêm {(150000 - totalAmount).toLocaleString('vi-VN')} đ để được Free Shipping)
                      </p>
                    )}
                    <div className="h-[1px] bg-[#E5E1D8] dark:bg-[#2D2321] my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">Tổng thanh toán:</span>
                      <span className="font-black text-lg text-[#D97706]">{finalTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              // STEP 2: CHECKOUT FORM
              <form onSubmit={handleSubmitCheckout} className="space-y-4">
                <div className="bg-white dark:bg-[#1C1311] p-4 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] space-y-3">
                  <h4 className="font-bold text-xs text-[#8B7E74] dark:text-[#B2A496] uppercase tracking-wider">Thông Tin Địa Chỉ</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-[#8B7E74]" /> Tên Khách Hàng:
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên người nhận hàng"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#8B7E74]" /> Số Điện Thoại:
                    </label>
                    <input
                      type="tel"
                      placeholder="Nhập số điện thoại liên hệ"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3E2F26] dark:text-[#EAE3D2] mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8B7E74]" /> Địa Chỉ Giao Hàng:
                    </label>
                    <textarea
                      placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#150F0D] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                      required
                    />
                  </div>
                </div>

                {/* Secure electronic payment integrations */}
                <div className="bg-white dark:bg-[#1C1311] p-4 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] space-y-2.5">
                  <h4 className="font-bold text-xs text-[#8B7E74] dark:text-[#B2A496] uppercase tracking-wider">Phương Thức Thanh Toán</h4>
                  
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-[#D97706] focus:ring-[#D97706]"
                    />
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2D241E] dark:text-[#FAF8F5]">💵 Tiền mặt khi nhận hàng (COD)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'momo'}
                      onChange={() => setPaymentMethod('momo')}
                      className="text-[#D97706] focus:ring-[#D97706]"
                    />
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2D241E] dark:text-[#FAF8F5]">👛 Ví điện tử MoMo (Trực tuyến)</span>
                      <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-bold uppercase">Mã QR</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'vnpay'}
                      onChange={() => setPaymentMethod('vnpay')}
                      className="text-[#D97706] focus:ring-[#D97706]"
                    />
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2D241E] dark:text-[#FAF8F5]">🏛️ Cổng VNPay QR (Nội địa & Visa)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Ưu đãi</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#211715] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="text-[#D97706] focus:ring-[#D97706]"
                    />
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2D241E] dark:text-[#FAF8F5]">💳 Thẻ Quốc Tế (Visa/Mastercard)</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">3D Secure</span>
                    </div>
                  </label>
                </div>

                {/* Order total */}
                <div className="p-3 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl flex flex-col gap-1 shadow-xs">
                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold border-b border-[#F3F0E9] pb-1.5 mb-1">
                      <span>Mã giảm giá đã áp dụng ({appliedPromo.code}):</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Tổng số tiền cuối cùng:</span>
                    <span className="font-black text-base text-[#D97706]">{finalTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer controls */}
          <div className="p-6 bg-white dark:bg-[#1C1311] border-t border-[#E5E1D8] dark:border-[#2D2321]">
            {!checkoutStep ? (
              <button
                onClick={handleStartCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-[#D97706] hover:bg-[#D97706]/90 disabled:bg-[#8B7E74]/30 disabled:cursor-not-allowed text-white text-center py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                Tiến Hành Đặt Hàng • {finalTotal.toLocaleString('vi-VN')} đ
              </button>
            ) : (
              <div className="flex gap-3 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setCheckoutStep(false)}
                  className="w-1/3 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] text-[#3E2F26] dark:text-[#EAE3D2] py-3.5 rounded-xl text-xs font-bold transition-all text-center"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCheckout}
                  className="w-2/3 bg-[#D97706] hover:bg-[#D97706]/90 text-white py-3.5 rounded-xl text-xs font-bold transition-all text-center shadow-md block"
                >
                  Gửi Đơn & Thanh Toán 🚀
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Dialog for Item Removal */}
      {itemIndexToConfirmRemove !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1C1311] rounded-2xl max-w-sm w-full p-6 border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl space-y-4 transform scale-100 transition-all text-[#3E2F26] dark:text-[#EAE3D2]">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Xác nhận xóa món ăn?</h4>
                <p className="text-[11px] text-[#8B7E74] dark:text-[#B2A496]">Hành động này không thể hoàn tác trong giỏ hàng.</p>
              </div>
            </div>

            <p className="text-xs text-[#3E2F26] dark:text-[#EAE3D2] leading-relaxed">
              Bạn có chắc chắn muốn xóa món <strong className="text-[#2D241E] dark:text-[#FAF8F5]">"{cartItems[itemIndexToConfirmRemove]?.product.name}"</strong> khỏi giỏ hàng của mình không?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemIndexToConfirmRemove(null)}
                className="flex-1 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] text-[#3E2F26] dark:text-[#EAE3D2] py-2.5 rounded-xl text-xs font-bold transition-all text-center"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveItem(itemIndexToConfirmRemove);
                  setItemIndexToConfirmRemove(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all text-center shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
