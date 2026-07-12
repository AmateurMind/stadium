import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { FanServices } from '../src/components/Services/FanServices';
import { useStadiumStore } from '../src/store/stadiumStore';

const mockFetch = global.fetch as Mock;

describe('FanServices', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useStadiumStore.getState().setStadiumId('metlife');
  });

  it('renders accessible support, food guidance, and transport options', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stadium_id: 'metlife',
        stadium_name: 'MetLife Stadium',
        data_notice: 'Prototype data: simulated services.',
        accessibility: {
          voice_navigation: 'Start at Gate A.',
          wheelchair_route: 'Use Gate A and the elevator.',
          sign_language_avatar_script: 'Welcome to the stadium.',
          live_caption_preview: '[Caption preview] Use Gate A.',
          audio_description: 'Audio description via the stadium app.',
        },
        food_recommendation: {
          recommended_venue: 'Food Court B',
          nearby_landmark: 'Gate B concourse',
          estimated_wait_minutes: 4,
          kickoff_in_minutes: 30,
          reasoning: 'Food Court A is crowded, so choose Food Court B.',
          source: 'simulated',
        },
        transport: {
          weather_summary: 'Clear conditions.',
          delay_summary: 'No delays.',
          options: [
            { mode: 'metro', recommendation: 'Use transit.', reason: 'Avoid crowds.' },
            { mode: 'shuttle', recommendation: 'Use shuttle.', reason: 'Accessible.' },
            { mode: 'rideshare', recommendation: 'Use pickup zone.', reason: 'Avoid gates.' },
            { mode: 'walking', recommendation: 'Follow signs.', reason: 'Conditions clear.' },
          ],
          source: 'simulated',
        },
        vision: {
          detection_capabilities: [],
          active_incidents: [],
          response_playbooks: [],
          data_notice: 'Camera feed required.',
          source: 'simulated',
        },
      }),
    });

    render(<FanServices />);

    await waitFor(() => {
      expect(screen.getByText(/accessible visitor support/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Food Court B' })).toBeInTheDocument();
      expect(screen.getByText(/rideshare \(uber\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /show avatar script/i }));
    expect(screen.getByText(/welcome to the stadium/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show live caption preview/i }));
    expect(screen.getByText(/caption preview/i)).toBeInTheDocument();
  });
});
