import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../components/Navbar';
import { User } from '../types';

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'customer',
  isActive: true,
};

const mockAdmin: User = {
  id: '2',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
};

const defaultProps = {
  user: null,
  onOpenAuth: vi.fn(),
  onLogout: vi.fn(),
  cartCount: 0,
  onOpenCart: vi.fn(),
  activeTab: 'home',
  setActiveTab: vi.fn(),
  isDarkMode: false,
  onToggleDarkMode: vi.fn(),
};

describe('Navbar', () => {
  it('renders all navigation links', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('Trang Chủ')).toBeInTheDocument();
    expect(screen.getByText('Thực Đơn')).toBeInTheDocument();
    expect(screen.getByText('Về Chúng Tôi')).toBeInTheDocument();
    expect(screen.getByText('Theo Dõi Đơn Hàng')).toBeInTheDocument();
  });

  it('shows login button when no user', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('Đăng Nhập')).toBeInTheDocument();
  });

  it('calls onOpenAuth when login button clicked', () => {
    const onOpenAuth = vi.fn();
    render(<Navbar {...defaultProps} onOpenAuth={onOpenAuth} />);
    fireEvent.click(screen.getByText('Đăng Nhập'));
    expect(onOpenAuth).toHaveBeenCalledOnce();
  });

  it('shows user avatar when logged in', () => {
    render(<Navbar {...defaultProps} user={mockUser} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('shows admin link for admin users', () => {
    render(<Navbar {...defaultProps} user={mockAdmin} />);
    expect(screen.getByText('Quản Lý')).toBeInTheDocument();
  });

  it('calls setActiveTab on nav link click', () => {
    const setActiveTab = vi.fn();
    render(<Navbar {...defaultProps} setActiveTab={setActiveTab} />);
    fireEvent.click(screen.getByText('Thực Đơn'));
    expect(setActiveTab).toHaveBeenCalledWith('menu');
  });

  it('shows cart badge when cartCount > 0', () => {
    render(<Navbar {...defaultProps} cartCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles mobile menu', () => {
    render(<Navbar {...defaultProps} />);
    const menuButton = document.querySelector('.md\\:hidden');
    if (menuButton) {
      fireEvent.click(menuButton);
    }
  });
});
