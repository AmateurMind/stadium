import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, type Mock } from 'vitest';
import { ZoneMap } from '../src/components/Zones/ZoneMap';

const mockFetch = global.fetch as Mock;

describe('ZoneMap Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders all zones initially and filters them correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        zones: [
          {
            zone_id: 'gate-a',
            zone_name: 'Gate A',
            zone_type: 'gate',
            current_occupancy: 2000,
            max_capacity: 5000,
            occupancy_pct: 40.0,
            status: 'normal',
            wait_time_minutes: 2,
            is_accessible: true,
          },
          {
            zone_id: 'section-201',
            zone_name: 'Section 201',
            zone_type: 'seating',
            current_occupancy: 3800,
            max_capacity: 4000,
            occupancy_pct: 95.0,
            status: 'congested',
            wait_time_minutes: 0,
            is_accessible: false,
          },
        ],
        total: 2,
      }),
    });

    render(<ZoneMap />);

    // Renders filter type select options
    expect(screen.getByLabelText(/zone type:/i)).toBeInTheDocument();

    // Renders the loaders
    expect(screen.getByText(/loading zones.../i)).toBeInTheDocument();

    // Wait for the cards to load
    await waitFor(() => {
      expect(screen.getByText('Gate A')).toBeInTheDocument();
      expect(screen.getByText('Section 201')).toBeInTheDocument();
    });

    // Check accessibility tags
    expect(screen.getByText(/wheelchair accessible/i)).toBeInTheDocument();

    // Mock next response for filter change
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        zones: [
          {
            zone_id: 'gate-a',
            zone_name: 'Gate A',
            zone_type: 'gate',
            current_occupancy: 2000,
            max_capacity: 5000,
            occupancy_pct: 40.0,
            status: 'normal',
            wait_time_minutes: 2,
            is_accessible: true,
          },
        ],
        total: 1,
      }),
    });

    // Filter to Gates
    const select = screen.getByLabelText(/zone type:/i);
    fireEvent.change(select, { target: { value: 'gate' } });

    await waitFor(() => {
      expect(screen.getByText('Gate A')).toBeInTheDocument();
      expect(screen.queryByText('Section 201')).not.toBeInTheDocument();
    });
  });
});
