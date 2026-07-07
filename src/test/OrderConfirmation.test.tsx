import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderConfirmation } from '../components/OrderConfirmation';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    getDeliveryAreas: vi.fn(),
    validatePromotion: vi.fn(),
    getVouchers: vi.fn(),
  },
}));

vi.mock('../services/membership', () => ({
  getUserTier: vi.fn(() => ({ id: 1, name: 'member', displayName: 'Thành viên', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 })),
  calculateAutoDiscount: vi.fn(() => 0),
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  cartItems: [
    { product: { id: '1', name: 'Bánh Canh Cá Lóc', price: 65000, description: '', isBestSeller: true, isAvailable: true, imageUrl: '', preparationTime: 10 }, quantity: 2, selectedOptions: [] },
  ],
  user: null,
  totalAmount: 130000,
};

describe('OrderConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockAreas = vi.mocked(ApiService.getDeliveryAreas);
    mockAreas.mockResolvedValue([{ id: 1, name: 'Quận 1', baseFee: 10000, isActive: true, centerLat: 10.77, centerLng: 106.7, radiusKm: 5, feePerKm: 3000, maxDistanceKm: 10, createdAt: '' }]);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<OrderConfirmation {...baseProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders order items summary', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByText(/Đơn hàng/)).toBeInTheDocument();
    expect(screen.getByText('Bánh Canh Cá Lóc')).toBeInTheDocument();
    expect(screen.getByText(/Xác Nhận Đơn Hàng/)).toBeInTheDocument();
  });

  it('renders delivery info fields', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByPlaceholderText('Nhập tên người nhận')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập số điện thoại')).toBeInTheDocument();
  });

  it('shows promo code section', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByText('Mã Giảm Giá')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập mã (VD: HUEMON)')).toBeInTheDocument();
  });

  it('shows payment method options', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByText('Tiền mặt khi nhận hàng (COD)')).toBeInTheDocument();
    expect(screen.getByText('Ví MoMo (Quét QR)')).toBeInTheDocument();
  });

  it('shows invoice breakdown', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByText(/Chi Tiết Hóa Đơn/)).toBeInTheDocument();
    const prices = screen.getAllByText(/130\.000đ/);
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when fields empty and confirm clicked', () => {
    render(<OrderConfirmation {...baseProps} />);
    const confirmBtn = screen.getByText(/Xác Nhận & Đặt Hàng/);
    expect(confirmBtn).toBeDisabled();
  });

  it('validates phone number format', () => {
    render(<OrderConfirmation {...baseProps} />);
    const phoneInput = screen.getByPlaceholderText('Nhập số điện thoại');
    fireEvent.change(phoneInput, { target: { value: '123' } });
    expect(screen.getByText(/SĐT phải là 10 số/)).toBeInTheDocument();
  });

  it('shows use account info button when user provided', () => {
    const mockGetVouchers = vi.mocked(ApiService.getVouchers);
    mockGetVouchers.mockResolvedValue([]);
    const propsWithUser = { ...baseProps, user: { id: '1', username: 'test', email: 'test@test.com', role: 'customer' as const, isActive: true } };
    render(<OrderConfirmation {...propsWithUser} />);
    expect(screen.getByText('Sử dụng thông tin từ tài khoản')).toBeInTheDocument();
  });

  it('shows Chỉnh sửa and Xác Nhận buttons', () => {
    render(<OrderConfirmation {...baseProps} />);
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
    expect(screen.getByText(/Xác Nhận & Đặt Hàng/)).toBeInTheDocument();
  });

  it('calls onClose when Chỉnh sửa clicked', () => {
    render(<OrderConfirmation {...baseProps} />);
    fireEvent.click(screen.getByText('Chỉnh sửa'));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows voucher section when user provided', () => {
    const mockGetVouchers = vi.mocked(ApiService.getVouchers);
    mockGetVouchers.mockResolvedValue([]);
    const propsWithUser = { ...baseProps, user: { id: '1', username: 'test', email: 'test@test.com', role: 'customer' as const, isActive: true } };
    render(<OrderConfirmation {...propsWithUser} />);
    expect(screen.getByText('Voucher Thành Viên')).toBeInTheDocument();
  });
});
