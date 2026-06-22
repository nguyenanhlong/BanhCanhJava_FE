import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldAlert, Wifi, CreditCard, Sparkles } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'momo' | 'vnpay' | 'card' | 'cod';
    totalAmount: number;
  } | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  orderDetails
}: PaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    if (!isOpen || !orderDetails || orderDetails.paymentMethod === 'cod') return;
    
    setTimeLeft(125);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, orderDetails]);

  if (!isOpen || !orderDetails) return null;

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 2000);
  };

  const getGatewayTheme = () => {
    switch (orderDetails.paymentMethod) {
      case 'momo':
        return {
          bg: 'from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/30',
          accent: 'bg-pink-600 text-white',
          border: 'border-pink-200 dark:border-pink-900/30',
          text: 'text-pink-700 dark:text-pink-400',
          logo: '🎀 MoMo QR Pay',
          desc: 'Quét mã bằng ứng dụng Ví MoMo'
        };
      case 'vnpay':
        return {
          bg: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30',
          accent: 'bg-blue-600 text-white',
          border: 'border-blue-200 dark:border-blue-900/30',
          text: 'text-blue-700 dark:text-blue-400',
          logo: '🏛️ VNPay SmartQRCode',
          desc: 'Quét bằng Mobile Banking bất cứ ngân hàng nào'
        };
      case 'card':
        return {
          bg: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30',
          accent: 'bg-purple-600 text-white',
          border: 'border-purple-200 dark:border-purple-900/30',
          text: 'text-purple-700 dark:text-purple-400',
          logo: '💳 Visa/Mastercard Checkout',
          desc: 'Nhập thông tin thẻ quốc tế của bạn'
        };
      default:
        return {
          bg: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30',
          accent: 'bg-amber-600 text-white',
          border: 'border-amber-200 dark:border-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          logo: '💵 COD Gateway',
          desc: 'Xác nhận đơn hàng giao hàng thu tiền'
        };
    }
  };

  const theme = getGatewayTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 bg-[#2D241E]/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#FAF8F5] dark:bg-[#150F0D] text-[#3E2F26] dark:text-[#EAE3D2] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl max-w-md w-full overflow-hidden z-10 font-sans transition-colors duration-300">
        
        {/* Banner header inside custom portal */}
        <div className={`p-6 bg-gradient-to-r ${theme.bg} border-b border-[#E5E1D8] dark:border-[#2D2321] relative`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-block text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md ${theme.accent} mb-1.5`}>
                Cổng thanh toán điện tử
              </span>
              <h3 className="text-xl font-extrabold text-[#2D241E] dark:text-[#FAF8F5] font-sans">{theme.logo}</h3>
              <p className="text-xs text-[#8B7E74] dark:text-[#B2A496] mt-0.5">{theme.desc}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full bg-white/60 hover:bg-white dark:bg-[#1E1513]/60 dark:hover:bg-[#1E1513] text-[#8B7E74] dark:text-[#B2A496] hover:text-[#2D241E] dark:hover:text-[#FAF8F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-6 space-y-6">
          
          {/* Amount info */}
          <div className="bg-white dark:bg-[#1C1311] p-4 rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] text-center">
            <span className="text-xs text-[#8B7E74] dark:text-[#B2A496] uppercase tracking-wider font-bold block">Tổng tiền cần thanh toán</span>
            <span className="text-3xl font-black text-[#D97706] block mt-1 font-mono">
              {orderDetails.totalAmount.toLocaleString('vi-VN')} đ
            </span>
            <div className="inline-flex gap-1.5 items-center mt-2.5 bg-[#F3F0E9] dark:bg-[#251A18] px-3 py-1 rounded-full text-[10px] text-[#3E2F26] dark:text-[#EAE3D2] font-mono">
              <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-ping" />
              <span>Giao dịch an toàn mã hóa SSL 256-bit</span>
            </div>
          </div>

          {/* Dynamic Forms according to Payment Type Selection */}
          {orderDetails.paymentMethod === 'card' ? (
            /* VISA/MASTERCARD INPUT FORMS */
            <div className="space-y-3.5">
              <div className="bg-gradient-to-tr from-[#2D241E] to-[#3E2F26] text-white p-4 rounded-xl relative overflow-hidden shadow-xs">
                <div className="absolute top-3 right-4 opacity-30 text-xs tracking-widest font-mono">WORLD CARD</div>
                <div className="text-[10px] text-[#8B7E74] uppercase font-bold tracking-widest">Bánh Canh Quán Pay</div>
                <div className="text-lg font-mono tracking-widest my-4">
                  {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ') : '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <div>
                    <span className="text-white/40 block">CHỦ THẺ</span>
                    <span className="font-bold">{cardHolder.toUpperCase() || 'TEN CHU THE'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 block">HẠN DÙNG</span>
                    <span className="font-bold">{cardExpiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Số thẻ visa/Mastercard:</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="4111222233334444"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706] tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-extrabold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Tên Trên Thẻ (Không dấu):</label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#3E2F26] dark:text-[#EAE3D2] uppercase">Mã CVV:</label>
                    <input
                      type="password"
                      maxLength={3}
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706] text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* QR CODE PRESENTATION FOR MOMO & VNPAY */
            <div className="flex flex-col items-center space-y-4">
              
              {/* Fake QR Scanner frame */}
              <div className="relative p-3 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] rounded-2xl shadow-sm">
                
                {/* Simulated QR block layout */}
                <div className="w-48 h-48 bg-[#FAF8F5] dark:bg-[#150F0D] rounded-xl flex flex-col items-center justify-center p-2 relative">
                  
                  {/* Decorative corner borders to look scanner-like */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D97706]" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D97706]" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D97706]" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D97706]" />

                  {/* Visual QR Code mock vector representation */}
                  <div className="grid grid-cols-4 gap-2.5 p-4 bg-white dark:bg-[#251A18] rounded-lg border border-[#E5E1D8] dark:border-[#2D2321]">
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs relative1">
                      <div className="absolute inset-1.5 bg-white dark:bg-[#1C1311] rounded-xs">
                        <div className="absolute inset-1 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs" />
                      </div>
                    </div>
                    <div className="w-8 h-8 flex flex-wrap gap-1 p-0.5">
                      <div className="w-3" />
                      <div className="w-3 h-3 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                      <div className="w-3 h-3 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                      <div className="w-3 h-3 bg-[#D97706]" />
                    </div>
                    <div className="w-8 h-8 flex flex-wrap gap-1 p-0.5">
                      <div className="w-3 h-3 bg-[#D97706]" />
                      <div className="w-3 h-3 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                      <div className="w-3 h-3 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                    </div>
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs relative2">
                      <div className="absolute inset-1.5 bg-white dark:bg-[#1C1311] rounded-xs">
                        <div className="absolute inset-1 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs" />
                      </div>
                    </div>
                    
                    {/* Middle elements */}
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                    <div className="w-8 h-8 bg-[#D97706] rounded-full" />
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2]" />

                    {/* Lower elements */}
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs relative3">
                      <div className="absolute inset-1.5 bg-white dark:bg-[#1C1311] rounded-xs">
                        <div className="absolute inset-1 bg-[#2D241E] dark:bg-[#EAE3D2] rounded-xs" />
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                    <div className="w-8 h-8 bg-[#D97706]" />
                    <div className="w-8 h-8 bg-[#2D241E] dark:bg-[#EAE3D2]" />
                  </div>

                  {/* Brand Tag in Center */}
                  <span className="absolute text-[8px] bg-white dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321] text-[#2D241E] dark:text-[#FAF8F5] px-1.5 py-0.5 rounded font-black tracking-wide shadow-xs">
                    BANHCANH
                  </span>
                </div>

                {/* Simulated Laser Scan Beam */}
                <div className="absolute left-6 right-6 h-0.5 bg-red-500 top-1/2 shadow-lg animate-bounce" />
              </div>

              {/* Timer indicator */}
              <div className="text-center">
                <p className="text-xs text-[#8B7E74] dark:text-[#B2A496]">Mã QR hết hạn sau:</p>
                <p className="text-sm font-mono font-black text-[#2D241E] dark:text-[#FAF8F5] mt-0.5">{formatTime(timeLeft)}</p>
              </div>
            </div>
          )}

          {/* Guidelines instruction */}
          <div className="p-3.5 bg-[#F3F0E9] dark:bg-[#251A18] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] flex items-start gap-2.5">
            <Wifi className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div className="text-[10px] text-[#3E2F26] dark:text-[#EAE3D2] leading-relaxed">
              <strong>Hướng dẫn tự động mô phỏng:</strong> Hệ thống đang kết nối trực tiếp đến mô hình kiểm thử ngân hàng liên thông Việt Nam SmartPay. Quý khách vui lòng nhấn nút <strong>XÁC NHẬN THANH TOÁN THÀNH CÔNG</strong> dưới đây để hoàn tất lập tức đơn hàng mà không mất tiền thật!
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full bg-[#D97706] hover:bg-[#D97706]/90 disabled:bg-[#8B7E74]/50 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Đang kiểm tra giao dịch liên ngân hàng...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                XÁC NHẬN THANH TOÁN THÀNH CÔNG 🎉
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
