import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartDrawer } from '../components/CartDrawer';
import { CartItem, User } from '../types';

const mockProduct1 = {
  id: 'p1',
  name: 'Bánh Canh Cá Lóc',
  description: 'Ngon',
  price: 65000,
  categoryName: 'Bánh Canh Cá Lóc',
  isBestSeller: true,
  isAvailable: true,
  imageUrl: '',
  preparationTime: 15,
};

const mockProduct2 = {
  id: 'p2',
  name: 'Trà Đá',
  description: 'Mát lạnh',
  price: 5000,
  categoryName: 'Đồ Uống',
  isBestSeller: false,
  isAvailable: true,
  imageUrl: '',
  preparationTime: 5,
};

const mockCartItems: CartItem[] = [
  { product: mockProduct1, quantity: 2 },
  { product: mockProduct2, quantity: 1, selectedOptions: [{ optionId: 1, name: 'Không đường', optionGroup: 'sugar', price: 0 }] },
];

const mockUser: User = {
  id: 'u1',
  username: 'test',
  email: 'test@test.com',
  role: 'customer',
  isActive: true,
  total_spent: 5000000,
  total_orders: 20,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  cartItems: [],
  onUpdateQuantity: vi.fn(),
  onRemoveItem: vi.fn(),
  user: null,
  onOpenConfirmation: vi.fn(),
};

describe('CartDrawer', () => {
  it('returns null when not open', () => {
    const { container } = render(<CartDrawer {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows empty cart message', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
  });

  it('renders cart items', () => {
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} />);
    expect(screen.getByText('Bánh Canh Cá Lóc')).toBeInTheDocument();
    expect(screen.getByText('Trà Đá')).toBeInTheDocument();
  });

  it('shows selected options', () => {
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} />);
    expect(screen.getByText(/Không đường/)).toBeInTheDocument();
  });

  it('shows total amount', () => {
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} />);
    const elements = screen.getAllByText('135.000 đ');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('calls onOpenConfirmation on checkout', () => {
    const onOpenConfirmation = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} onOpenConfirmation={onOpenConfirmation} />);
    fireEvent.click(screen.getByText(/Tiến Hành Đặt Hàng/));
    expect(onOpenConfirmation).toHaveBeenCalledOnce();
  });

  it('disables checkout button when cart empty', () => {
    render(<CartDrawer {...defaultProps} />);
    const btn = screen.getByText(/Tiến Hành Đặt Hàng/);
    expect(btn).toBeDisabled();
  });

  it('shows membership discount for logged-in users', () => {
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} user={mockUser} />);
    expect(screen.getByText(/Giảm hạng thành viên/)).toBeInTheDocument();
  });

  it('calls onUpdateQuantity when + is clicked', () => {
    const onUpdateQuantity = vi.fn();
    render(<CartDrawer {...defaultProps} cartItems={mockCartItems} onUpdateQuantity={onUpdateQuantity} />);
    const plusButtons = screen.getAllByText('+');
    fireEvent.click(plusButtons[0]);
    expect(onUpdateQuantity).toHaveBeenCalledWith(0, 3);
  });
});
