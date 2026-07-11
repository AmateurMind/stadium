import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { StaffDashboard } from '../src/components/Dashboard/StaffDashboard';

// Mock global fetch
const mockFetch = global.fetch as any;

describe('StaffDashboard Visualizer', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders overall stadium occupancy statistics and alerts list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        zones: [
          {
            zone_id: 'gate-a',
            zone_name: 'Gate A Entrance',
            zone_type: 'gate',
            current_occupancy: 4500,
            max_capacity: 5000,
            occupancy_pct: 90.0,
            status: 'congested',
            wait_time_minutes: 25,
            is_accessible: true,
          },
        ],
        alerts: [
          {
            zone_id: 'gate-a',
            severity: 'critical',
            message: 'Gate A is extremely congested.',
            recommended_action: 'Open overflow Gate B lanes.',
            estimated_impact: 'Reduce wait times by 10 minutes.',
          },
        ],
        total_attendance: 4500,
        stadium_capacity: 60000,
        overall_occupancy_pct: 7.5,
        source: 'gemini',
      }),
    });

    render(<StaffDashboard />);

    // Loader is visible initially
    expect(screen.getByText(/loading crowd data.../i)).toBeInTheDocument();

    // Wait for the statistics dashboard elements to render
    await waitFor(() => {
      expect(screen.getByText(/total attendance/i)).toBeInTheDocument();
      expect(screen.getByText('4,500')).toBeInTheDocument();
      expect(screen.getByText(/7.5%/i)).toBeInTheDocument();
      expect(screen.getByText(/active alerts/i)).toBeInTheDocument();
    });

    // Check that alerts details are displayed
    expect(screen.getByText(/Gate A is extremely congested./i)).toBeInTheDocument();
    expect(screen.getByText(/Open overflow Gate B lanes./i)).toBeInTheDocument();
  });
});
