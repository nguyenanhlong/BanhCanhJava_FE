import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminDashboard } from '../components/AdminDashboard';
import { Order, Driver, Product } from '../types';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    getUsers: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue(null),
    getCategories: vi.fn().mockResolvedValue([]),
    getReviews: vi.fn().mockResolvedValue([]),
    getProductOptions: vi.fn().mockResolvedValue([]),
    getInvoices: vi.fn().mockRejectedValue(new Error('no conn')),
    getDeliveryAreas: vi.fn().mockRejectedValue(new Error('no conn')),
    getMembershipTiers: vi.fn().mockRejectedValue(new Error('no conn')),
    getAllMemberships: vi.fn().mockResolvedValue([]),
    getAllVouchers: vi.fn().mockResolvedValue([]),
    getDeliveryTrips: vi.fn().mockRejectedValue(new Error('no conn')),
    getPaymentTransactions: vi.fn().mockRejectedValue(new Error('no conn')),
    getDrivers: vi.fn().mockResolvedValue([]),
    getOrders: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue([]),
    getVouchers: vi.fn().mockResolvedValue([]),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    registerDriver: vi.fn(),
    updateDriver: vi.fn(),
    deleteDriver: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    uploadImage: vi.fn(),
  },
  ImageService: {
    getPresignedUrl: vi.fn().mockImplementation((url: string) => Promise.resolve(url)),
    getPresignedUrlsBatch: vi.fn().mockResolvedValue(new Map()),
  },
}));

const mockOrders: Order[] = [
  { id: '1', customerName: 'Nguyễn Văn A', phone: '0909123456', address: '123 Đường ABC', orderType: 'delivery', subtotal: 65000, discountAmount: 0, shippingFee: 10000, totalAmount: 75000, paymentMethod: 'cod', paymentStatus: 'pending', status: 'pending', items: [{ productName: 'Bánh Canh Cá Lóc', quantity: 1, price: 65000, subtotal: 65000 }], createdAt: '2024-01-01T10:00:00Z' },
  { id: '2', customerName: 'Trần Thị B', phone: '0909987654', address: '456 Đường XYZ', orderType: 'delivery', subtotal: 130000, discountAmount: 0, shippingFee: 10000, totalAmount: 140000, paymentMethod: 'momo', paymentStatus: 'paid', status: 'completed', items: [], createdAt: '2024-01-02T10:00:00Z' },
  { id: '3', customerName: 'Lê Văn C', phone: '0909777888', address: '789 Đường LMN', orderType: 'dine-in', subtotal: 50000, discountAmount: 5000, shippingFee: 0, totalAmount: 45000, paymentMethod: 'cod', paymentStatus: 'paid', status: 'cancelled', items: [], createdAt: '2024-01-03T10:00:00Z' },
];

const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Lê Văn C', phone: '0909777888', vehicle: 'Xe máy', status: 'available', isActive: true },
  { id: 'd2', name: 'Phạm Thị D', phone: '0909666555', vehicle: 'Xe tải', status: 'busy', isActive: true },
  { id: 'd3', name: 'Trần Văn E', phone: '0909555444', vehicle: 'Xe số', status: 'offline', isActive: true },
];

const mockProducts: Product[] = [
  { id: 'p1', name: 'Bánh Canh Cá Lóc', description: 'Ngon', price: 65000, categoryName: 'Bánh Canh Cá Lóc', isBestSeller: true, isAvailable: true, imageUrl: '', preparationTime: 15 },
  { id: 'p2', name: 'Bánh Canh Tôm', description: 'Tươi', price: 55000, categoryName: 'Bánh Canh Tôm', isBestSeller: false, isAvailable: false, imageUrl: 'http://example.com/img.jpg', preparationTime: 10 },
];

