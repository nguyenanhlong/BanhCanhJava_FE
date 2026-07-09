import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  orderDetails: {
    orderId: number;
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: 'momo' | 'cod';
    totalAmount: number;
  } | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  orderDetails
}: PaymentModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  const pollStatus = useCallback(async (orderId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await ApiService.getMoMoPaymentStatus(orderId);
        if (res.status === 'completed') {
          clearInterval(interval);
          setPaymentStatus('completed');
          setTimeout(() => onPaymentSuccess(), 1000);
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setPaymentStatus('failed');
        }
      } catch { }
    }, 2000);
    return () => clearInterval(interval);
  }, [onPaymentSuccess]);

  useEffect(() => {
    if (!isOpen || !orderDetails || orderDetails.paymentMethod === 'cod') return;
    setQrUrl('');
    setPayUrl('');
    setPaymentStatus('pending');
    setErrorMsg('');

    ApiService.createMoMoPayment(orderDetails.orderId, orderDetails.totalAmount)
      .then(data => {
        setQrUrl(data.qrCodeUrl || '');
        setPayUrl(data.payUrl || '');
      })
      .catch(err => setErrorMsg(err.message));

    const cleanup = pollStatus(orderDetails.orderId);
    return () => { cleanup.then(fn => fn()); };
  }, [isOpen, orderDetails, pollStatus]);

  if (!isOpen || !orderDetails) return null;

  if (orderDetails.paymentMethod === 'cod') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#150F0D] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl max-w-sm w-full p-6 text-center">
          <div className="text-5xl mb-3"></div>
          <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Đơn hàng COD</h3>
          <p className="text-xs text-[#8B7E74] mt-1">
            Thanh toán khi nhận hàng — {orderDetails.totalAmount.toLocaleString('vi-VN')}đ
          </p>
          <button onClick={onPaymentSuccess}
            className="mt-4 w-full bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold py-3 rounded-xl text-xs">
            Xác nhận đặt hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#150F0D] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl max-w-sm w-full p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-8"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
            <span className="font-bold text-sm text-[#D97706]">MoMo</span>
          </div>

          <p className="text-2xl font-black text-[#2D241E] dark:text-[#FAF8F5]">
            {orderDetails.totalAmount.toLocaleString('vi-VN')}đ
          </p>

          {errorMsg && (
            <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">{errorMsg}</p>
          )}

          {paymentStatus === 'completed' ? (
            <div className="py-6">
              <div className="text-5xl mb-2"></div>
              <p className="font-bold text-sm text-emerald-600">Thanh toán thành công!</p>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div className="py-6">
              <div className="text-5xl mb-2"></div>
              <p className="font-bold text-sm text-red-500">Thanh toán thất bại</p>
              <button onClick={onClose} className="mt-3 text-xs text-[#D97706] underline">Thử lại</button>
            </div>
          ) : (
            <>
              {qrUrl && (
                <div className="flex justify-center">
                  <img src={qrUrl} alt="QR thanh toán" className="w-48 h-48 object-contain rounded-xl border border-[#E5E1D8]" />
                </div>
              )}

              {payUrl && (
                <a href={payUrl} target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold py-3 rounded-xl text-xs">
                  Mở MoMo App để thanh toán
                </a>
              )}

              <button onClick={onPaymentSuccess}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px]"
                disabled={isProcessing}>
                {isProcessing ? 'Đang xử lý...' : 'Đã thanh toán xong (mô phỏng)'}
              </button>
            </>
          )}

          <button onClick={onClose}
            className="text-[10px] text-[#8B7E74] hover:text-[#2D241E] underline">
            {paymentStatus === 'completed' ? 'Đóng' : 'Huỷ giao dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}
