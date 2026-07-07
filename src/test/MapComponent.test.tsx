import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapComponent } from '../components/MapComponent';

const mockMap = {
  setView: vi.fn(),
  remove: vi.fn(),
};

const mockTileLayer = { addTo: vi.fn() };
const mockMarker = { addTo: vi.fn() };

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => mockMarker),
    Map: vi.fn(),
  },
  Map: vi.fn(),
}));

describe('MapComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a map container div', () => {
    const { container } = render(<MapComponent lat={10.85} lng={106.7719} />);
    const mapDiv = container.firstChild as HTMLElement;
    expect(mapDiv).toBeInTheDocument();
    expect(mapDiv.className).toContain('rounded-2xl');
  });

  it('renders with custom zoom', () => {
    const { container } = render(<MapComponent lat={10.85} lng={106.7719} zoom={12} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('updates view when lat/lng/zoom change', () => {
    const { rerender } = render(<MapComponent lat={10.85} lng={106.7719} />);
    rerender(<MapComponent lat={10.8} lng={106.77} zoom={14} />);
  });
});