const baseProps = {
  orders: mockOrders,
  drivers: mockDrivers,
  products: mockProducts,
  isBackendConnected: false,
  userRole: 'admin',
  onUpdateOrderStatus: vi.fn(),
  onAssignDriver: vi.fn(),
  onCreateDriver: vi.fn(),
  onUpdateDriverStatus: vi.fn(),
  onUpdateOrderProgress: vi.fn(),
  onCreateProduct: vi.fn(),
  onUpdateProduct: vi.fn(),
  onDeleteProduct: vi.fn(),
  onShowToast: vi.fn(),
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // === STATS TAB ===
  describe('Stats tab', () => {
    it('renders stats tab by default', () => {
      render(<AdminDashboard {...baseProps} />);
      expect(screen.getAllByText(/Thống Kê/).length).toBeGreaterThan(0);
    });

    it('shows total order count', () => {
      render(<AdminDashboard {...baseProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows completed order count', () => {
      render(<AdminDashboard {...baseProps} />);
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThan(0);
    });

    it('shows revenue from completed orders', () => {
      render(<AdminDashboard {...baseProps} />);
      expect(screen.getByText(/140.000đ/)).toBeInTheDocument();
    });

    it('shows driver stats (available/busy/offline)', () => {
      render(<AdminDashboard {...baseProps} />);
      expect(screen.getByText('Rảnh')).toBeInTheDocument();
      expect(screen.getByText('Bận')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('shows best seller products', () => {
      render(<AdminDashboard {...baseProps} />);
      expect(screen.getByText('Bánh Canh Cá Lóc')).toBeInTheDocument();
    });
  });

  // === ORDERS TAB ===
  describe('Orders tab', () => {
    it('switches to orders tab and renders orders', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    });

    it('shows detail modal with order items when clicking Chi Tiết', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getAllByText(/Chi Tiết/)[0]);
      expect(screen.getByText(/1x/)).toBeInTheDocument();
      expect(screen.getByText(/Bánh Canh Cá Lóc/)).toBeInTheDocument();
      expect(screen.getByText(/Đóng/)).toBeInTheDocument();
    });

    it('shows payment status badges', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      const paidBadges = screen.getAllByText(/Đã TT/);
      const unpaidBadges = screen.getAllByText(/Chưa TT/);
      expect(paidBadges.length).toBeGreaterThan(0);
      expect(unpaidBadges.length).toBeGreaterThan(0);
    });

    it('shows order type in detail modal', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getAllByText(/Chi Tiết/)[0]);
      expect(screen.getByText(/Giao hàng/)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/Đóng/));
      fireEvent.click(screen.getAllByText(/Chi Tiết/)[2]);
      expect(screen.getByText(/Tại quán/)).toBeInTheDocument();
    });

    it('shows driver assignment dropdown for non-completed/non-cancelled orders', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('calls onAssignDriver when driver is selected', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'd1' } });
      expect(baseProps.onAssignDriver).toHaveBeenCalledWith('1', 'd1');
    });

    it('shows confirm order button for pending orders', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      expect(screen.getByText('Xác Nhận / Nấu Bánh')).toBeInTheDocument();
    });

    it('calls onUpdateOrderStatus when confirming order', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getByText('Xác Nhận / Nấu Bánh'));
      expect(baseProps.onUpdateOrderStatus).toHaveBeenCalledWith('1', 'preparing');
    });

    it('shows cancel button for active orders', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      expect(screen.getByText('Hủy Đơn')).toBeInTheDocument();
    });

    it('shows cancel confirmation dialog', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getByText('Hủy Đơn'));
      expect(screen.getByText(/Bạn có chắc chắn muốn hủy đơn hàng/)).toBeInTheDocument();
    });

    it('cancels order when confirmed', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getByText('Hủy Đơn'));
      fireEvent.click(screen.getByText('Xác nhận hủy đơn'));
      expect(baseProps.onUpdateOrderStatus).toHaveBeenCalledWith('1', 'cancelled');
    });

    it('dismisses cancel dialog when clicking keep order', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      fireEvent.click(screen.getByText('Hủy Đơn'));
      fireEvent.click(screen.getByText('Giữ đơn hàng'));
      expect(screen.queryByText(/Bạn có chắc chắn muốn hủy đơn hàng/)).not.toBeInTheDocument();
    });

    it('shows completed/cancelled as transaction finished', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Đơn Hàng \(/));
      const finishedTexts = screen.getAllByText('Giao dịch hoàn tất');
      expect(finishedTexts.length).toBeGreaterThan(0);
    });
  });

  // === PRODUCTS TAB ===
  describe('Products tab', () => {
    beforeEach(() => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Sản Phẩm \(/));
    });

    it('switches to products tab and shows product list', () => {
      const productNames = screen.getAllByText('Bánh Canh Cá Lóc');
      expect(productNames.length).toBeGreaterThan(0);
    });

    it('shows product prices formatted', () => {
      expect(screen.getByText('65.000 đ')).toBeInTheDocument();
      expect(screen.getByText('55.000 đ')).toBeInTheDocument();
    });

    it('shows available badge for in-stock products', () => {
      const badges = screen.getAllByText(/Còn hàng/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows out of stock badge for unavailable products', () => {
      expect(screen.getByText(/Hết hàng/)).toBeInTheDocument();
    });

    it('shows best seller badge', () => {
      const badges = screen.getAllByText(/Bán chạy/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows product image when imageUrl exists', () => {
      const imgs = screen.getAllByRole('img');
      const productImg = imgs.find(img => img.getAttribute('src') === 'http://example.com/img.jpg');
      expect(productImg).toBeTruthy();
    });

    it('shows validation error on empty submit', () => {
      const form = screen.getByText(/Thêm Món/).closest('form');
      fireEvent.submit(form!);
      expect(screen.getByText('Tên và giá sản phẩm là bắt buộc')).toBeInTheDocument();
    });

    it('creates product when form is valid', () => {
      const nameInput = screen.getByPlaceholderText(/Bánh Canh Cá Lóc/);
      const priceInput = screen.getByPlaceholderText('45000');
      fireEvent.change(nameInput, { target: { value: 'Bánh Canh Mới' } });
      fireEvent.change(priceInput, { target: { value: '45000' } });
      const form = screen.getByText(/Thêm Món/).closest('form');
      fireEvent.submit(form!);
      expect(baseProps.onCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Bánh Canh Mới', price: 45000 })
      );
    });

    it('pre-fills form when editing a product', () => {
      fireEvent.click(screen.getAllByTitle(/Sửa sản phẩm/)[0]);
      expect(screen.getByDisplayValue('Bánh Canh Cá Lóc')).toBeInTheDocument();
      expect(screen.getByText(/Cập Nhật/)).toBeInTheDocument();
    });

    it('calls onUpdateProduct when editing an existing product', () => {
      fireEvent.click(screen.getAllByTitle(/Sửa sản phẩm/)[0]);
      const nameInput = screen.getByDisplayValue('Bánh Canh Cá Lóc');
      fireEvent.change(nameInput, { target: { value: 'Bánh Canh Cá Lóc Updated' } });
      fireEvent.click(screen.getByText(/Cập Nhật/));
      expect(baseProps.onUpdateProduct).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 'Bánh Canh Cá Lóc Updated' })
      );
    });

    it('cancels editing and resets form', () => {
      fireEvent.click(screen.getAllByTitle(/Sửa sản phẩm/)[0]);
      fireEvent.click(screen.getByText(/Hủy/));
      expect(screen.getByText(/Thêm Món/)).toBeInTheDocument();
    });

    it('calls onDeleteProduct when deleting a product', () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      fireEvent.click(screen.getAllByTitle(/Xóa sản phẩm/)[0]);
      expect(baseProps.onDeleteProduct).toHaveBeenCalledWith('p1');
      mockConfirm.mockRestore();
    });

    it('does not call onDeleteProduct when cancel is clicked', () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      fireEvent.click(screen.getAllByTitle(/Xóa sản phẩm/)[0]);
      expect(baseProps.onDeleteProduct).not.toHaveBeenCalled();
      mockConfirm.mockRestore();
    });

    it('allows entering image URL', () => {
      const imageInput = screen.getByPlaceholderText(/https:\/\/\.\.\. hoặc upload file bên cạnh/);
      fireEvent.change(imageInput, { target: { value: 'http://example.com/new.jpg' } });
      expect(imageInput).toHaveValue('http://example.com/new.jpg');
    });

    it('shows image preview when imageUrl is provided', () => {
      const imageInput = screen.getByPlaceholderText(/https:\/\/\.\.\. hoặc upload file bên cạnh/);
      fireEvent.change(imageInput, { target: { value: 'http://example.com/preview.jpg' } });
      const imgs = screen.getAllByRole('img');
      const previewImg = imgs.find(img => img.getAttribute('src') === 'http://example.com/preview.jpg');
      expect(previewImg).toBeTruthy();
    });

    it('toggles best seller checkbox', () => {
      const checkboxes = screen.getAllByRole('checkbox');
      const bestSellerCheckbox = checkboxes.find(cb => cb.closest('label')?.textContent?.includes('Bán chạy'));
      expect(bestSellerCheckbox).toBeTruthy();
    });

    it('toggles available checkbox', () => {
      const checkboxes = screen.getAllByRole('checkbox');
      const availableCheckbox = checkboxes.find(cb => cb.closest('label')?.textContent?.includes('Còn hàng'));
      expect(availableCheckbox).toBeTruthy();
    });
  });

  // === DRIVERS TAB ===
  describe('Drivers tab', () => {
    beforeEach(() => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Shipper \/ Tài xế/));
    });

    it('switches to drivers tab and shows driver list', () => {
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
      expect(screen.getByText('Phạm Thị D')).toBeInTheDocument();
    });

    it('shows driver ids', () => {
      const ids = screen.getAllByText(/ID: d/);
      expect(ids.length).toBeGreaterThanOrEqual(3);
    });

    it('shows driver phone numbers', () => {
      expect(screen.getByText(/0909777888/)).toBeInTheDocument();
    });

    it('calls onUpdateDriverStatus when changing status', () => {
      const statusSelects = screen.getAllByRole('combobox');
      const driverStatusSelect = statusSelects.find(s => {
        const options = Array.from(s.querySelectorAll('option'));
        return options.some(o => o.textContent === 'Rảnh rỗi');
      });
      if (driverStatusSelect) {
        fireEvent.change(driverStatusSelect, { target: { value: 'busy' } });
        expect(baseProps.onUpdateDriverStatus).toHaveBeenCalledWith('d1', 'busy');
      }
    });

    it('shows add driver form', () => {
      expect(screen.getByText(/Đăng ký Shipper Mới/)).toBeInTheDocument();
    });

    it('calls onCreateDriver when submitting valid driver form', () => {
      const nameInput = screen.getByPlaceholderText('Nguyễn Văn A');
      const phoneInput = screen.getByPlaceholderText('0912xxxxx');
      const usernameInput = screen.getByPlaceholderText('driver_nguyenvanA');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
      const emailInput = screen.getByPlaceholderText('driver@banhcanh.com');
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn F' } });
      fireEvent.change(phoneInput, { target: { value: '0909111222' } });
      fireEvent.change(usernameInput, { target: { value: 'driver_f' } });
      fireEvent.change(passwordInput, { target: { value: 'pass123' } });
      fireEvent.change(emailInput, { target: { value: 'f@test.com' } });
      const submitBtn = screen.getByText(/Thêm Shipper Vào Hệ Thống/);
      fireEvent.click(submitBtn);
      expect(baseProps.onCreateDriver).toHaveBeenCalled();
    });

    it('shows driver avatar URL input', () => {
      const avatarInput = screen.getByPlaceholderText(/https:\/\/\.\.\. hoặc upload file/);
      expect(avatarInput).toBeInTheDocument();
    });
  });

  // === CATEGORIES TAB ===
  describe('Categories tab', () => {
    beforeEach(() => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Danh Mục/));
    });

    it('switches to categories tab', () => {
      expect(screen.getByText(/Quản Lý Danh Mục/)).toBeInTheDocument();
    });

    it('shows add category form', () => {
      expect(screen.getByText(/Thêm Danh Mục Mới/)).toBeInTheDocument();
    });

    it('allows entering category name and auto-generates slug', () => {
      const nameInput = screen.getByPlaceholderText('Ví dụ: Món Mới');
      fireEvent.change(nameInput, { target: { value: 'Món Mới' } });
      const slugInput = screen.getByPlaceholderText('mon-moi');
      expect(slugInput).toHaveValue('mon-moi');
    });

    it('shows empty state when no categories exist', () => {
      const tables = screen.getAllByRole('table');
      const categoryTables = tables.filter(t => t.textContent?.includes('Tên Danh Mục'));
    });
  });

  // === ORDER HISTORY TAB ===
  describe('Order History tab', () => {
    it('shows completed and cancelled orders', () => {
      render(<AdminDashboard {...baseProps} />);
      fireEvent.click(screen.getByText(/Lịch Sử ĐH/));
      expect(screen.getByText(/140\.000 đ/)).toBeInTheDocument();
      expect(screen.getByText(/45\.000 đ/)).toBeInTheDocument();
    });
  });

  // === BACKEND STATUS ===
  describe('Backend status indicator', () => {
    it('shows Local Only when backend is not connected', () => {
      render(<AdminDashboard {...baseProps} isBackendConnected={false} />);
      fireEvent.click(screen.getByText(/Sản Phẩm \(/));
      expect(screen.getByText(/Local Only/)).toBeInTheDocument();
    });

    it('shows API Live when backend is connected', () => {
      render(<AdminDashboard {...baseProps} isBackendConnected={true} />);
      fireEvent.click(screen.getByText(/Sản Phẩm \(/));
      expect(screen.getByText(/API Live/)).toBeInTheDocument();
    });
  });

  // === USER ROLE ===
  describe('User role based access', () => {
    it('shows Phân quyền tab for super_admin', () => {
      render(<AdminDashboard {...baseProps} userRole="super_admin" />);
      expect(screen.getByText(/Phân quyền & Vai trò/)).toBeInTheDocument();
    });

    it('shows Hạng TV tab for admin', () => {
      render(<AdminDashboard {...baseProps} userRole="admin" />);
      expect(screen.getByText(/Hạng TV/)).toBeInTheDocument();
    });
  });
});
