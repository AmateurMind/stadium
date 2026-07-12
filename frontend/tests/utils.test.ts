import { describe, it, expect, beforeEach, type Mock } from 'vitest';
import { validateFanQuery } from '../src/utils/validators';
import {
  getSessionId,
  getStatusColor,
  getStatusBgColor,
  getSeverityColor,
  formatZoneType,
  getZoneIcon,
  getLanguageName,
} from '../src/utils/formatters';
import { apiClient } from '../src/api/client';

const mockFetch = global.fetch as Mock;

describe('Validator Utilities', () => {
  it('validates a correct FanQuery payload', () => {
    const res = validateFanQuery({
      message: 'Hello',
      language: 'en',
      stadium_id: 'metlife',
      session_id: 'sess-12345-abcde',
      category: 'general',
    });
    expect(res.success).toBe(true);
  });

  it('rejects an invalid FanQuery payload', () => {
    const res = validateFanQuery({
      message: '', // Too short
      language: 'invalid-lang',
      stadium_id: 'metlife',
      session_id: 'sess-123', // Too short (min 8)
      category: 'general',
    });
    expect(res.success).toBe(false);
  });
});

describe('Formatter Utilities', () => {
  it('generates a session ID and caches it in sessionStorage', () => {
    const id = getSessionId();
    expect(id).toMatch(/^sess-/);
    expect(getSessionId()).toBe(id); // Returns cached value
  });

  it('returns appropriate color levels', () => {
    expect(getStatusColor('normal')).toBe('text-green-600');
    expect(getStatusBgColor('busy')).toBe('bg-amber-100');
    expect(getSeverityColor('critical').bg).toBe('bg-red-50');
  });

  it('formats zone type and zone icon correctly', () => {
    expect(formatZoneType('gate')).toBe('Gate');
    expect(formatZoneType('concession')).toBe('Food & Drink');
    expect(getZoneIcon('first_aid')).toBe('🏥');
    expect(getZoneIcon('vip')).toBe('⭐');
  });

  it('translates ISO code to display name', () => {
    expect(getLanguageName('es')).toBe('Español');
    expect(getLanguageName('zh')).toBe('中文');
  });
});

describe('API Client Error Handling', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('handles custom error messages from server', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Custom error detail' }),
    });

    await expect(apiClient.getCrowdAnalysis()).rejects.toThrow('Custom error detail');
  });
});
