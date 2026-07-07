import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverDashboard } from '../components/DriverDashboard';
import { Order, Driver } from '../types';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    getDriverTrips: vi.fn().mockResolvedValue([]),
    getDriverStats: vi.fn().mockResolvedValue(null),
    updateDriverLocation: vi.fn().mockResolvedValue({}),
    updateDriverStatus: vi.fn().mockResolvedValue({}),
    updateDeliveryTripStatus: vi.fn().mockResolvedValue({}),
  },
}));

const mockOrders: Order[] = [
  { id: '101', customerName: 'Nguyễn Văn A', phone: '0909123456', address: '123 Đường ABC', orderType: 'delivery', subtotal: 65000, discountAmount: 0, shippingFee: 10000, totalAmount: 75000, paymentMethod: 'cod', paymentStatus: 'pending', status: 'pending', items: [], createdAt: '2024-01-01T10:00:00Z' },
];

const mockDrivers: Driver[] = [
  { id: '1', userId: 1, name: 'Lê Văn C', phone: '0909777888', vehicle: 'Xe máy', status: 'available', isActive: true },
];

const currentUser = {
  id: '1',
  username: 'driver1',
  email: 'driver@test.com',
  role: 'driver',
  fullName: 'Lê Văn C',
  phone: '0909777888',
};

const defaultProps = {
  orders: mockOrders,
  drivers: mockDrivers,
  currentUser,
  onUpdateOrderStatus: vi.fn(),
  onUpdateDriverStatus: vi.fn(),
  onLogout: vi.fn(),
  isBackendConnected: false,
};

describe('DriverDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
  });

  it('shows driver greeting after loading', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Xin chào, Lê Văn C!')).toBeInTheDocument();
  });

  it('shows driver vehicle info', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Xe máy')).toBeInTheDocument();
  });

  it('shows new orders tab with empty state', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Không có đơn hàng mới')).toBeInTheDocument();
  });

  it('switches to delivering tab', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Xin chào, Lê Văn C!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Đang Giao'));
    expect(screen.getByText('Không có đơn đang giao')).toBeInTheDocument();
  });

  it('switches to history tab', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Xin chào, Lê Văn C!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lịch Sử'));
    expect(screen.getByText('Chưa có lịch sử giao hàng')).toBeInTheDocument();
  });

  it('switches to profile tab', async () => {
    render(<DriverDashboard {...defaultProps} />);
    expect(await screen.findByText('Xin chào, Lê Văn C!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cá Nhân'));
    const nameElements = screen.getAllByText('Lê Văn C');
    expect(nameElements.length).toBeGreaterThan(0);
  });

  it('calls onLogout when logout clicked', async () => {
    const onLogout = vi.fn();
    render(<DriverDashboard {...defaultProps} onLogout={onLogout} />);
    expect(await screen.findByText('Xin chào, Lê Văn C!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cá Nhân'));
    const logoutButtons = screen.getAllByText('Đăng xuất');
    fireEvent.click(logoutButtons[0]);
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
