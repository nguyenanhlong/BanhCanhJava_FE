import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSection } from '../components/ProfileSection';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    updateUser: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../services/membership', () => ({
  getUserTier: vi.fn(() => ({ id: 1, name: 'member', displayName: 'Thành viên', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 })),
  MEMBERSHIP_TIERS: [
    { id: 1, name: 'member', displayName: 'Thành viên', minTotalSpent: 0, minTotalOrders: 0, autoDiscountPercent: 0, voucherCount: 0, voucherDiscountPercent: 0 },
    { id: 2, name: 'loyal', displayName: 'Thân thiết', minTotalSpent: 2000000, minTotalOrders: 10, autoDiscountPercent: 3, voucherCount: 2, voucherDiscountPercent: 10 },
    { id: 3, name: 'vip', displayName: 'VIP', minTotalSpent: 10000000, minTotalOrders: 50, autoDiscountPercent: 7, voucherCount: 4, voucherDiscountPercent: 15 },
  ],
  formatVND: vi.fn((amount: number) => `${amount.toLocaleString('vi-VN')}₫`),
  getVouchersForTier: vi.fn(() => Promise.resolve([])),
  claimVoucher: vi.fn(() => Promise.resolve(null)),
  calculateAutoDiscount: vi.fn(() => 0),
}));

const baseUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'customer' as const,
  fullName: 'Nguyễn Văn A',
  phone: '0912345678',
  address: '123 Đường ABC, Quận 1',
  avatarUrl: '',
  isActive: true,
  total_spent: 500000,
  total_orders: 5,
};

describe('ProfileSection', () => {
  const onUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user name and username', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    const names = screen.getAllByText('Nguyễn Văn A');
    expect(names.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('renders email', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders phone number', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('0912345678')).toBeInTheDocument();
  });

  it('renders address', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText(/123 Đường ABC/)).toBeInTheDocument();
  });

  it('renders order count stat', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} orderCount={10} />);
    const orderStat = screen.getAllByText('10');
    expect(orderStat.length).toBeGreaterThanOrEqual(1);
  });

  it('renders edit button', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('Chỉnh Sửa')).toBeInTheDocument();
  });

  it('enters edit mode when clicking Chỉnh Sửa', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    fireEvent.click(screen.getByText('Chỉnh Sửa'));
    const inputs = screen.getAllByDisplayValue('Nguyễn Văn A');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Lưu')).toBeInTheDocument();
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('allows editing full name', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    fireEvent.click(screen.getByText('Chỉnh Sửa'));
    const inputs = screen.getAllByDisplayValue('Nguyễn Văn A');
    const nameInput = inputs[0];
    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } });
    expect(nameInput).toHaveValue('Nguyễn Văn B');
  });

  it('shows change password section when clicking Đổi Mật Khẩu', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    fireEvent.click(screen.getByText('Đổi Mật Khẩu'));
    expect(screen.getByText('Cập Nhật Mật Khẩu')).toBeInTheDocument();
    expect(screen.getByText('Hủy')).toBeInTheDocument();
  });

  it('renders membership tier section', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('Ưu Đãi Hạng Thành Viên')).toBeInTheDocument();
  });

  it('renders security section', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('Bảo Mật')).toBeInTheDocument();
  });

  it('calls onUpdateUser when saving in offline mode', async () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    fireEvent.click(screen.getByText('Chỉnh Sửa'));
    fireEvent.click(screen.getByText('Lưu'));
    await waitFor(() => {
      expect(onUpdateUser).toHaveBeenCalled();
    });
  });

  it('displays user initial when no avatar', () => {
    render(<ProfileSection user={baseUser} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('shows avatar image when avatarUrl exists', () => {
    const userWithAvatar = { ...baseUser, avatarUrl: 'http://example.com/avatar.jpg' };
    const { container } = render(<ProfileSection user={userWithAvatar} isBackendConnected={false} onUpdateUser={onUpdateUser} />);
    const imgs = container.querySelectorAll('img');
    const avatar = Array.from(imgs).find(img => img.getAttribute('src') === 'http://example.com/avatar.jpg');
    expect(avatar).toBeInTheDocument();
  });
});
