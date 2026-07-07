import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingSection } from '../components/TrackingSection';

vi.mock('../components/MapComponent', () => ({
  MapComponent: () => <div data-testid="map-component">Map</div>,
}));

const baseOrder = {
  id: 'DH-001', customerName: 'Nguyễn Văn A', phone: '0912345678', address: '123 Street',
  orderType: 'delivery' as const, paymentMethod: 'cod' as const, paymentStatus: 'pending' as const,
  status: 'pending' as const, subtotal: 130000, totalAmount: 130000, shippingFee: 10000,
  discountAmount: 0, items: [{ productName: 'Bánh Canh Cá Lóc', quantity: 2, price: 65000, subtotal: 130000 }],
  createdAt: '2024-01-01T10:00:00Z',
};

const completedOrder = {
  ...baseOrder, id: 'DH-002', status: 'completed' as const, paymentMethod: 'momo' as const,
  paymentStatus: 'paid' as const, subtotal: 55000, totalAmount: 55000, shippingFee: 5000,
  items: [{ productName: 'Bánh Canh Tôm', quantity: 1, price: 55000, subtotal: 55000 }],
  createdAt: '2024-01-02T10:00:00Z',
};

describe('TrackingSection', () => {
  const onSendMessage = vi.fn();
  const onAddReview = vi.fn();
  const onCancelOrder = vi.fn();

  const baseProps = {
    activeOrders: [baseOrder, completedOrder],
    onSendMessage,
    chatHistory: {},
    reviews: [],
    onAddReview,
    currentUser: null,
    onCancelOrder,
    drivers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the tracking header', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText(/Hệ Thống Theo Dõi/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByPlaceholderText('Ví dụ: DH-1002')).toBeInTheDocument();
  });

  it('renders active orders section', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText('Đơn Đang Hoạt Động')).toBeInTheDocument();
  });

  it('renders active order ID in list', () => {
    render(<TrackingSection {...baseProps} />);
    const ids = screen.getAllByText('DH-001');
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  it('renders history section with completed order', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText(/Lịch Sử Mua Hàng/)).toBeInTheDocument();
    const ids = screen.getAllByText('DH-002');
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  it('shows order detail (auto-selected)', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText(/Theo dõi mã đơn/)).toBeInTheDocument();
  });

  it('shows cancel order section for pending orders', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText('Hủy đơn hàng')).toBeInTheDocument();
  });

  it('shows cancel confirmation after clicking Hủy đơn hàng', () => {
    render(<TrackingSection {...baseProps} />);
    fireEvent.click(screen.getByText('Hủy đơn hàng'));
    expect(screen.getByText('Xác nhận hủy')).toBeInTheDocument();
    expect(screen.getByText('Quay lại')).toBeInTheDocument();
  });

  it('calls onCancelOrder when cancel confirmed', () => {
    const props = { ...baseProps, activeOrders: [{ ...baseOrder, id: 'DH-003' }], onCancelOrder };
    render(<TrackingSection {...props} />);
    fireEvent.click(screen.getByText('Hủy đơn hàng'));
    fireEvent.click(screen.getByText('Xác nhận hủy'));
    expect(onCancelOrder).toHaveBeenCalledWith('DH-003');
  });

  it('renders chat section', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText(/Chat trực tuyến/)).toBeInTheDocument();
  });

  it('renders chat input', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByPlaceholderText(/Nhập nội dung tin nhắn/)).toBeInTheDocument();
  });

  it('calls onSendMessage when chat submitted', () => {
    render(<TrackingSection {...baseProps} />);
    const chatInput = screen.getByPlaceholderText(/Nhập nội dung tin nhắn/);
    fireEvent.change(chatInput, { target: { value: 'Cho thêm ớt' } });
    fireEvent.submit(chatInput.closest('form')!);
    expect(onSendMessage).toHaveBeenCalledWith('DH-001', 'Cho thêm ớt');
  });

  it('renders stepper for selected order', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Làm Bánh')).toBeInTheDocument();
    expect(screen.getByText('Đang Giao')).toBeInTheDocument();
    expect(screen.getByText('Thánh vị')).toBeInTheDocument();
  });

  it('renders invoice section for selected order', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByText(/Chi Tiết Hóa Đơn/)).toBeInTheDocument();
    const products = screen.getAllByText(/Bánh Canh Cá Lóc/);
    expect(products.length).toBeGreaterThanOrEqual(1);
  });

  it('shows MapComponent for non-completed orders', () => {
    render(<TrackingSection {...baseProps} />);
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });

  it('shows error when searching non-existent order', () => {
    render(<TrackingSection {...baseProps} />);
    const searchInput = screen.getByPlaceholderText('Ví dụ: DH-1002');
    fireEvent.change(searchInput, { target: { value: 'DH-999' } });
    fireEvent.click(screen.getByText('Tìm'));
    expect(screen.getByText(/Không tìm thấy/)).toBeInTheDocument();
  });

  it('shows driver info when driver assigned', () => {
    const propsWithDriver = {
      ...baseProps,
      activeOrders: [{ ...baseOrder, status: 'shipping' as const, driverId: 'd1' }],
      drivers: [{ id: 'd1', name: 'Nguyễn Hải', phone: '0909123456', vehicle: 'Xe máy', status: 'busy' as const, isActive: true }],
    };
    render(<TrackingSection {...propsWithDriver} />);
    expect(screen.getByText('Nguyễn Hải')).toBeInTheDocument();
  });

  it('renders review section for completed orders', () => {
    render(<TrackingSection {...baseProps} activeOrders={[completedOrder]} />);
    expect(screen.getByText(/Đánh Giá & Nhận Xét/)).toBeInTheDocument();
  });

  it('shows empty state when no active orders', () => {
    render(<TrackingSection {...baseProps} activeOrders={[completedOrder]} />);
    expect(screen.getByText(/Không có đơn hàng nào đang nấu/)).toBeInTheDocument();
  });

  it('shows empty state when no history', () => {
    render(<TrackingSection {...baseProps} activeOrders={[baseOrder]} />);
    expect(screen.getByText(/Chưa có đơn hàng nào hoành thành/)).toBeInTheDocument();
  });
});
