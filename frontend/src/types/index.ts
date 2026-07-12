/**
 * Shared TypeScript interfaces for StadiumSync.
 * These mirror the Pydantic v2 models on the backend exactly.
 */

export type Language = 'en' | 'es' | 'fr' | 'ar' | 'pt' | 'de' | 'ja' | 'ko' | 'zh' | 'hi';

export type QueryCategory =
  | 'navigation'
  | 'amenities'
  | 'transport'
  | 'accessibility'
  | 'schedule'
  | 'safety'
  | 'general';

export type ZoneType =
  | 'gate'
  | 'concourse'
  | 'seating'
  | 'restroom'
  | 'concession'
  | 'first_aid'
  | 'parking'
  | 'vip';

export type ZoneStatusLevel = 'normal' | 'busy' | 'congested' | 'closed';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface FanQuery {
  message: string;
  language: Language;
  stadium_id: string;
  session_id: string;
  category: QueryCategory;
}

export interface AssistantResponse {
  reply: string;
  language: string;
  category: string;
  source: 'gemini' | 'rules';
  suggested_actions: string[];
}

export interface ZoneStatus {
  zone_id: string;
  zone_name: string;
  zone_type: ZoneType;
  current_occupancy: number;
  max_capacity: number;
  occupancy_pct: number;
  status: ZoneStatusLevel;
  wait_time_minutes: number;
  is_accessible: boolean;
}

export interface CrowdAlert {
  zone_id: string;
  severity: AlertSeverity;
  message: string;
  recommended_action: string;
  estimated_impact: string;
}

export interface OperationsBrief {
  risk_level: 'low' | 'elevated' | 'high' | 'critical';
  headline: string;
  recommended_staffing: string[];
  fan_messaging: string[];
  accessibility_note: string;
  sustainability_note: string;
}

export interface CrowdAnalysis {
  zones: ZoneStatus[];
  alerts: CrowdAlert[];
  total_attendance: number;
  stadium_capacity: number;
  overall_occupancy_pct: number;
  source: 'gemini' | 'rules';
  operations_brief: OperationsBrief;
}

export interface ChatMessage {
  role: 'fan' | 'assistant';
  content: string;
  timestamp: string;
  category?: string;
  suggested_actions?: string[];
}

export type AppView = 'assistant' | 'dashboard' | 'zones';

export interface LocaleInfo {
  city: string;
  region: string;
  country: string;
}

export interface GroundSummary {
  id: string;
  title: string;
  locale: LocaleInfo;
  seats: number;
  verified: boolean;
}

export interface MatchStats {
  match_id: string;
  status: string;
  minute: number;
  teams: {
    home: { name: string; goals: number };
    away: { name: string; goals: number };
  };
  overview: {
    expected_goals: {
      all: { home: number; away: number };
      first_half: { home: number; away: number };
      second_half: { home: number; away: number };
    };
    possession_pct: { home: number; away: number };
    shots: { home: number; away: number };
    fouls: { home: number; away: number };
    corners: { home: number; away: number };
  };
  source: string;
}
