import React, { useState, useMemo } from 'react';
import { Product, ProductReview, ProductOption } from '../types';
import { Plus, ShoppingCart, Star, MessageSquare, Check } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, noodleType?: string, notes?: string, toppings?: Product[], selectedOptions?: { optionId: number; name: string; optionGroup: string; price: number }[]) => void;
  reviews?: ProductReview[];
  productOptions?: ProductOption[];
}

export function ProductCard({ product, onAddToCart, reviews = [], productOptions = [] }: ProductCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showReviewsPanel, setShowReviewsPanel] = useState(false);
  const [notes, setNotes] = useState('');

  const productReviews = reviews.filter(r => r.productName === product.name);
  const avgRating = productReviews.length > 0 
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : null;

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const thisOptions = useMemo(() =>
    productOptions.filter(o => o.productId === Number(product.id) && o.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [productOptions, product.id]
  );

  const groupedOptions = useMemo(() => {
    const groups: Record<string, ProductOption[]> = {};
    thisOptions.forEach(o => {
      if (!groups[o.optionGroup]) groups[o.optionGroup] = [];
      groups[o.optionGroup].push(o);
    });
    const preferredOrder = ['noodle', 'size', 'topping', 'sugar', 'ice', 'coffee_type'];
    return Object.entries(groups).sort(([a], [b]) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [thisOptions]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, number[]>>({});

  const toggleOption = (groupId: string, optionId: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const toggleSingleOption = (groupId: string, optionId: number) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: [optionId] }));
  };

  const getSelectedPrice = () => {
    let extra = 0;
    Object.entries(selectedOptions).forEach(([, ids]) => {
      ids.forEach(id => {
        const opt = thisOptions.find(o => o.id === id);
        if (opt) extra += opt.price;
      });
    });
    return extra;
  };

  const getSelectedDetails = () => {
    const details: { optionId: number; name: string; optionGroup: string; price: number }[] = [];
    Object.entries(selectedOptions).forEach(([, ids]) => {
      ids.forEach(id => {
        const opt = thisOptions.find(o => o.id === id);
        if (opt) details.push({ optionId: opt.id, name: opt.name, optionGroup: opt.optionGroup, price: opt.price });
      });
    });
    return details;
  };

  const isMain = product.categoryName === 'Bánh Canh Cá Lóc' || product.categoryId === 1;
  const isOutOfStock = !product.isAvailable;
  const hasOptions = thisOptions.length > 0;

  const handleQuickAdd = () => {
    if (!product.isAvailable) return;
    if (isMain || hasOptions) {
      setShowOptions(true);
    } else {
      onAddToCart(product, '', '');
    }
  };

  const handleConfirmAdd = () => {
    if (!product.isAvailable) return;

    const missingRequired: string[] = [];
    groupedOptions.forEach(([group, opts]) => {
      if (opts.some(o => o.isRequired)) {
        const groupSelected = selectedOptions[group] || [];
        if (groupSelected.length === 0) {
          missingRequired.push(optionGroupLabels[group] || group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
      }
    });
    if (missingRequired.length > 0) {
      alert(`Vui lòng chọn: ${missingRequired.join(', ')}`);
      return;
    }

    onAddToCart(product, '', notes, [], getSelectedDetails());
    setShowOptions(false);
    setSelectedOptions({});
    setNotes('');
  };

  const optionGroupLabels: Record<string, string> = {
    noodle: 'Loại Sợi',
    topping: 'Topping',
    size: 'Chọn Size',
    sugar: 'Đường',
    ice: 'Đá',
    coffee_type: 'Loại Cà Phê'
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
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const p = (e.currentTarget as HTMLElement).parentElement; if (p) p.innerText = '🍲'; }}
          />
        ) : (
          <span className="text-6xl drop-shadow-sm"></span>
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
              <h5 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Tùy chọn {product.name}</h5>
              <button 
                onClick={() => {
                  setShowOptions(false);
                  setSelectedOptions({});
                }}
                className="text-xs font-bold text-[#8B7E74] hover:text-[#2D241E] dark:hover:text-[#FAF8F5]"
              >
                Hủy
              </button>
            </div>

            {groupedOptions.map(([group, opts]) => (
              <div key={group} className="mb-3">
                <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase block mb-1.5">
                  {optionGroupLabels[group] || group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {opts.some(o => o.isRequired) && <span className="text-red-500 ml-1">* (bắt buộc)</span>}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {opts.map(opt => {
                    const groupSelected = selectedOptions[group] || [];
                    const isSelected = groupSelected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => group === 'topping' ? toggleOption(group, opt.id) : toggleSingleOption(group, opt.id)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all text-[10px] ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-[#D97706] border-[#D97706]'
                            : 'bg-[#FAF8F5] dark:bg-[#231A18] text-[#3E2F26] dark:text-[#EAE3D2] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-amber-50/40 dark:hover:bg-amber-950/10'
                        }`}
                      >
                        <div className="truncate flex-1 min-w-0">
                          <p className="font-bold leading-normal truncate">{opt.name}</p>
                          {opt.price > 0 && <p className="text-[9px] text-[#8B7E74] dark:text-[#B2A496] mt-0.5 leading-none">+{formatPrice(opt.price)}</p>}
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
            ))}

            <div>
              <label className="text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase block mb-1">Ghi chú:</label>
              <input
                type="text"
                placeholder="Ví dụ: Ít cay, không lấy đầu cá..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5] dark:bg-[#1E1715] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              />
            </div>
          </div>

          <div className="space-y-1.5 mt-3">
            {groupedOptions.some(([, opts]) => opts.some(o => o.isRequired)) && (
              <p className="text-[9px] text-red-500 font-medium italic">* Vui lòng chọn đầy đủ các mục bắt buộc</p>
            )}
            <button
              onClick={handleConfirmAdd}
              className="w-full bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Xác Nhận Thêm ({formatPrice(product.price + getSelectedPrice())})
            </button>
          </div>
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
