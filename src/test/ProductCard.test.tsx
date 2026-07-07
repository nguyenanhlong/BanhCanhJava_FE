import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../components/ProductCard';
import { Product, ProductOption, ProductReview } from '../types';



const mockProduct: Product = {
  id: '1',
  name: 'Bánh Canh Cá Lóc Đặc Biệt',
  description: 'Tô bánh canh đầy đặn với cá lóc tươi',
  price: 65000,
  categoryName: 'Bánh Canh Cá Lóc',
  isBestSeller: true,
  isAvailable: true,
  imageUrl: '',
  preparationTime: 15,
};

const mockUnavailableProduct: Product = {
  ...mockProduct,
  isAvailable: false,
  isBestSeller: false,
};

const mockReviews: ProductReview[] = [
  { id: 'r1', orderId: 'o1', productName: 'Bánh Canh Cá Lóc Đặc Biệt', customerName: 'Nguyễn Văn A', rating: 5, comment: 'Tuyệt vời!', createdAt: '2024-01-01' },
  { id: 'r2', orderId: 'o2', productName: 'Bánh Canh Cá Lóc Đặc Biệt', customerName: 'Trần Thị B', rating: 4, comment: 'Ngon', createdAt: '2024-01-02' },
];

const mockOptions: ProductOption[] = [
  { id: 1, productId: 1, name: 'Sợi bánh thường', optionGroup: 'noodle', price: 0, isRequired: true, isActive: true, displayOrder: 1 },
  { id: 2, productId: 1, name: 'Sợi bánh gạo lứt', optionGroup: 'noodle', price: 5000, isRequired: true, isActive: true, displayOrder: 2 },
  { id: 3, productId: 1, name: 'Thêm chả cá', optionGroup: 'topping', price: 10000, isRequired: false, isActive: true, displayOrder: 3 },
];

const defaultProps = {
  product: mockProduct,
  onAddToCart: vi.fn(),
  reviews: [],
  productOptions: [],
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Bánh Canh Cá Lóc Đặc Biệt')).toBeInTheDocument();
    expect(screen.getByText('65.000 đ')).toBeInTheDocument();
  });

  it('shows best seller badge', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Bán Chạy')).toBeInTheDocument();
  });

  it('shows out of stock badge for unavailable products', () => {
    render(<ProductCard {...defaultProps} product={mockUnavailableProduct} />);
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
  });

  it('shows review count and rating', () => {
    render(<ProductCard {...defaultProps} reviews={mockReviews} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(2 đánh giá)')).toBeInTheDocument();
  });

  it('shows options panel when clicking add for main product', () => {
    render(<ProductCard {...defaultProps} productOptions={mockOptions} />);
    fireEvent.click(screen.getByText('Thêm'));
    expect(screen.getByText('Sợi bánh thường')).toBeInTheDocument();
    expect(screen.getAllByText(/Xác Nhận Thêm/).length).toBeGreaterThan(0);
  });

  it('calls onAddToCart when confirming with required options', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard {...defaultProps} onAddToCart={onAddToCart} productOptions={mockOptions} />);
    fireEvent.click(screen.getByText('Thêm'));
    fireEvent.click(screen.getByText('Sợi bánh thường'));
    fireEvent.click(screen.getAllByText(/Xác Nhận Thêm/)[0]);
    expect(onAddToCart).toHaveBeenCalled();
  });
});
