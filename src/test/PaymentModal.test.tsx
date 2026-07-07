import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModal } from '../components/PaymentModal';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    createMoMoPayment: vi.fn(),
    getMoMoPaymentStatus: vi.fn(),
  },
}));

const baseOrderDetails = {
  orderId: 1,
  customerName: 'Test',
  phone: '0912345678',
  address: '123 Street',
  paymentMethod: 'cod' as const,
  totalAmount: 100000,
};

describe('PaymentModal', () => {
  const onClose = vi.fn();
  const onPaymentSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PaymentModal isOpen={false} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={baseOrderDetails} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when orderDetails is null', () => {
    const { container } = render(
      <PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={null} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows COD confirmation when payment method is cod', () => {
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={baseOrderDetails} />);
    expect(screen.getByText(/Đơn hàng COD/)).toBeInTheDocument();
    expect(screen.getByText('Xác nhận đặt hàng')).toBeInTheDocument();
  });

  it('shows MoMo payment section when payment method is momo', async () => {
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockResolvedValue({ qrCodeUrl: '', payUrl: '' });
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    await waitFor(() => {
      expect(screen.getByText('MoMo')).toBeInTheDocument();
    });
  });

  it('calls onPaymentSuccess when COD button clicked', () => {
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={baseOrderDetails} />);
    fireEvent.click(screen.getByText('Xác nhận đặt hàng'));
    expect(onPaymentSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls createMoMoPayment when payment method is momo', async () => {
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockResolvedValue({ qrCodeUrl: 'http://example.com/qr.png', payUrl: 'http://example.com/pay' });
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    await waitFor(() => {
      expect(mockCreateMoMo).toHaveBeenCalledWith(1, 100000);
    });
  });

  it('shows QR code when qrCodeUrl is returned', async () => {
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockResolvedValue({ qrCodeUrl: 'http://example.com/qr.png', payUrl: '' });
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    await waitFor(() => {
      const qrImg = screen.getByAltText('QR thanh toán');
      expect(qrImg).toBeInTheDocument();
      expect(qrImg).toHaveAttribute('src', 'http://example.com/qr.png');
    });
  });

  it('shows pay URL link when payUrl is returned', async () => {
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockResolvedValue({ qrCodeUrl: '', payUrl: 'http://example.com/pay' });
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    await waitFor(() => {
      expect(screen.getByText('Mở MoMo App để thanh toán')).toBeInTheDocument();
    });
  });

  it('shows error message when createMoMoPayment fails', async () => {
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockRejectedValue(new Error('Lỗi kết nối'));
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument();
    });
  });

  it('shows completed payment status', () => {
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    const mockCreateMoMo = vi.mocked(ApiService.createMoMoPayment);
    mockCreateMoMo.mockResolvedValue({ qrCodeUrl: '', payUrl: '' });
    const mockGetStatus = vi.mocked(ApiService.getMoMoPaymentStatus);
    mockGetStatus.mockResolvedValue({ status: 'completed' });
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
  });

  it('renders total amount in COD view', () => {
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={baseOrderDetails} />);
    expect(screen.getByText(/100\.000đ/)).toBeInTheDocument();
  });

  it('renders total amount in MoMo view', () => {
    const momoDetails = { ...baseOrderDetails, paymentMethod: 'momo' as const };
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={momoDetails} />);
    expect(screen.getByText(/100\.000đ/)).toBeInTheDocument();
  });

  it('calls onClose when clicking backdrop', () => {
    render(<PaymentModal isOpen={true} onClose={onClose} onPaymentSuccess={onPaymentSuccess} orderDetails={baseOrderDetails} />);
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) fireEvent.click(backdrop);
  });
});
