import React, { useState } from 'react';
import { Product, ProductReview } from '../types';
import { Plus, ShoppingCart, Star, MessageSquare, Check } from 'lucide-react';

const TOPPING_OPTIONS: Product[] = [];

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, noodleType?: 'Bột gạo' | 'Bột lọc', notes?: string, toppings?: Product[]) => void;
  reviews?: ProductReview[];
}

export function ProductCard({ product, onAddToCart, reviews = [] }: ProductCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showReviewsPanel, setShowReviewsPanel] = useState(false);
  const [selectedNoodle, setSelectedNoodle] = useState<'Bột gạo' | 'Bột lọc'>('Bột gạo');
  const [notes, setNotes] = useState('');
  const [selectedToppings, setSelectedToppings] = useState<Product[]>([]);

  const productReviews = reviews.filter(r => r.productName === product.name);
  const avgRating = productReviews.length > 0 
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : null;

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const isMain = product.categoryName === 'Bánh Canh Cá Lóc' || product.categoryId === 1;
  const isOutOfStock = !product.isAvailable;

  const handleQuickAdd = () => {
    if (!product.isAvailable) return;
    if (isMain) {
      setShowOptions(true);
    } else {
      onAddToCart(product, 'Bột gạo', '');
    }
  };

  const handleConfirmAdd = () => {
    if (!product.isAvailable) return;
    onAddToCart(product, selectedNoodle, notes, selectedToppings);
    setShowOptions(false);
    setSelectedToppings([]);
    setNotes('');
  };

  const getCategoryLabel = (p: Product): string => {
    if (p.categoryName === 'Bánh Canh Cá Lóc') return 'Món Chính';
    if (p.categoryName === 'Đồ Ăn Kèm') return 'Topping Thêm';
    if (p.categoryName === 'Đồ Uống') return 'Giải Nhiệt';
    if (p.categoryName === 'Tráng Miệng') return 'Tráng Miệng';
    if (p.categoryName === 'Combo') return 'Combo';
    return p.categoryName || 'Khác';
  };

  const hasImage = !!product.imageUrl;

  return (
    <div className={`bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-colors duration-300 ease-out flex flex-col overflow-hidden relative group ${isOutOfStock ? 'opacity-60' : ''}`}>
      
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {product.isBestSeller && (
          <span className="bg-[#D97706] text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider shadow-sm animate-pulse">
            Bán Chạy
          </span>
        )}
        <span className="bg-[#FAF8F5]/90 dark:bg-[#1C1311]/90 backdrop-blur text-[#2D241E] dark:text-[#EAE3D2] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321]">
          {getCategoryLabel(product)}
        </span>
      </div>

      <div className="aspect-video bg-[#FAF8F5] dark:bg-[#1E1715] flex items-center justify-center relative select-none border-b border-[#E5E1D8] dark:border-[#2D2321] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        {hasImage ? (
          <img 
            src={product.imageUrl}
            alt={product.name} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerText = '🍲'; }}
          />
        ) : (
          <span className="text-6xl drop-shadow-sm">🍲</span>
        )}
        
        {isMain && (
          <span className="absolute bottom-2 right-2 text-xs font-mono bg-white/70 dark:bg-[#1C1311]/70 px-2 py-0.5 rounded-md border border-[#E5E1D8] dark:border-[#2D2321] text-[#8B7E74] dark:text-[#B2A496] backdrop-blur-xs">
            Chuẩn củ nén
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-bold text-[#2D241E] dark:text-[#FAF8F5] text-lg mb-1 group-hover:text-[#D97706] transition-colors duration-200">
          {product.name}
        </h4>

        <div className="flex items-center gap-2 mb-2">
          {avgRating ? (
            <div className="flex items-center text-amber-500 gap-0.5 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{avgRating}</span>
              <span className="text-[#8B7E74] dark:text-[#B2A496] text-[10px] font-normal">({productReviews.length} đánh giá)</span>
            </div>
          ) : (
            <span className="text-[#8B7E74] dark:text-[#B2A496] text-[10px] italic">Chưa có đánh giá</span>
          )}
          
          {productReviews.length > 0 && (
            <button
              onClick={() => setShowReviewsPanel(true)}
              className="text-[10px] text-[#D97706] hover:underline flex items-center gap-0.5 ml-auto font-semibold"
            >
              <MessageSquare className="w-3 border-none h-3" />
              Xem nhận xét
            </button>
          )}
        </div>

        <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] leading-relaxed mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#F3F0E9] dark:border-[#2D2321]">
          <span className="text-lg font-extrabold text-[#D97706]">
            {formatPrice(product.price)}
          </span>
          {isOutOfStock ? (
            <span className="bg-[#8B7E74] text-white text-[10px] font-extrabold px-3 py-2.5 rounded-xl">Hết hàng</span>
          ) : (
          <button 
            onClick={handleQuickAdd}
            className="bg-[#F3F0E9] dark:bg-[#2D2321] hover:bg-[#D97706] dark:hover:bg-[#D97706] text-[#2D241E] dark:text-[#FAF8F5] hover:text-white p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 text-xs font-bold"
            title="Thêm vào giỏ"
            id={`add-btn-${product.id}`}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
          )}
        </div>
      </div>

      {showOptions && (
        <div className="absolute inset-0 bg-white/95 dark:bg-[#1C1311]/95 backdrop-blur-md p-4 flex flex-col justify-between z-20 transition-all duration-300 overflow-y-auto">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Tùy chọn Bánh Canh</h5>
              <button 
                onClick={() => {
                  setShowOptions(false);
                  setSelectedToppings([]);
                }}
                className="text-xs font-bold text-[#8B7E74] hover:text-[#2D241E] dark:hover:text-[#FAF8F5]"
              >
                Hủy
              </button>
            </div>
            <p className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] mb-3">{product.name}</p>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase block mb-1">Chọn Sợi Bánh Canh:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedNoodle('Bột gạo')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedNoodle === 'Bột gạo'
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1311] text-[#3E2F26] dark:text-[#EAE3D2] border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18]'
                  }`}
                >
                  Bột gạo (Mềm mượt)
                </button>
                <button
                  onClick={() => setSelectedNoodle('Bột lọc')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedNoodle === 'Bột lọc'
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1311] text-[#3E2F26] dark:text-[#EAE3D2] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18]'
                  }`}
                >
                  Bột lọc (Dai dẻo)
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase block mb-1.5">Gợi ý Topping ăn kèm:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TOPPING_OPTIONS.map((topping) => {
                  const isSelected = selectedToppings.some(t => t.id === topping.id);
                  const toppingImage = topping.imageUrl || '';
                  return (
                    <button
                      key={topping.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedToppings(prev => prev.filter(t => t.id !== topping.id));
                        } else {
                          setSelectedToppings(prev => [...prev, topping]);
                        }
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all text-[10px] ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-[#D97706] border-[#D97706]'
                          : 'bg-[#FAF8F5] dark:bg-[#231A18] text-[#3E2F26] dark:text-[#EAE3D2] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-amber-50/40 dark:hover:bg-amber-950/10'
                      }`}
                    >
                      {toppingImage.startsWith('http') ? (
                        <img 
                          src={toppingImage}
                          alt={topping.name} 
                          className="w-5 h-5 rounded-md object-cover shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs shrink-0">{toppingImage || '🍲'}</span>
                      )}
                      <div className="truncate flex-1 min-w-0">
                        <p className="font-bold leading-normal truncate">{topping.name.replace(' thêm', '').replace(' Thêm', '')}</p>
                        <p className="text-[9px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5 leading-none">+{formatPrice(topping.price)}</p>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-[#D97706] border-[#D97706] text-white' 
                          : 'border-gray-300 dark:border-gray-700'
                      }`}>
                        {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase block mb-1">Ghi chú (bỏ ớt, hành...):</label>
              <input
                type="text"
                placeholder="Ví dụ: Ít cay, không lấy đầu cá..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#1E1715] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              />
            </div>
          </div>

          <button
            onClick={handleConfirmAdd}
            className="w-full bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm mt-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Xác Nhận Thêm ({formatPrice(product.price + selectedToppings.reduce((s, t) => s + t.price, 0))})
          </button>
        </div>
      )}

      {showReviewsPanel && (
        <div className="absolute inset-0 bg-white/98 backdrop-blur-md p-4 flex flex-col justify-between z-20 transition-all duration-350">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-start mb-2 border-b border-[#F3F0E9] pb-2">
              <div>
                <h5 className="font-bold text-sm text-[#2D241E]">Đánh Giá Khách Hàng</h5>
                <p className="text-[9px] text-[#8B7E74] font-medium leading-tight">{product.name}</p>
              </div>
              <button 
                onClick={() => setShowReviewsPanel(false)}
                className="text-xs font-extrabold text-[#D97706] bg-[#FAF8F5] py-1 px-3.5 rounded-lg border border-[#E5E1D8] transition-colors"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 my-1 pr-1 scrollbar-thin">
              {productReviews.map((rev) => (
                <div key={rev.id} className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5E1D8] text-[11px] text-[#3E2F26]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#2D241E]">{rev.customerName}</span>
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-2.5 h-2.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="italic leading-relaxed">"{rev.comment}"</p>
                  <span className="text-[8px] text-[#8B7E74] block mt-1 font-mono">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
