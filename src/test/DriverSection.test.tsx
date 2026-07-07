import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverSection } from '../components/DriverSection';

const mockDrivers = [
  { id: 'd1', name: 'Nguyễn Hải', phone: '0909123456', vehicle: 'Xe máy', status: 'available' as const, isActive: true },
];

const mockOrders = [
  {
    id: 'DH-001', customerName: 'Nguyễn Văn A', phone: '0912345678', address: '123 Street',
    orderType: 'delivery' as const, paymentMethod: 'cod' as const, paymentStatus: 'pending' as const,
    status: 'preparing' as const, subtotal: 130000, totalAmount: 140000, shippingFee: 10000,
    discountAmount: 0, driverId: 'd1',
    items: [{ productName: 'Bánh Canh Cá Lóc', quantity: 2, price: 65000, subtotal: 130000 }],
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'DH-002', customerName: 'Trần Văn B', phone: '0987654321', address: '456 Avenue',
    orderType: 'delivery' as const, paymentMethod: 'cod' as const, paymentStatus: 'paid' as const,
    status: 'completed' as const, subtotal: 55000, totalAmount: 60000, shippingFee: 5000,
    discountAmount: 0, driverId: 'd1',
    items: [{ productName: 'Bánh Canh Tôm', quantity: 1, price: 55000, subtotal: 55000 }],
    createdAt: '2024-01-02T10:00:00Z',
  },
];

const currentDriver = { id: 'd1', username: 'haiship', email: 'hai@test.com', role: 'driver', fullName: 'Nguyễn Hải', phone: '0909123456' };

describe('DriverSection', () => {
  const onUpdateOrderStatus = vi.fn();
  const onUpdateDriverStatus = vi.fn();
  const onLogout = vi.fn();

  const baseProps = {
    orders: mockOrders,
    drivers: mockDrivers,
    currentDriver,
    onUpdateOrderStatus,
    onUpdateDriverStatus,
    onLogout,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders driver header with name', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText(/Xin chào/)).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Hải/)).toBeInTheDocument();
  });

  it('renders status toggle buttons', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText('Rảnh')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('renders stats cards', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText('Đang giao')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu')).toBeInTheDocument();
  });

  it('renders active delivery list', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText('#DH-001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('shows đã giao gần đây section for completed orders', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText(/Đã giao gần đây/)).toBeInTheDocument();
  });

  it('shows delivery detail when order clicked', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    expect(screen.getByText(/Chi tiết đơn hàng/)).toBeInTheDocument();
  });

  it('shows status update buttons in detail view', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    expect(screen.getByText('Đã lấy hàng')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật trạng thái')).toBeInTheDocument();
  });

  it('calls onUpdateOrderStatus when status button clicked', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    fireEvent.click(screen.getByText('Đã lấy hàng'));
    expect(onUpdateOrderStatus).toHaveBeenCalledWith('DH-001', 'picked_up');
  });

  it('renders order items in detail view', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    expect(screen.getByText(/2x Bánh Canh Cá Lóc/)).toBeInTheDocument();
  });

  it('renders back button in detail view', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    const backBtn = document.querySelector('button svg.lucide-x');
    expect(backBtn).toBeInTheDocument();
  });

  it('closes detail view when back clicked', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    const closeBtn = document.querySelector('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(screen.getByText(/Đơn hàng đang giao/)).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<DriverSection {...baseProps} />);
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
  });

  it('calls onLogout when logout clicked', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('Đăng xuất'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows earnings modal when earnings card clicked', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText(/Doanh thu/));
    expect(screen.getByText(/Chi tiết doanh thu/)).toBeInTheDocument();
  });

  it('shows empty state when no active deliveries', () => {
    render(<DriverSection {...baseProps} orders={[mockOrders[1]]} />);
    expect(screen.getByText('Chưa có đơn hàng nào')).toBeInTheDocument();
  });

  it('renders customer info in detail view', () => {
    render(<DriverSection {...baseProps} />);
    fireEvent.click(screen.getByText('#DH-001'));
    expect(screen.getByText('0912345678')).toBeInTheDocument();
  });
});
