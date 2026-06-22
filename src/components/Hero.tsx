import React from 'react';

interface HeroProps {
  onOrderNow: () => void;
}

export function Hero({ onOrderNow }: HeroProps) {
  return (
    <section className="bg-[#F1EDE4] dark:bg-[#251A18] rounded-3xl p-6 sm:p-10 relative overflow-hidden shrink-0 border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm my-6 transition-colors duration-300">
      <div className="relative z-10 max-w-xl">
        <span className="bg-white/90 dark:bg-[#1C1311]/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#D97706] mb-4 inline-block tracking-wide shadow-xs border border-transparent dark:border-[#2D2321]">
          ĐẶC SẢN MIỀN TRUNG - ĐĂNG KÝ MỚI NHẬN QUÀ TO
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#2D241E] dark:text-[#FAF8F5] leading-tight mb-4">
          Thưởng thức hương vị bánh canh cá lóc chuẩn vị Trung béo bùi đậm vị!
        </h2>
        <p className="text-sm sm:text-base text-[#3E2F26] dark:text-[#EAE3D2] mb-6 max-w-lg leading-relaxed">
          Từng sợi bánh canh tinh bột gạo sạch mộc mạc và bột lọc dai dai hòa quyện vào nước dùng ngọt lịm ngọt mát hầm liên tục 8 tiếng từ xương cá lóc nguyên chất. Đậm vị nén nướng thơm cay đặc trưng!
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onOrderNow}
            className="bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] px-6 py-3.5 rounded-xl font-bold hover:bg-[#3E2F26] dark:hover:bg-[#EAE3D2] transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
          >
            Đặt món ngay giảm 20%
          </button>
          <a
            href="#about-section"
            className="bg-white/80 dark:bg-[#1C1311]/80 border border-[#E5E1D8] dark:border-[#2D2321] text-[#3E2F26] dark:text-[#EAE3D2] px-6 py-3.5 rounded-xl font-bold hover:bg-white dark:hover:bg-[#251A18] transition-all duration-300 text-center flex items-center justify-center"
          >
            Tìm hiểu bí quyết truyền nghề
          </a>
        </div>
      </div>

      {/* Decorative Graphics */}
      <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-[#E8E2D2] dark:bg-[#201513] rounded-full opacity-60 pointer-events-none"></div>
      <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#D97706]/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Absolute image placeholder representation visually */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-[#E8E2D2] dark:from-[#251A18] to-white dark:to-[#1C1311] rounded-2xl rotate-6 border-4 border-white dark:border-[#2D2321] shadow-xl hover:rotate-3 transition-transform duration-500 flex-col items-center justify-center text-center p-6 shrink-0">
        <h4 className="font-serif font-bold text-lg text-[#2D241E] dark:text-[#FAF8F5] mb-2 font-sans">Bánh Canh Đặc Biệt</h4>
        <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mb-3">Sợi bánh dai mướt, nước súp sánh óng ấm sả củ nén, thịt cá tươi phưng phức!</p>
        <span className="text-[#D97706] text-sm font-extrabold tracking-widest uppercase">Since 1998</span>
      </div>
    </section>
  );
}
