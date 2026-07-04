import React, { useState } from 'react';
import { CartItem, User } from '../types';
import { getUserTier, calculateAutoDiscount } from '../services/membership';
import { X, Trash2, ShoppingBag, Award, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  user: User | null;
  onOpenConfirmation: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  user,
  onOpenConfirmation
}: CartDrawerProps) {
  const [itemIndexToConfirmRemove, setItemIndexToConfirmRemove] = useState<number | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product.price + (item.selectedOptions || []).reduce((s, o) => s + o.price, 0)) * item.quantity,
    0
  );

  const membershipDiscount = user ? calculateAutoDiscount(getUserTier((user as any).total_spent || 0, (user as any).total_orders || 0), totalAmount) : 0;

  const finalTotal = Math.max(0, totalAmount - membershipDiscount);

  const handleStartCheckout = () => {
    if (cartItems.length === 0) return;
    onOpenConfirmation();
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
              Giỏ Hàng Của Bạn
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
            {cartItems.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 animate-pulse">🥣</span>
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
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerText = '🍲'; }} />
                      ) : '🍲'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5] pr-6">{item.product.name}</h4>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedOptions.map((opt, oIdx) => (
                            <span key={oIdx} className="inline-block text-[9px] bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/40">
                              {opt.name}{opt.price > 0 ? ` (+${opt.price.toLocaleString('vi-VN')}đ)` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mt-1 bg-[#F3F0E9]/50 dark:bg-[#211715] px-2 py-1 rounded">✍️ {item.notes}</p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-bold text-[#D97706]">
                          {((item.product.price + (item.selectedOptions || []).reduce((s, o) => s + o.price, 0)) * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                        <div className="flex items-center border border-[#E5E1D8] dark:border-[#2D2321] rounded-lg overflow-hidden bg-[#FAF8F5] dark:bg-[#211715]">
                          <button onClick={() => { if (item.quantity > 1) onUpdateQuantity(idx, item.quantity - 1); else setItemIndexToConfirmRemove(idx); }} className="px-2 py-1 text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]">-</button>
                          <span className="px-3 py-1 text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5] bg-white dark:bg-[#1C1311] border-x border-[#E5E1D8] dark:border-[#2D2321]">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(idx, item.quantity + 1)} className="px-2 py-1 text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]">+</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setItemIndexToConfirmRemove(idx)} className="absolute top-4 right-4 text-[#8B7E74] hover:text-red-600 transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Summary Block */}
                <div className="bg-[#FAF8F5] dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-xl p-4 space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8B7E74] dark:text-[#B2A496]">Tạm tính:</span>
                    <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">{totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {membershipDiscount > 0 && (
                    <div className="flex justify-between text-xs text-[#D97706] font-bold">
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Giảm hạng thành viên:</span>
                      <span>-{membershipDiscount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] italic">🚚 Phí ship & khuyến mãi sẽ được tính tại trang xác nhận</p>
                  <div className="h-[1px] bg-[#E5E1D8] dark:border-[#2D2321] my-1" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#2D241E] dark:text-[#FAF8F5]">Tổng thanh toán:</span>
                    <span className="font-black text-lg text-[#D97706]">{finalTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="p-6 bg-white dark:bg-[#1C1311] border-t border-[#E5E1D8] dark:border-[#2D2321]">
            <button
              onClick={handleStartCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-[#D97706] hover:bg-[#D97706]/90 disabled:bg-[#8B7E74]/30 disabled:cursor-not-allowed text-white text-center py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              Tiến Hành Đặt Hàng • {finalTotal.toLocaleString('vi-VN')} đ
            </button>
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
              <button type="button" onClick={() => setItemIndexToConfirmRemove(null)} className="flex-1 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] text-[#3E2F26] dark:text-[#EAE3D2] py-2.5 rounded-xl text-xs font-bold transition-all text-center">Hủy bỏ</button>
              <button type="button" onClick={() => { onRemoveItem(itemIndexToConfirmRemove); setItemIndexToConfirmRemove(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all text-center shadow-md">Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
