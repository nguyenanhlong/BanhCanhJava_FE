import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Hero } from '../components/Hero';

describe('Hero', () => {
  const baseProps = { onOrderNow: vi.fn() };

  it('renders hero section with title', () => {
    render(<Hero {...baseProps} />);
    expect(screen.getByText(/Thưởng thức hương vị/)).toBeInTheDocument();
  });

  it('renders free shipping badge', () => {
    render(<Hero {...baseProps} />);
    expect(screen.getByText('Miễn phí giao hàng')).toBeInTheDocument();
  });

  it('renders Đặt món ngay button', () => {
    render(<Hero {...baseProps} />);
    expect(screen.getByText('Đặt món ngay giảm 20%')).toBeInTheDocument();
  });

  it('calls onOrderNow when button clicked', () => {
    render(<Hero {...baseProps} />);
    fireEvent.click(screen.getByText('Đặt món ngay giảm 20%'));
    expect(baseProps.onOrderNow).toHaveBeenCalledTimes(1);
  });

  it('renders stat badges', () => {
    render(<Hero {...baseProps} />);
    expect(screen.getByText(/20\+/)).toBeInTheDocument();
    expect(screen.getByText(/5\.000\+/)).toBeInTheDocument();
    expect(screen.getByText(/25 Năm/)).toBeInTheDocument();
  });

  it('renders Tìm hiểu link', () => {
    render(<Hero {...baseProps} />);
    const link = screen.getByText('Tìm hiểu bí quyết truyền nghề');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '#about-section');
  });
});
