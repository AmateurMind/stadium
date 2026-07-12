import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, type Mock } from 'vitest';
import { StaffDashboard } from '../src/components/Dashboard/StaffDashboard';

// Mock global fetch
const mockFetch = global.fetch as Mock;

describe('StaffDashboard Visualizer', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders overall stadium occupancy statistics and alerts list', async () => {
    mockFetch
      .mockResolvedValueOnce({
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
          operations_brief: {
            risk_level: 'critical',
            headline: 'Gate A Entrance is the highest-pressure zone at 90% capacity.',
            recommended_staffing: ['Position supervisors at Gate A Entrance.'],
            fan_messaging: ['Please allow extra time near Gate A Entrance.'],
            accessibility_note: 'Protect step-free movement near Gate A Entrance.',
            sustainability_note: 'Prioritize app push alerts and digital signage.',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          match_id: 'mt_010249745',
          status: 'live',
          minute: 74,
          teams: {
            home: { name: 'Argentina', goals: 2 },
            away: { name: 'France', goals: 1 },
          },
          overview: {
            expected_goals: {
              all: { home: 2.34, away: 0.87 },
              first_half: { home: 1.21, away: 0.34 },
              second_half: { home: 1.13, away: 0.53 },
            },
            possession_pct: { home: 54, away: 46 },
            shots: { home: 12, away: 7 },
            fouls: { home: 11, away: 14 },
            corners: { home: 6, away: 4 },
          },
          source: 'thestatsapi',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stadium_id: 'metlife',
          stadium_name: 'MetLife Stadium',
          data_notice: 'Prototype data: simulated services.',
          accessibility: {
            voice_navigation: 'Start at Gate A.',
            wheelchair_route: 'Use Gate A.',
            sign_language_avatar_script: 'Welcome.',
            live_caption_preview: '[Caption preview] Guidance.',
            audio_description: 'Audio description via app.',
          },
          food_recommendation: {
            recommended_venue: 'Food Court B',
            nearby_landmark: 'Gate B concourse',
            estimated_wait_minutes: 4,
            kickoff_in_minutes: 30,
            reasoning: 'Shorter queue.',
            source: 'simulated',
          },
          transport: {
            weather_summary: 'Clear.',
            delay_summary: 'No delay.',
            options: [],
            source: 'simulated',
          },
          vision: {
            detection_capabilities: ['Long queues', 'Spills', 'Fights', 'Unattended bags'],
            active_incidents: [
              {
                detection_type: 'long_queue',
                location: 'Gate A Entrance',
                severity: 'critical',
                confidence_pct: 90,
                generated_guidance: 'Deploy queue stewards.',
              },
            ],
            response_playbooks: [
              {
                detection_type: 'unattended_bag',
                location: 'Camera feed required',
                severity: 'critical',
                confidence_pct: 0,
                generated_guidance: 'Notify security immediately.',
              },
            ],
            data_notice: 'Camera feed required.',
            source: 'simulated',
          },
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
      expect(screen.getByText(/fifa 2026 operations brief/i)).toBeInTheDocument();
      expect(screen.getByText(/critical risk/i)).toBeInTheDocument();
      expect(screen.getByText(/vision ai \+ safety guidance/i)).toBeInTheDocument();
      expect(screen.getAllByText(/long queue/i).length).toBeGreaterThan(0);
    });

    // Check that alerts details are displayed
    expect(screen.getByText(/Gate A is extremely congested./i)).toBeInTheDocument();
    expect(screen.getByText(/Open overflow Gate B lanes./i)).toBeInTheDocument();
  });
});
