import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, type Mock } from 'vitest';
import { FanAssistant } from '../src/components/Assistant/FanAssistant';
import { useStadiumStore } from '../src/store/stadiumStore';

// Mock the global fetch
const mockFetch = global.fetch as Mock;

describe('FanAssistant Chat Interface', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useStadiumStore.getState().clearChat();
  });

  it('renders stadium select dropdown and language options correctly', async () => {
    // Mock the grounds response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        grounds: [
          {
            id: 'metlife',
            title: 'MetLife Stadium',
            locale: { city: 'East Rutherford', region: 'NJ', country: 'USA' },
            seats: 82500,
            verified: true,
          },
          {
            id: 'sofi',
            title: 'SoFi Stadium',
            locale: { city: 'Inglewood', region: 'CA', country: 'USA' },
            seats: 70240,
            verified: true,
          },
        ],
        total: 2,
      }),
    });

    render(<FanAssistant />);

    // Check language options
    const langSelect = screen.getByLabelText(/language:/i);
    expect(langSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /español/i })).toBeInTheDocument();

    // Wait for the stadiums to be loaded and verified
    await waitFor(() => {
      expect(screen.getByText(/MetLife Stadium/i)).toBeInTheDocument();
      expect(screen.getByText(/SoFi Stadium/i)).toBeInTheDocument();
    });
  });

  it('allows user to send messages and renders reply correctly', async () => {
    mockFetch
      // First fetch for grounds list
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ grounds: [], total: 0 }),
      })
      // Second fetch for ask assistant
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Restrooms are located near section 101.',
          language: 'en',
          category: 'amenities',
          source: 'rules',
          suggested_actions: ['Find food', 'Show entries'],
        }),
      });

    render(<FanAssistant />);

    const input = screen.getByPlaceholderText(/ask about navigation/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    const amenitiesButton = screen.getByRole('radio', { name: /amenities/i });

    fireEvent.click(amenitiesButton);
    fireEvent.change(input, { target: { value: 'Where is the restroom?' } });
    fireEvent.click(sendButton);

    // Verify loading indicator/thinking state renders
    expect(screen.getByText(/thinking.../i)).toBeInTheDocument();

    // Wait for the response to be rendered in chat log
    await waitFor(() => {
      expect(screen.getByText(/Restrooms are located near section 101/i)).toBeInTheDocument();
      expect(screen.getByText(/suggested:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /find food/i })).toBeInTheDocument();
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody.category).toBe('amenities');
  });
});
