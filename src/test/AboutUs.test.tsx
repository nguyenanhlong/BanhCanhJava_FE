import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AboutUs } from '../components/AboutUs';

describe('AboutUs', () => {
  it('renders the section with id', () => {
    const { container } = render(<AboutUs />);
    expect(container.querySelector('#about-section')).toBeInTheDocument();
  });

  it('renders main heading', () => {
    render(<AboutUs />);
    expect(screen.getByText(/Hành Trình Gửi Gắm/)).toBeInTheDocument();
  });

  it('renders all 4 highlights', () => {
    render(<AboutUs />);
    expect(screen.getByText('Hương Vị Củ Nén Đặc Trưng')).toBeInTheDocument();
    expect(screen.getByText('Cá Lóc Đồng Sạch Sẽ')).toBeInTheDocument();
    expect(screen.getByText('Lựa Chọn Sợi Bánh Độc Bản')).toBeInTheDocument();
    expect(screen.getByText('Tự hào Thương hiệu Việt')).toBeInTheDocument();
  });

  it('renders story section', () => {
    render(<AboutUs />);
    expect(screen.getByText(/Bảo tồn cốt cách/)).toBeInTheDocument();
  });

  it('renders stats', () => {
    render(<AboutUs />);
    expect(screen.getByText('1998')).toBeInTheDocument();
    expect(screen.getByText('20+')).toBeInTheDocument();
    expect(screen.getByText('5.000+')).toBeInTheDocument();
    expect(screen.getByText('15+')).toBeInTheDocument();
  });

  it('renders the quote', () => {
    render(<AboutUs />);
    expect(screen.getByText(/húp muỗng súp nóng/)).toBeInTheDocument();
  });
});
