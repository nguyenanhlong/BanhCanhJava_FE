import React from 'react';
import { ShieldCheck, Heart, Award, Flame } from 'lucide-react';

export function AboutUs() {
  const highlights = [
    {
      icon: <Flame className="w-6 h-6 text-[#D97706]" />,
      title: 'Hương Vị Củ Nén Đặc Trưng',
      desc: 'Sử dụng Củ Nén (Hành tăm) - loại củ gia vị độc quyền của mảnh đất miền Trung đầy nắng gió, phi thơm vàng ruộm khử tanh tuyệt hảo cho cá lóc đồng.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#D97706]" />,
      title: 'Cá Lóc Đồng Sạch Sẽ',
      desc: 'Cá lóc được tuyển chọn kỹ lưỡng, lóc phi lê luộc gỡ xương tỉ mỉ. Phần xương và đầu cá dùng hầm nước cốt súp thanh ngọt đậm vị thơm quyến rũ.'
    },
    {
      icon: <Award className="w-6 h-6 text-[#D97706]" />,
      title: 'Lựa Chọn Sợi Bánh Độc Bản',
      desc: 'Khách hàng có thể linh hoạt chọn Sợi Bột Gạo mềm mại thanh tao hoặc Sợi Bột Lọc dai dai ngọt bùi tự nhiên được nhào nặn quết tay mới mỗi sáng.'
    },
    {
      icon: <Heart className="w-6 h-6 text-[#D97706]" />,
      title: 'Tự hào Thương hiệu Việt',
      desc: 'Giữ trọn công thức nấu gia truyền từ năm 1998, kết hợp dịch vụ giao hàng thông minh, tiện ích thanh toán điện tử thời thượng.'
    }
  ];

  return (
    <section id="about-section" className="py-12 px-1 text-[#3E2F26] dark:text-[#EAE3D2]">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[#D97706] font-mono text-xs uppercase tracking-widest font-black">Bánh canh cá lóc miền trung</span>
        <h2 className="text-3xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5] mt-2 mb-4">
          Hành Trình Gửi Gắm Tình Quê Qua Từng Tô Bánh Canh Sóng Sánh
        </h2>
        <div className="h-1 w-16 bg-[#D97706] mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Story Intro */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1C1311] p-6 sm:p-8 rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-xs">
          <h3 className="font-serif text-2xl font-bold text-[#2D241E] dark:text-[#FAF8F5] mb-4">
            Bảo tồn cốt cách hương vị truyền thống
          </h3>
          <p className="text-sm text-[#3E2F26] dark:text-[#EAE3D2] mb-4 leading-relaxed">
            Chúng tôi sinh ra từ miền di sản Trung bộ đầy nắng gió, nơi bàn tay của người mẹ gom từng hạt gạo sạch thơm lừng xay nhào nặn sợi, nấu bát canh nực nồng ấm áp xoa dịu cái se lạnh chiều mưa.
          </p>
          <p className="text-sm text-[#3E2F26] dark:text-[#EAE3D2] mb-6 leading-relaxed">
            Thương hiệu <strong>Bánh Canh Cá Lóc Miền Trung</strong> mang trọn tâm huyết gìn giữ nguồn nguyên liệu tinh khôi: củ nén thanh nồng, ớt bột cay cay nồng đượm, sả sấy tơi, chả cua chính thống xứ Huế cùng dĩa tóp mỡ giòn rụm bùi béo.
          </p>
          
          <div className="bg-[#FAF8F5] dark:bg-[#1E1513] p-4 rounded-2xl border-l-4 border-[#D97706] text-xs font-mono text-[#8B7E74] dark:text-[#B2A496]">
            "Nhìn khói bốc lên nghi ngút, húp muỗng súp nóng rực vị củ nén nồng nàn cay rát đầu lưỡi... Ấy là lúc hương vị quê hương đánh thức giác quan."
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {highlights.map((item, idx) => (
            <div key={idx} className="bg-white/50 dark:bg-[#1C1311]/50 p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] hover:bg-white dark:hover:bg-[#1C1311] hover:shadow-xs transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#F3F0E9] dark:bg-[#2D2321] flex items-center justify-center mb-4 border border-[#E5E1D8] dark:border-[#2D2321]">
                {item.icon}
              </div>
              <h4 className="font-bold text-[#2D241E] dark:text-[#FAF8F5] text-base mb-2">{item.title}</h4>
              <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F1EDE4] dark:bg-[#1E1513] p-6 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center hover:shadow-sm transition-all">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-3xl font-black text-[#D97706]">1998</div>
          <div className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-1 font-semibold">Năm thành lập</div>
        </div>
        <div className="bg-[#F1EDE4] dark:bg-[#1E1513] p-6 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center hover:shadow-sm transition-all">
          <div className="text-3xl mb-2">🍜</div>
          <div className="text-3xl font-black text-[#D97706]">20+</div>
          <div className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-1 font-semibold">Món ăn đặc sắc</div>
        </div>
        <div className="bg-[#F1EDE4] dark:bg-[#1E1513] p-6 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center hover:shadow-sm transition-all">
          <div className="text-3xl mb-2">❤️</div>
          <div className="text-3xl font-black text-[#D97706]">5.000+</div>
          <div className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-1 font-semibold">Khách hàng thân thiết</div>
        </div>
        <div className="bg-[#F1EDE4] dark:bg-[#1E1513] p-6 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center hover:shadow-sm transition-all">
          <div className="text-3xl mb-2">👨‍🍳</div>
          <div className="text-3xl font-black text-[#D97706]">15+</div>
          <div className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-1 font-semibold">Nhân viên tận tâm</div>
        </div>
      </div>

      {/* Delivery Partners */}
      <div className="mt-12 text-center">
        <span className="text-[#D97706] font-mono text-xs uppercase tracking-widest font-black">Đối tác vận chuyển</span>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {['🚴 GrabFood', '🛵 ShopeeFood', '🏍️ Baemin', '🚗 GoFood'].map((partner, idx) => (
            <div key={idx} className="bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] px-5 py-3 rounded-xl text-sm font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18] transition-all shadow-xs">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
