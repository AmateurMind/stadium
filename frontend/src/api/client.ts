/**
 * API client for StadiumSync.
 *
 * All functions throw Error on non-2xx responses.
 * Types match backend Pydantic models exactly.
 */

import type {
  AssistantResponse,
  CrowdAnalysis,
  FanQuery,
  ZoneStatus,
  GroundSummary,
} from '../types';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const apiOrigin = configuredApiBase.replace(/\/+$/, '');
const BASE_URL = apiOrigin ? `${apiOrigin}/api` : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      // Ignore JSON parse errors on error responses
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  /**
   * Send a query to the fan AI assistant.
   * POST /api/assistant
   */
  async askAssistant(query: FanQuery): Promise<AssistantResponse> {
    const res = await fetch(`${BASE_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    return handleResponse<AssistantResponse>(res);
  },

  /**
   * Get real-time crowd analysis and alerts.
   * GET /api/crowd
   */
  async getCrowdAnalysis(): Promise<CrowdAnalysis> {
    const res = await fetch(`${BASE_URL}/crowd`);
    return handleResponse<CrowdAnalysis>(res);
  },

  /**
   * Get filtered list of stadium zones.
   * GET /api/zones
   */
  async getZones(params?: {
    zone_type?: string;
    accessible_only?: boolean;
  }): Promise<{ zones: ZoneStatus[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.zone_type) query.set('zone_type', params.zone_type);
    if (params?.accessible_only) query.set('accessible_only', 'true');
    const qs = query.toString();
    const res = await fetch(`${BASE_URL}/zones${qs ? `?${qs}` : ''}`);
    return handleResponse<{ zones: ZoneStatus[]; total: number }>(res);
  },

  /**
   * Get all stadium grounds.
   * GET /api/grounds
   */
  async getGrounds(query?: string): Promise<{ grounds: GroundSummary[]; total: number }> {
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await fetch(`${BASE_URL}/grounds${qs}`);
    return handleResponse<{ grounds: GroundSummary[]; total: number }>(res);
  },
};
