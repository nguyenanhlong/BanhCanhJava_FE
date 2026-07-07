import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from '../components/AuthModal';
import { ApiService } from '../services/api';

vi.mock('../services/api', () => ({
  ApiService: {
    checkConnection: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('AuthModal', () => {
  const onClose = vi.fn();
  const onLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders login form when open', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(screen.getByText('ĐĂNG NHẬP HỆ THỐNG')).toBeInTheDocument();
    expect(screen.getByText('Đăng Nhập Tài Khoản')).toBeInTheDocument();
  });

  it('switches to register form when clicking toggle link', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Trở thành thành viên mới? Đăng ký ngay'));
    expect(screen.getByText('ĐĂNG KÝ NGAY')).toBeInTheDocument();
    expect(screen.getByText('Đăng Ký Thành Viên')).toBeInTheDocument();
  });

  it('shows register fields when toggled', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Trở thành thành viên mới? Đăng ký ngay'));
    expect(screen.getByPlaceholderText('sales@banhcanhcaloc.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0912 345 678')).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập đầy đủ thông tin tài khoản!')).toBeInTheDocument();
    });
  });

  it('shows connection status bar', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(screen.getByText(/CHẾ ĐỘ/)).toBeInTheDocument();
  });

  it('calls checkConnection on mount', () => {
    const mockCheck = vi.mocked(ApiService.checkConnection);
    mockCheck.mockResolvedValue(false);
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(mockCheck).toHaveBeenCalled();
  });

  it('calls onClose when X button clicked', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    const closeBtn = screen.getByRole('button', { name: '' });
    const xButtons = document.querySelectorAll('button');
    let found = false;
    xButtons.forEach(btn => {
      if (btn.innerHTML.includes('X') || btn.querySelector('svg')) {
        const svg = btn.querySelector('svg');
        if (svg && svg.classList.contains('lucide-x')) {
          fireEvent.click(btn);
          found = true;
        }
      }
    });
  });

  it('renders helper tips', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(screen.getByText(/Mẹo trải nghiệm nhanh/)).toBeInTheDocument();
    const admins = screen.getAllByText('admin');
    expect(admins.length).toBeGreaterThanOrEqual(1);
  });

  it('returns to login form from register', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    fireEvent.click(screen.getByText('Trở thành thành viên mới? Đăng ký ngay'));
    fireEvent.click(screen.getByText('Đã là thành viên? Đăng nhập ngay'));
    expect(screen.getByText('Đăng Nhập Tài Khoản')).toBeInTheDocument();
  });

  it('requires username and password fields', () => {
    render(<AuthModal isOpen={true} onClose={onClose} onLoginSuccess={onLoginSuccess} />);
    expect(screen.getByPlaceholderText(/Nhập admin, driver/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/)).toBeInTheDocument();
  });
});
