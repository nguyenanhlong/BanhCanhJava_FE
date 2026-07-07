import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from '../components/Logo';

describe('Logo', () => {
  it('renders the restaurant name', () => {
    render(<Logo />);
    expect(screen.getByText('Bánh Canh Cá Lóc')).toBeInTheDocument();
    expect(screen.getByText('Miền Trung')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Logo className="custom-class" />);
    const container = screen.getByText('Bánh Canh Cá Lóc').closest('div');
    expect(container?.parentElement?.className).toContain('custom-class');
  });
});
