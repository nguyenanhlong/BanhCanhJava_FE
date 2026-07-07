import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toaster, Toast } from '../components/Toaster';

const mockToasts: Toast[] = [
  { id: '1', message: 'Thành công!', type: 'success', title: 'OK' },
  { id: '2', message: 'Cảnh báo!', type: 'warning' },
  { id: '3', message: 'Thông tin', type: 'info', title: 'Info' },
  { id: '4', message: 'Lỗi!', type: 'error' },
];

describe('Toaster', () => {
  it('renders all toasts', () => {
    render(<Toaster toasts={mockToasts} onClose={vi.fn()} />);
    expect(screen.getByText('Thành công!')).toBeInTheDocument();
    expect(screen.getByText('Cảnh báo!')).toBeInTheDocument();
    expect(screen.getByText('Thông tin')).toBeInTheDocument();
    expect(screen.getByText('Lỗi!')).toBeInTheDocument();
  });

  it('renders toast titles', () => {
    render(<Toaster toasts={mockToasts} onClose={vi.fn()} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('calls onClose when dismiss button clicked', () => {
    const onClose = vi.fn();
    render(<Toaster toasts={mockToasts} onClose={onClose} />);
    const dismissButtons = screen.getAllByRole('button');
    fireEvent.click(dismissButtons[0]);
    expect(onClose).toHaveBeenCalledWith('1');
  });
});
