import React from 'react';

interface HeroProps {
  onOrderNow: () => void;
}

export function Hero({ onOrderNow }: HeroProps) {
  return (
    <section className="bg-[#F1EDE4] dark:bg-[#251A18] rounded-3xl p-6 sm:p-10 relative overflow-hidden shrink-0 border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm my-6 transition-colors duration-300">
      {/* Miễn phí giao hàng banner */}
      <div className="absolute top-0 right-0 bg-[#D97706] text-white text-xs font-bold px-5 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-md z-20">
        🚚 Miễn phí giao hàng
      </div>

      <div className="relative z-10 max-w-xl">
        <span className="bg-white/90 dark:bg-[#1C1311]/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#D97706] mb-4 inline-block tracking-wide shadow-xs border border-transparent dark:border-[#2D2321] animate-pulse">
          ĐẶC SẢN MIỀN TRUNG - ĐĂNG KÝ MỚI NHẬN QUÀ TO
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#2D241E] dark:text-[#FAF8F5] leading-tight mb-4">
          Thưởng thức hương vị bánh canh cá lóc chuẩn vị Trung béo bùi đậm vị!
        </h2>
        <p className="text-sm sm:text-base text-[#3E2F26] dark:text-[#EAE3D2] mb-6 max-w-lg leading-relaxed">
          Từng sợi bánh canh tinh bột gạo sạch mộc mạc và bột lọc dai dai hòa quyện vào nước dùng ngọt lịm ngọt mát hầm liên tục 8 tiếng từ xương cá lóc nguyên chất. Đậm vị nén nướng thơm cay đặc trưng!
        </p>
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={onOrderNow}
            className="bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] px-6 py-3.5 rounded-xl font-bold hover:bg-[#3E2F26] dark:hover:bg-[#EAE3D2] transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
          >
            Đặt món ngay giảm 20%
          </button>
          <a
            href="#about-section"
            className="bg-white/80 dark:bg-[#1C1311]/80 border border-[#E5E1D8] dark:border-[#2D2321] text-[#3E2F26] dark:text-[#EAE3D2] px-6 py-3.5 rounded-xl font-bold hover:bg-white dark:hover:bg-[#251A18] transition-all duration-300 text-center flex items-center justify-center hover:shadow-md"
          >
            Tìm hiểu bí quyết truyền nghề
          </a>
        </div>

        {/* Stats / Badge row */}
        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-[#1C1311]/60 backdrop-blur px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
            <span className="text-lg">🍜</span>
            <span className="text-[#3E2F26] dark:text-[#EAE3D2]"><strong className="text-[#D97706]">20+</strong> Món ngon</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-[#1C1311]/60 backdrop-blur px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
            <span className="text-lg">❤️</span>
            <span className="text-[#3E2F26] dark:text-[#EAE3D2]"><strong className="text-[#D97706]">5.000+</strong> Khách hàng</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-[#1C1311]/60 backdrop-blur px-3 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321]">
            <span className="text-lg">⭐</span>
            <span className="text-[#3E2F26] dark:text-[#EAE3D2]"><strong className="text-[#D97706]">25 Năm</strong> Kinh nghiệm</span>
          </div>
        </div>
      </div>

      {/* Decorative circles - layered */}
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#E8E2D2] dark:bg-[#201513] rounded-full opacity-40 pointer-events-none"></div>
      <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#D97706]/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -right-4 top-1/3 w-48 h-48 bg-[#D97706]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Decorative food images area - right side */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-[#E8E2D2] dark:from-[#251A18] to-white dark:to-[#1C1311] rounded-2xl rotate-6 border-4 border-white dark:border-[#2D2321] shadow-xl hover:rotate-3 transition-transform duration-500 flex-col items-center justify-center text-center p-6 shrink-0">
        {/* Floating food emojis */}
        <div className="absolute -top-4 -right-4 text-4xl animate-pulse">🍜</div>
        <div className="absolute -bottom-3 -left-3 text-3xl animate-pulse delay-75">🥟</div>
        <div className="absolute top-8 -left-5 text-2xl animate-pulse delay-150">🫕</div>
        <div className="absolute bottom-8 -right-4 text-2xl animate-pulse delay-100">🌶️</div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 text-xl animate-pulse delay-200">🥬</div>

        <h4 className="font-serif font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5] mb-2 font-sans">Bánh Canh Đặc Biệt</h4>
        <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mb-3">Sợi bánh dai mướt, nước súp sánh óng ấm sả củ nén, thịt cá tươi phưng phức!</p>
        <span className="text-[#D97706] text-sm font-extrabold tracking-widest uppercase">Since 1998</span>
      </div>
    </section>
  );
}
